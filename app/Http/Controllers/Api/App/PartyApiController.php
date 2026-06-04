<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\PartyDocument;
use App\Support\DocumentStorage;
use App\Support\DocumentValidation;
use App\Support\ListExport;
use App\Support\ListFilter;
use App\Support\InvoicePaymentCalculator;
use App\Support\LogoValidation;
use App\Support\PartyAccountReport;
use App\Support\PartyProfileData;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PartyApiController extends Controller
{
    public function postPartiesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 15);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            [$query, $filterSummary, $filters] = $this->filteredPartiesQuery($request);

            $parties = $query->paginate($perPage, ['*'], 'page', $currentPage);

            $outstandingByParty = InvoicePaymentCalculator::partyOutstandingRows($userId)
                ->keyBy('party_id');

            $parties->getCollection()->transform(function (Party $party) use ($outstandingByParty) {
                $row = $outstandingByParty->get($party->id);
                $party->setAttribute('invoice_count', $row['invoice_count'] ?? 0);
                $party->setAttribute('balance_due', $row['balance_due'] ?? 0);
                $party->setAttribute('received', $row['received'] ?? 0);
                $party->setAttribute('outstanding', $row['outstanding'] ?? 0);

                return $party;
            });

            return $this->sendJsonResponse(true, 'Party list loaded.', [
                'parties' => $parties,
                'filters' => $filters,
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartiesExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            [$query, $filterSummary] = $this->filteredPartiesQuery($request);
            $parties = $query->get();

            return ListExport::csv(
                'parties',
                'Party Export',
                $filterSummary,
                ['Name', 'Mobile', 'Address', 'State', 'Created'],
                $parties->map(fn ($party) => [
                    $party->name,
                    $party->mobile ?? '',
                    $party->address ?? '',
                    $party->state_code ?? '',
                    ListExport::formatCreatedAt($party->created_at),
                ]),
                ['TOTAL', $parties->count().' party', '', '', ''],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartiesExportPdf(Request $request)
    {
        try {
            [$query, $filterSummary] = $this->filteredPartiesQuery($request);
            $parties = $query->get();

            return ListExport::pdf(
                'parties',
                'Party Report',
                $filterSummary,
                ['Name', 'Mobile', 'Address', 'State', 'Created'],
                $parties->map(fn ($party) => [
                    $party->name,
                    $party->mobile ?? '—',
                    $party->address ?? '—',
                    $party->state_code ?? '—',
                    ListExport::formatCreatedAt($party->created_at),
                ]),
                $parties->count(),
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $party = Party::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $documents = PartyDocument::query()
                ->where('user_id', $request->user()->id)
                ->where('party_id', $party->id)
                ->orderByDesc('created_at')
                ->get();

            return $this->sendJsonResponse(true, 'Party loaded.', [
                'party' => $party,
                'documents' => $documents,
                'document_types' => DocumentValidation::partyOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyAccount(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $partyId = (int) $request->input('id');

            $account = PartyAccountReport::build($userId, $partyId, $request);

            return $this->sendJsonResponse(true, 'Party account loaded.', $account, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyStore(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), $this->partyValidationRules());

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $party = Party::query()->create([
                ...PartyProfileData::prepareForPersistence($validation->validated()),
                'user_id' => $request->user()->id,
            ]);

            return $this->sendJsonResponse(true, 'Party created.', [
                'party' => $party,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyUpdate(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                ...$this->partyValidationRules(),
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $party = Party::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $data = PartyProfileData::prepareForPersistence($validation->validated());
            unset($data['id']);
            $party->update($data);

            return $this->sendJsonResponse(true, 'Party updated.', [
                'party' => $party->fresh(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyLogoUpdate(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                'logo' => ['required_without:remove_logo', 'nullable', ...LogoValidation::fileRule()],
                'remove_logo' => ['nullable', 'boolean'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $party = Party::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            if ($request->boolean('remove_logo')) {
                $party->update(['logo_path' => null]);
            } elseif ($request->hasFile('logo')) {
                $party->update([
                    'logo_path' => DocumentStorage::store(
                        $request->file('logo'),
                        "parties/{$request->user()->id}/{$party->id}/logo",
                    ),
                ]);
            }

            return $this->sendJsonResponse(true, 'Party logo updated.', [
                'party' => $party->fresh(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $party = Party::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $party->delete();

            return $this->sendJsonResponse(true, 'Party deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string, 2: array<string, string>} */
    private function filteredPartiesQuery(Request $request): array
    {
        $userId = (int) $request->user()->id;
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);

        $query = Party::query()->where('user_id', $userId);
        ListFilter::applySearch($query, $search, [
            'name',
            'party_owner_name',
            'mobile',
            'email',
            'pan_no',
            'gst_no',
            'city',
            'district',
            'full_address',
            'address',
        ]);
        ListFilter::applyDate($query, $dateFilters, 'created_at');
        $query->orderBy('name');

        $filterSummary = ListFilter::summary([
            $search !== '' ? 'Search: '.$search : null,
            ListFilter::dateSummary($dateFilters),
        ], 'All party');

        return [$query, $filterSummary, [
            'search' => $search,
            ...$dateFilters,
        ]];
    }

    /** @return array<string, mixed> */
    private function partyValidationRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'party_owner_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'pan_no' => ['nullable', 'string', 'max:20'],
            'gst_no' => ['nullable', 'string', 'max:20'],
            'international_tax_id' => ['nullable', 'string', 'max:50'],
            'mobiles' => ['nullable', 'array'],
            'mobiles.*' => ['nullable', 'string', 'max:15'],
            'mobile' => ['nullable', 'string', 'max:15'],
            'full_address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'taluka' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'state_code' => ['nullable', 'string', 'max:5'],
            'country' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
        ];
    }
}
