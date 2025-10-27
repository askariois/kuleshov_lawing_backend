<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('projects'))->assertRedirect(route('login'));
});

test('authenticated users can visit the projects', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('projects'))->assertOk();
});
