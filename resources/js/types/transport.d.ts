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
}

export interface RouteLocation {
    id: number;
    name: string;
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
