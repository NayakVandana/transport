<?php

namespace App\Support;

class ExpenseValidation
{
    /** @return list<string> */
    public static function categories(): array
    {
        return [
            'fuel',
            'maintenance',
            'toll',
            'driver_salary',
            'insurance',
            'permit',
            'office',
            'other',
        ];
    }

    /** @return list<string> */
    public static function paymentMethods(): array
    {
        return ['cash', 'bank', 'upi'];
    }

    /** @return array<string, string> */
    public static function categoryLabels(): array
    {
        return [
            'fuel' => 'Fuel',
            'maintenance' => 'Maintenance',
            'toll' => 'Toll',
            'driver_salary' => 'Driver Salary',
            'insurance' => 'Insurance',
            'permit' => 'Permit / Fitness',
            'office' => 'Office',
            'other' => 'Other',
        ];
    }

    /** @return array<string, string> */
    public static function paymentMethodLabels(): array
    {
        return [
            'cash' => 'Cash',
            'bank' => 'Bank',
            'upi' => 'UPI',
        ];
    }

    /** @return array{categories: list<array{value: string, label: string}>, payment_methods: list<array{value: string, label: string}>} */
    public static function optionsForFrontend(): array
    {
        $categories = [];
        foreach (self::categoryLabels() as $value => $label) {
            $categories[] = ['value' => $value, 'label' => $label];
        }

        $paymentMethods = [];
        foreach (self::paymentMethodLabels() as $value => $label) {
            $paymentMethods[] = ['value' => $value, 'label' => $label];
        }

        return [
            'categories' => $categories,
            'payment_methods' => $paymentMethods,
        ];
    }
}
