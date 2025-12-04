<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('image_duplicates', function (Blueprint $table) {
            $table->string('status')->default('idle')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('image_duplicates', function (Blueprint $table) {
            $table->dropColumn([
                'status',
            ]);
        });
    }
};
