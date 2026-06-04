<?php

namespace App\Support;

/**
 * Indian states / UTs with GST state codes and sample district → taluka → city → pincode chains.
 * Extend districts in the matching method to add more localities per state.
 */
class IndiaAddressLocalityData
{
    /** @return list<array<string, mixed>> */
    public static function states(): array
    {
        return [
            self::state('Jammu and Kashmir', '01', 1, [
                self::district('Srinagar', 'Srinagar', 'Srinagar', ['190001', '190008']),
                self::district('Jammu', 'Jammu', 'Jammu', ['180001', '180004']),
            ]),
            self::state('Himachal Pradesh', '02', 2, [
                self::district('Shimla', 'Shimla', 'Shimla', ['171001', '171003']),
                self::district('Kangra', 'Dharamshala', 'Dharamshala', ['176215']),
            ]),
            self::state('Punjab', '03', 3, [
                self::district('Ludhiana', 'Ludhiana', 'Ludhiana', ['141001', '141003']),
                self::district('Amritsar', 'Amritsar', 'Amritsar', ['143001', '143006']),
                self::district('Mohali', 'SAS Nagar', 'Mohali', ['160055', '160059']),
            ]),
            self::state('Chandigarh', '04', 4, [
                self::district('Chandigarh', 'Chandigarh', 'Chandigarh', ['160017', '160022']),
            ]),
            self::state('Uttarakhand', '05', 5, [
                self::district('Dehradun', 'Dehradun', 'Dehradun', ['248001', '248005']),
                self::district('Haridwar', 'Haridwar', 'Haridwar', ['249401', '249407']),
            ]),
            self::state('Haryana', '06', 6, [
                self::district('Gurugram', 'Gurugram', 'Gurugram', ['122001', '122002']),
                self::district('Faridabad', 'Faridabad', 'Faridabad', ['121001', '121002']),
                self::district('Panipat', 'Panipat', 'Panipat', ['132103']),
            ]),
            self::state('Delhi', '07', 7, [
                self::district('Central Delhi', 'New Delhi', 'New Delhi', ['110001', '110002']),
                self::district('South Delhi', 'South Delhi', 'New Delhi', ['110017', '110020']),
                self::district('North West Delhi', 'Rohini', 'Delhi', ['110085', '110086']),
            ]),
            self::state('Rajasthan', '08', 8, [
                self::district('Jaipur', 'Jaipur', 'Jaipur', ['302001', '302006']),
                self::district('Jodhpur', 'Jodhpur', 'Jodhpur', ['342001', '342003']),
                self::district('Udaipur', 'Udaipur', 'Udaipur', ['313001']),
            ]),
            self::state('Uttar Pradesh', '09', 9, [
                self::district('Lucknow', 'Lucknow', 'Lucknow', ['226001', '226010']),
                self::district('Ghaziabad', 'Ghaziabad', 'Ghaziabad', ['201001', '201010']),
                self::district('Noida', 'Gautam Buddha Nagar', 'Noida', ['201301', '201309']),
                self::district('Kanpur', 'Kanpur', 'Kanpur', ['208001', '208002']),
            ]),
            self::state('Bihar', '10', 10, [
                self::district('Patna', 'Patna', 'Patna', ['800001', '800004']),
                self::district('Gaya', 'Gaya', 'Gaya', ['823001']),
            ]),
            self::state('Sikkim', '11', 11, [
                self::district('East Sikkim', 'Gangtok', 'Gangtok', ['737101', '737102']),
            ]),
            self::state('Arunachal Pradesh', '12', 12, [
                self::district('Papum Pare', 'Itanagar', 'Itanagar', ['791111', '791113']),
            ]),
            self::state('Nagaland', '13', 13, [
                self::district('Kohima', 'Kohima', 'Kohima', ['797001']),
                self::district('Dimapur', 'Dimapur', 'Dimapur', ['797112']),
            ]),
            self::state('Manipur', '14', 14, [
                self::district('Imphal West', 'Imphal', 'Imphal', ['795001', '795004']),
            ]),
            self::state('Mizoram', '15', 15, [
                self::district('Aizawl', 'Aizawl', 'Aizawl', ['796001', '796005']),
            ]),
            self::state('Tripura', '16', 16, [
                self::district('West Tripura', 'Agartala', 'Agartala', ['799001', '799006']),
            ]),
            self::state('Meghalaya', '17', 17, [
                self::district('East Khasi Hills', 'Shillong', 'Shillong', ['793001', '793004']),
            ]),
            self::state('Assam', '18', 18, [
                self::district('Kamrup Metropolitan', 'Guwahati', 'Guwahati', ['781001', '781005']),
                self::district('Dibrugarh', 'Dibrugarh', 'Dibrugarh', ['786001']),
            ]),
            self::state('West Bengal', '19', 19, [
                self::district('Kolkata', 'Kolkata', 'Kolkata', ['700001', '700091']),
                self::district('North 24 Parganas', 'Barasat', 'Barasat', ['700124']),
                self::district('Howrah', 'Howrah', 'Howrah', ['711101', '711103']),
            ]),
            self::state('Jharkhand', '20', 20, [
                self::district('Ranchi', 'Ranchi', 'Ranchi', ['834001', '834002']),
                self::district('East Singhbhum', 'Jamshedpur', 'Jamshedpur', ['831001']),
            ]),
            self::state('Odisha', '21', 21, [
                self::district('Khordha', 'Bhubaneswar', 'Bhubaneswar', ['751001', '751012']),
                self::district('Cuttack', 'Cuttack', 'Cuttack', ['753001', '753002']),
            ]),
            self::state('Chhattisgarh', '22', 22, [
                self::district('Raipur', 'Raipur', 'Raipur', ['492001', '492010']),
                self::district('Bilaspur', 'Bilaspur', 'Bilaspur', ['495001']),
            ]),
            self::state('Madhya Pradesh', '23', 23, [
                self::district('Bhopal', 'Bhopal', 'Bhopal', ['462001', '462016']),
                self::district('Indore', 'Indore', 'Indore', ['452001', '452010']),
                self::district('Jabalpur', 'Jabalpur', 'Jabalpur', ['482001']),
            ]),
            self::gujarat(),
            self::state('Dadra and Nagar Haveli and Daman and Diu', '26', 26, [
                self::district('Dadra and Nagar Haveli', 'Silvassa', 'Silvassa', ['396230', '396235']),
                self::district('Daman', 'Daman', 'Daman', ['396210', '396215']),
                self::district('Diu', 'Diu', 'Diu', ['362520']),
            ]),
            self::maharashtra(),
            self::state('Karnataka', '29', 29, [
                self::district('Bengaluru Urban', 'Bengaluru', 'Bengaluru', ['560001', '560034']),
                self::district('Mysuru', 'Mysuru', 'Mysuru', ['570001', '570004']),
                self::district('Belagavi', 'Belagavi', 'Belagavi', ['590001']),
                self::district('Mangaluru', 'Mangaluru', 'Mangaluru', ['575001']),
            ]),
            self::state('Goa', '30', 30, [
                self::district('North Goa', 'Panaji', 'Panaji', ['403001', '403002']),
                self::district('South Goa', 'Margao', 'Margao', ['403601', '403602']),
            ]),
            self::state('Lakshadweep', '31', 31, [
                self::district('Lakshadweep', 'Kavaratti', 'Kavaratti', ['682555']),
            ]),
            self::state('Kerala', '32', 32, [
                self::district('Thiruvananthapuram', 'Thiruvananthapuram', 'Thiruvananthapuram', ['695001', '695004']),
                self::district('Ernakulam', 'Kochi', 'Kochi', ['682001', '682030']),
                self::district('Kozhikode', 'Kozhikode', 'Kozhikode', ['673001']),
            ]),
            self::state('Tamil Nadu', '33', 33, [
                self::district('Chennai', 'Chennai', 'Chennai', ['600001', '600028']),
                self::district('Coimbatore', 'Coimbatore', 'Coimbatore', ['641001', '641012']),
                self::district('Madurai', 'Madurai', 'Madurai', ['625001']),
            ]),
            self::state('Puducherry', '34', 34, [
                self::district('Puducherry', 'Puducherry', 'Puducherry', ['605001', '605003']),
                self::district('Karaikal', 'Karaikal', 'Karaikal', ['609602']),
            ]),
            self::state('Andaman and Nicobar Islands', '35', 35, [
                self::district('South Andaman', 'Port Blair', 'Port Blair', ['744101', '744102']),
            ]),
            self::state('Telangana', '36', 36, [
                self::district('Hyderabad', 'Hyderabad', 'Hyderabad', ['500001', '500032']),
                self::district('Rangareddy', 'Rangareddy', 'Rangareddy', ['500081']),
                self::district('Warangal', 'Warangal', 'Warangal', ['506001']),
            ]),
            self::state('Andhra Pradesh', '37', 37, [
                self::district('Visakhapatnam', 'Visakhapatnam', 'Visakhapatnam', ['530001', '530016']),
                self::district('Guntur', 'Guntur', 'Guntur', ['522001', '522002']),
                self::district('Krishna', 'Vijayawada', 'Vijayawada', ['520001', '520002']),
            ]),
            self::state('Ladakh', '38', 38, [
                self::district('Leh', 'Leh', 'Leh', ['194101', '194104']),
                self::district('Kargil', 'Kargil', 'Kargil', ['194103']),
            ]),
        ];
    }

