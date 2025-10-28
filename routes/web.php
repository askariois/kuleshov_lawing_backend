<?php

use App\Http\Controllers\Crawler\CrawlerController;
use App\Http\Controllers\Projects\ProjectsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectsController::class);
    Route::post('/scan', [CrawlerController::class, 'startScan']);
    Route::get('/progress', [CrawlerController::class, 'getProgress']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
