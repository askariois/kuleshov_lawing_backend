<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('projects', function () {
        return Inertia::render('projects');
    })->name('projects');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
