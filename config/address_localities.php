<?php

use App\Support\IndiaAddressLocalityData;

/**
 * Indian address hierarchy for profile forms (state → district → taluka → city → pincode).
 * All GST states / UTs (37). Seeded via AddressLocalitySeeder.
 *
 * To add more districts or pincodes, edit App\Support\IndiaAddressLocalityData.
 */
return IndiaAddressLocalityData::states();
