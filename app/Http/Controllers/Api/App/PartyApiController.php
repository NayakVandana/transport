<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Support\ListExport;
use App\Support\ListFilter;
use App\Support\InvoicePaymentCalculator;
use App\Support\PartyAccountReport;
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

            return $this->sendJsonResponse(true, 'Party loaded.', [
                'party' => $party,
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
            $validation = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255'],
                'mobile' => ['nullable', 'string', 'max:15'],
                'address' => ['nullable', 'string'],
                'state_code' => ['nullable', 'string', 'max:5'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $party = Party::query()->create([
                ...$validation->validated(),
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
                'name' => ['required', 'string', 'max:255'],
                'mobile' => ['nullable', 'string', 'max:15'],
                'address' => ['nullable', 'string'],
                'state_code' => ['nullable', 'string', 'max:5'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $party = Party::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $data = $validation->validated();
            unset($data['id']);
            $party->update($data);

            return $this->sendJsonResponse(true, 'Party updated.', [
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
        ListFilter::applySearch($query, $search, ['name', 'mobile', 'address']);
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
}
