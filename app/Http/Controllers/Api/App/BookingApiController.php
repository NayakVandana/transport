<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookingRequest;
use App\Models\Booking;
use App\Support\BookingCalculator;
use App\Support\BookingReport;
use App\Support\BookingValidation;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookingApiController extends Controller
{
    public function postBookingsList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = BookingReport::filtersFromRequest($request, $userId);
            $vehicles = BookingReport::vehiclesForUser($userId);
            $query = BookingReport::filteredQuery($userId, $filters);
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $paginator = (clone $query)->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Bookings loaded.', [
                'bookings' => $paginator,
                'vehicles' => $vehicles,
                'filters' => $filters,
                'totals' => BookingReport::totals($query),
                'filterSummary' => BookingReport::filterSummary($filters, $vehicles),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postBookingMeta(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;

            return $this->sendJsonResponse(true, 'Booking form data loaded.', [
                'vehicles' => BookingReport::vehiclesForUser($userId),
                'drivers' => BookingReport::driversForUser($userId),
                'validationMessages' => BookingValidation::forFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postBookingShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $booking = Booking::query()
                ->with([
                    'vehicle:id,vehicle_number',
                    'driver:id,name,mobile',
                ])
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Booking loaded.', [
                'booking' => $booking,
                'vehicles' => BookingReport::vehiclesForUser((int) $request->user()->id),
                'drivers' => BookingReport::driversForUser((int) $request->user()->id),
                'validationMessages' => BookingValidation::forFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postBookingStore(BookingRequest $request)
    {
        try {
            $booking = Booking::query()->create([
                ...$this->payload($request),
                'user_id' => $request->user()->id,
            ]);

            return $this->sendJsonResponse(true, 'Booking created.', [
                'booking' => $booking->load([
                    'vehicle:id,vehicle_number',
                    'driver:id,name,mobile',
                ]),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postBookingUpdate(BookingRequest $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $booking = Booking::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $booking->update($this->payload($request));

            return $this->sendJsonResponse(true, 'Booking updated.', [
                'booking' => $booking->fresh()->load([
                    'vehicle:id,vehicle_number',
                    'driver:id,name,mobile',
                ]),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postBookingDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $booking = Booking::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $booking->delete();

            return $this->sendJsonResponse(true, 'Booking removed.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postBookingsExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = BookingReport::filtersFromRequest($request, $userId);
            $vehicles = BookingReport::vehiclesForUser($userId);
            $query = BookingReport::filteredQuery($userId, $filters);
            $bookings = $query->get();
            $totals = BookingReport::totals($query);
            $filterSummary = BookingReport::filterSummary($filters, $vehicles);
            $filename = 'bookings-'.now()->format('Y-m-d-His').'.csv';

            return response()->streamDownload(function () use ($bookings, $totals, $filterSummary) {
                $handle = fopen('php://output', 'w');
                fputcsv($handle, ['Bookings Export']);
                fputcsv($handle, ['Filters', $filterSummary]);
                fputcsv($handle, ['Generated', now()->format('d-m-Y H:i')]);
                fputcsv($handle, []);
                fputcsv($handle, ['Date', 'Vehicle', 'Driver', 'Freight', 'Advance', 'Empty', 'Maintenance', 'Balance']);

                foreach ($bookings as $booking) {
                    fputcsv($handle, [
                        $booking->booking_date->format('Y-m-d'),
                        $booking->vehicle?->vehicle_number ?? '',
                        $booking->driver?->name ?? '',
                        $booking->freight,
                        $booking->advance,
                        $booking->empty_charge,
                        $booking->maintenance,
                        $booking->balance,
                    ]);
                }

                fputcsv($handle, []);
                fputcsv($handle, [
                    'TOTAL',
                    $totals['count'].' bookings',
                    $totals['freight'],
                    $totals['advance'],
                    $totals['empty_charge'],
                    $totals['maintenance'],
                    $totals['balance'],
                ]);

                fclose($handle);
            }, $filename, [
                'Content-Type' => 'text/csv',
            ]);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postBookingsExportPdf(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = BookingReport::filtersFromRequest($request, $userId);
            $vehicles = BookingReport::vehiclesForUser($userId);
            $query = BookingReport::filteredQuery($userId, $filters);
            $bookings = $query->get();
            $totals = BookingReport::totals($query);

            $pdf = Pdf::loadView('bookings.export-pdf', [
                'bookings' => $bookings,
                'totals' => $totals,
                'filterSummary' => BookingReport::filterSummary($filters, $vehicles),
                'generatedAt' => now()->format('d-m-Y H:i'),
                'money' => fn ($amount) => BookingReport::formatMoney($amount),
            ])->setPaper('a4', 'landscape');

            return $pdf->download('bookings-'.now()->format('Y-m-d-His').'.pdf');
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, mixed> */
    private function payload(BookingRequest $request): array
    {
        $validated = $request->validated();
        $freight = (float) $validated['freight'];
        $advance = (float) ($validated['advance'] ?? 0);
        $emptyCharge = (float) ($validated['empty_charge'] ?? 0);
        $maintenance = (float) ($validated['maintenance'] ?? 0);

        return [
            ...$validated,
            'advance' => $advance,
            'empty_charge' => $emptyCharge,
            'maintenance' => $maintenance,
            'balance' => BookingCalculator::balance($freight, $advance, $emptyCharge, $maintenance),
        ];
    }
}
