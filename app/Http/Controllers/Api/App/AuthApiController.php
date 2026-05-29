<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Services\Auth\AuthService;
use Exception;
use Illuminate\Http\Request;

class AuthApiController extends Controller
{
    public function __construct(
        private readonly AuthService $auth,
    ) {}

    public function postAuthLogout(Request $request)
    {
        try {
            $request->user()?->currentAccessToken()?->delete();

            return $this->sendJsonResponse(true, 'Logged out successfully.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }
}
