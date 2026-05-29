<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('register', fn (Request $request) => Inertia::render('Auth/Register', [
        'redirect' => $request->query('redirect'),
    ]))->name('register');

    Route::get('login', fn (Request $request) => Inertia::render('Auth/Login', [
        'canResetPassword' => Route::has('password.request'),
        'status' => session('status'),
        'redirect' => $request->query('redirect'),
    ]))->name('login');

    Route::get('forgot-password', fn () => Inertia::render('Auth/ForgotPassword', [
        'status' => session('status'),
    ]))->name('password.request');

    Route::get('reset-password/{token}', fn (Request $request, string $token) => Inertia::render('Auth/ResetPassword', [
        'token' => $token,
        'email' => $request->query('email', ''),
    ]))->name('password.reset');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', fn () => Inertia::render('Auth/VerifyEmail', [
        'status' => session('status'),
    ]))->name('verification.notice');

    Route::get('confirm-password', fn () => Inertia::render('Auth/ConfirmPassword'))->name('password.confirm');
});
