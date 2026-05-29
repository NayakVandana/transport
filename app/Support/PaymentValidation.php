<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\FreightInvoice;
use Illuminate\Database\Eloquent\Collection;

class PaymentValidation
{
    /** @return list<string> */
    public static function directions(): array
    {
        return ['receipt', 'payout'];
    }

    /** @return list<string> */
    public static function paymentMethods(): array
    {
        return ExpenseValidation::paymentMethods();
    }

    /** @return array<string, string> */
    public static function directionLabels(): array
    {
        return [
            'receipt' => 'Receipt (money in)',
            'payout' => 'Payout (money out)',
        ];
    }

    /** @return array<string, string> */
    public static function paymentMethodLabels(): array
    {
        return ExpenseValidation::paymentMethodLabels();
    }

    /** @return array{directions: list<array{value: string, label: string}>, payment_methods: list<array{value: string, label: string}>} */
    public static function optionsForFrontend(): array
    {
        $directions = [];
        foreach (self::directionLabels() as $value => $label) {
            $directions[] = ['value' => $value, 'label' => $label];
        }

        $paymentMethods = [];
        foreach (self::paymentMethodLabels() as $value => $label) {
            $paymentMethods[] = ['value' => $value, 'label' => $label];
        }

        return [
            'directions' => $directions,
            'payment_methods' => $paymentMethods,
        ];
    }

    /** @return Collection<int, Customer> */
    public static function customersForUser(int $userId): Collection
    {
        return Customer::query()
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name', 'mobile']);
    }

    /** @return Collection<int, Booking> */
    public static function bookingsForUser(int $userId): Collection
    {
        return Booking::query()
            ->with('vehicle:id,vehicle_number')
            ->where('user_id', $userId)
            ->orderByDesc('booking_date')
            ->orderByDesc('id')
            ->limit(200)
            ->get(['id', 'booking_date', 'vehicle_id', 'balance']);
    }

    /** @return Collection<int, FreightInvoice> */
    public static function invoicesForUser(int $userId): Collection
    {
        return FreightInvoice::query()
            ->where('user_id', $userId)
            ->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->limit(200)
            ->get(['id', 'bill_number', 'invoice_date', 'balance_amount', 'customer_id']);
    }
}
