<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller as BaseController;
use Throwable;

abstract class Controller extends BaseController
{
    protected function sendJsonResponse(bool $success, string $message, mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => $success,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function sendError(Throwable $e): JsonResponse
    {
        report($e);

        $payload = config('app.debug') ? $e->getMessage() : null;

        return $this->sendJsonResponse(false, 'Something went wrong.', $payload, 500);
    }
}
