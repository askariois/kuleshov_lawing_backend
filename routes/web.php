<?php

use App\Http\Controllers\Crawler\CrawlerController;
use App\Http\Controllers\Images\ImagesController;
use App\Http\Controllers\Projects\ProjectsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectsController::class);
    Route::post('/scan', [CrawlerController::class, 'startScan']);
    Route::get('/progress', [CrawlerController::class, 'getProgress']);

    Route::get('/images/{id}', [ImagesController::class, 'index']);
    Route::get('/primary-sorting/{id}', [ImagesController::class, 'primary_sorting'])->name('primary.sorting.index');;
    Route::post('/primary-sorting/{id}/sort', [ImagesController::class, 'primarySort']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