    /** @return array<string, mixed> */
    private static function gujarat(): array
    {
        return [
            'name' => 'Gujarat',
            'state_code' => '24',
            'sort_order' => 24,
            'districts' => [
                [
                    'name' => 'Valsad',
                    'talukas' => [
                        [
                            'name' => 'Vapi',
                            'cities' => [
                                ['name' => 'Vapi', 'pincodes' => ['396191', '396195']],
                                ['name' => 'Sarigam', 'pincodes' => ['396155']],
                                ['name' => 'Silvassa', 'pincodes' => ['396230']],
                            ],
                        ],
                        [
                            'name' => 'Umbergaon',
                            'cities' => [
                                ['name' => 'Umbergaon', 'pincodes' => ['396170', '396171']],
                            ],
                        ],
                    ],
                ],
                [
                    'name' => 'Navsari',
                    'talukas' => [
                        [
                            'name' => 'Navsari',
                            'cities' => [
                                ['name' => 'Navsari', 'pincodes' => ['396445', '396450']],
                            ],
                        ],
                    ],
                ],
                [
                    'name' => 'Surat',
                    'talukas' => [
                        [
                            'name' => 'Surat City',
                            'cities' => [
                                ['name' => 'Surat', 'pincodes' => ['395003', '395009']],
                                ['name' => 'Hazira', 'pincodes' => ['394270']],
                            ],
                        ],
                        [
                            'name' => 'Bardoli',
                            'cities' => [
                                ['name' => 'Bardoli', 'pincodes' => ['394601']],
                            ],
                        ],
                    ],
                ],
                self::district('Ahmedabad', 'Ahmedabad City', 'Ahmedabad', ['380001', '380015']),
                self::district('Gandhinagar', 'Gandhinagar', 'Gandhinagar', ['382010', '382421']),
                self::district('Rajkot', 'Rajkot', 'Rajkot', ['360001', '360005']),
                self::district('Bhavnagar', 'Bhavnagar', 'Bhavnagar', ['364001']),
                self::district('Kutch', 'Bhuj', 'Bhuj', ['370001']),
                self::district('Jamnagar', 'Jamnagar', 'Jamnagar', ['361001']),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function maharashtra(): array
    {
        return [
            'name' => 'Maharashtra',
            'state_code' => '27',
            'sort_order' => 27,
            'districts' => [
                [
                    'name' => 'Mumbai City',
                    'talukas' => [
                        [
                            'name' => 'Mumbai',
                            'cities' => [
                                ['name' => 'Mumbai', 'pincodes' => ['400001', '400053']],
                            ],
                        ],
                    ],
                ],
                [
                    'name' => 'Mumbai Suburban',
                    'talukas' => [
                        [
                            'name' => 'Andheri',
                            'cities' => [
                                ['name' => 'Mumbai', 'pincodes' => ['400069', '400058']],
                            ],
                        ],
                    ],
                ],
                self::district('Thane', 'Thane', 'Thane', ['400601', '400602']),
                [
                    'name' => 'Raigad',
                    'talukas' => [
                        [
                            'name' => 'Panvel',
                            'cities' => [
                                ['name' => 'Navi Mumbai', 'pincodes' => ['410218', '410206']],
                                ['name' => 'Kalamboli', 'pincodes' => ['410218']],
                            ],
                        ],
                        [
                            'name' => 'Alibag',
                            'cities' => [
                                ['name' => 'Alibag', 'pincodes' => ['402201']],
                            ],
                        ],
                    ],
                ],
                self::district('Pune', 'Pune City', 'Pune', ['411001', '411014']),
                self::district('Nagpur', 'Nagpur', 'Nagpur', ['440001', '440010']),
                self::district('Nashik', 'Nashik', 'Nashik', ['422001', '422002']),
                self::district('Chhatrapati Sambhajinagar', 'Chhatrapati Sambhajinagar', 'Chhatrapati Sambhajinagar', ['431001']),
            ],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $districts
     * @return array<string, mixed>
     */
    private static function state(string $name, string $stateCode, int $sortOrder, array $districts): array
    {
        return [
            'name' => $name,
            'state_code' => $stateCode,
            'sort_order' => $sortOrder,
            'districts' => $districts,
        ];
    }

    /**
     * @param  list<string>  $pincodes
     * @return array<string, mixed>
     */
    private static function district(string $district, string $taluka, string $city, array $pincodes): array
    {
        return [
            'name' => $district,
            'talukas' => [
                [
                    'name' => $taluka,
                    'cities' => [
                        [
                            'name' => $city,
                            'pincodes' => $pincodes,
                        ],
                    ],
                ],
            ],
        ];
    }
}
