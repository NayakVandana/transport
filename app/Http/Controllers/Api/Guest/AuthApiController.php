<?php

namespace App\Http\Controllers\Api\Guest;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\AuthService;
use Exception;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;

class AuthApiController extends Controller
{
    public function __construct(
        private readonly AuthService $auth,
    ) {}

    public function postAuthRegister(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $user = $this->auth->register($validation->validated());
            event(new Registered($user));

            $token = $this->auth->createApiToken($user);

            return $this->sendJsonResponse(true, 'Registered successfully.', [
                'user' => $this->formatUser($user),
                'token' => $token,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postAuthLogin(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'email' => ['required', 'email'],
                'password' => ['required', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $user = $this->auth->attemptLogin(
                $request->input('email'),
                $request->input('password'),
            );

            if ($user === null) {
                return $this->sendJsonResponse(false, 'Invalid credentials.', null, 200);
            }

            $token = $this->auth->createApiToken($user);

            return $this->sendJsonResponse(true, 'Logged in successfully.', [
                'user' => $this->formatUser($user),
                'token' => $token,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, mixed> */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
        ];
    }
}
