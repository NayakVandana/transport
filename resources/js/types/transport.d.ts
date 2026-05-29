export interface Company {
    id: number;
    name: string;
    pan?: string | null;
    gst?: string | null;
    udyam_reg_no?: string | null;
    udyam_date?: string | null;
    jurisdiction?: string | null;
    sac_code: string;
    entry_number_prefix?: string;
    entry_next_sequence?: number;
    igst_rate: string | number;
    bank_account_name?: string | null;
    bank_account_no?: string | null;
    bank_ifsc?: string | null;
    bank_name?: string | null;
    bank_branch?: string | null;
    address?: string | null;
}

export interface Vehicle {
    id: number;
    vehicle_number: string;
    vehicle_type?: string | null;
    brand?: string | null;
    model?: string | null;
    capacity?: string | null;
    fuel_type?: string | null;
    insurance_number?: string | null;
    insurance_expiry?: string | null;
    permit_number?: string | null;
    permit_expiry?: string | null;
    pollution_expiry?: string | null;
    fitness_expiry?: string | null;
    status: 'active' | 'inactive';
    documents?: EntityDocument[];
}

export interface Driver {
    id: number;
    name: string;
    mobile?: string | null;
    license_number?: string | null;
    license_expiry?: string | null;
    joining_date?: string | null;
    salary?: string | number | null;
    address?: string | null;
    status: 'active' | 'inactive';
    documents?: EntityDocument[];
}

export interface RouteLocation {
    id: number;
    name: string;
}

export interface Booking {
    id: number;
    booking_date: string;
    vehicle_id: number;
    driver_id?: number | null;
    freight: string | number;
    advance: string | number;
    empty_charge: string | number;
    maintenance: string | number;
    balance: string | number;
    vehicle?: Pick<Vehicle, 'id' | 'vehicle_number'>;
    driver?: Pick<Driver, 'id' | 'name' | 'mobile'>;
}

export interface Expense {
    id: number;
    expense_date: string;
    category: string;
    amount: string | number;
    description?: string | null;
    vehicle_id?: number | null;
    driver_id?: number | null;
    payment_method?: string | null;
    bill_copy?: string | null;
    bill_copy_url?: string | null;
    vehicle?: Pick<Vehicle, 'id' | 'vehicle_number'>;
    driver?: Pick<Driver, 'id' | 'name'>;
}

export interface ExpenseOption {
    value: string;
    label: string;
}

export interface EntityDocument {
    id: number;
    document_type: string;
    title?: string | null;
    file_path?: string | null;
    file_url?: string | null;
    expiry_date?: string | null;
    notes?: string | null;
}

export interface Payment {
    id: number;
    payment_date: string;
    direction: 'receipt' | 'payout';
    amount: string | number;
    payment_method: string;
    reference_number?: string | null;
    notes?: string | null;
    customer_id?: number | null;
    booking_id?: number | null;
    freight_invoice_id?: number | null;
    customer?: Pick<Customer, 'id' | 'name'>;
    booking?: Pick<Booking, 'id' | 'booking_date'> & {
        vehicle?: Pick<Vehicle, 'id' | 'vehicle_number'>;
    };
    freight_invoice?: Pick<FreightInvoice, 'id' | 'bill_number' | 'invoice_date'>;
}

export interface Customer {
    id: number;
    name: string;
    mobile?: string | null;
    address?: string | null;
    state_code?: string | null;
}

export interface FreightInvoiceLine {
    id?: number;
    serial_number?: number;
    entry_number?: string | null;
    entry_date?: string | null;
    vehicle_number?: string | null;
    route_from?: string | null;
    product_name?: string | null;
    weight: number | string;
    rate: number | string;
    freight?: number | string;
    advance_paid?: number | string;
    empty_container_charge?: number | string;
}

export interface FreightInvoice {
    id: number;
    bill_number: string;
    invoice_date: string;
    sac_code: string;
    status: 'draft' | 'finalized';
    total_weight: string | number;
    total_freight: string | number;
    total_empty_container_charge: string | number;
    net_value: string | number;
    total_advance: string | number;
    balance_amount: string | number;
    gross_freight: string | number;
    igst_rate: string | number;
    igst_amount: string | number;
    balance_in_words?: string | null;
    prepared_by?: string | null;
    checked_by?: string | null;
    customer_id: number;
    company_id: number;
    customer?: Customer;
    company?: Company;
    lines?: FreightInvoiceLine[];
}

export interface InvoiceTotals {
    total_weight: number;
    total_freight: number;
    total_empty_container_charge: number;
    net_value: number;
    total_advance: number;
    balance_amount: number;
    gross_freight: number;
    igst_amount: number;
}

export interface BookingTotals {
    count: number;
    freight: number;
    advance: number;
    empty_charge: number;
    maintenance: number;
    balance: number;
}
