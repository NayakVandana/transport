<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

trait RedirectsToInvoiceReturn
{
    protected function redirectAfterMasterStore(
        Request $request,
        string $fallbackRoute,
        string $message,
    ): RedirectResponse {
        $returnRoute = $request->input('return_route');
        $returnId = $request->input('return_id');

        if ($this->isAllowedReturnRoute($returnRoute)) {
            $parameters = [];
            if ($returnId && $returnRoute === 'invoices.edit') {
                $parameters = ['invoice' => $returnId];
            }

            return redirect()
                ->route($returnRoute, $parameters)
                ->with('success', $message);
        }

        return redirect()->route($fallbackRoute)->with('success', $message);
    }

    /** @return array{return_route: string|null, return_id: int|null, return_label: string|null} */
    protected function returnContext(Request $request): array
    {
        $returnRoute = $request->query('return_route');
        $returnId = $request->query('return_id');

        $label = null;
        if ($this->isAllowedReturnRoute($returnRoute)) {
            $label = match ($returnRoute) {
                'invoices.create' => 'Back to New Invoice',
                'invoices.edit' => 'Back to Invoice',
                default => 'Back',
            };
        }

        return [
            'return_route' => is_string($returnRoute) ? $returnRoute : null,
            'return_id' => is_numeric($returnId) ? (int) $returnId : null,
            'return_label' => $label,
        ];
    }

    private function isAllowedReturnRoute(mixed $returnRoute): bool
    {
        return is_string($returnRoute)
            && in_array($returnRoute, ['invoices.create', 'invoices.edit'], true)
            && Route::has($returnRoute);
    }
}
