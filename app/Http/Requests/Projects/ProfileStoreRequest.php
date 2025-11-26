<?php

namespace App\Http\Requests\Projects;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileStoreRequest extends FormRequest
{
   /**
    * Get the validation rules that apply to the request.
    *
    * @return array<string, ValidationRule|array<mixed>|string>
    */
   public function rules(): array
   {
      return [
         'url' => 'required|url|regex:/^https:\/\//',
         'name' => 'required|string|max:255',
         'parent_id' => 'nullable',
         'return_url' => 'nullable',
      ];
   }

   public function messages(): array
   {
      return [
         'url.required' => 'Введите URL сайта',
         'url.url' => 'Введите корректный URL',
         'url.regex' => 'URL должен начинаться с https://',
      ];
   }
}
