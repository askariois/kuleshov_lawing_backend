<?php

use App\Http\Controllers\Crawler\CrawlerController;
use App\Http\Controllers\Images\ImagesController;
use App\Http\Controllers\Projects\ProjectsController;
use App\Http\Controllers\Sort\SortController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('home');

Route::get('/verification', [ImagesController::class, 'verification']);


Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectsController::class);
    Route::post('/scan', [CrawlerController::class, 'startScan']);
    Route::get('/progress', [CrawlerController::class, 'getProgress']);

    Route::get('/images/{id}', [ImagesController::class, 'index']);
    Route::get('/customer_request/{id}', [ImagesController::class, 'customer_request']);
    Route::get('/tor/{id}', [ImagesController::class, 'tor']);

    Route::get('/queue/{id}', [ImagesController::class, 'queue']);
    Route::get('/single/{single_id}', [ImagesController::class, 'single']);

    Route::get('/primary-sorting/{id}', [SortController::class, 'sort'])->name('primary.sorting.index');;
    Route::post('/primary-sorting/{id}/sort', [SortController::class, 'storeSorting']);
    Route::get('/secondary-sorting/{id}', [SortController::class, 'sort_secondary'])->name('secondary.sorting.index');;
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
