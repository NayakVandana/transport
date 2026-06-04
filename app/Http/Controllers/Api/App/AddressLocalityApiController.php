<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Support\AddressLocalityRegistry;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AddressLocalityApiController extends Controller
{
    public function postAddressLocalityOptions(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'level' => ['required', 'string', Rule::in(['state', 'district', 'taluka', 'city', 'pincode'])],
                'state_code' => ['nullable', 'string', 'max:5'],
                'district' => ['nullable', 'string', 'max:100'],
                'taluka' => ['nullable', 'string', 'max:100'],
                'city' => ['nullable', 'string', 'max:100'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $data = $validation->validated();

            $options = AddressLocalityRegistry::options(
                $data['level'],
                $data['state_code'] ?? null,
                $data['district'] ?? null,
                $data['taluka'] ?? null,
                $data['city'] ?? null,
            );

            return $this->sendJsonResponse(true, 'Address options loaded.', [
                'options' => $options,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }
}
