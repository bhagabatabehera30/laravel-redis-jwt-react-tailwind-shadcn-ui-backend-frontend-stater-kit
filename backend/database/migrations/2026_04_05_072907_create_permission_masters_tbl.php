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
        Schema::create('permission_masters', function (Blueprint $table) {
            $table->id();
            $table->string('key');
            $table->string('label');
            $table->foreignId('pmaster_group_id')->constrained('permission_master_groups')->index();
            $table->bigInteger('parent_id')->nullable()->index();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_masters');
    }
};
