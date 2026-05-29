<?php

use App\Http\Controllers\Api\Guest\AuthApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/auth-register', [AuthApiController::class, 'postAuthRegister']);
    Route::post('/auth/auth-login', [AuthApiController::class, 'postAuthLogin']);
});
