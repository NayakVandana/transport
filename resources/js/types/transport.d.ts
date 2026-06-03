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
    created_at?: string | null;
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
    created_at?: string | null;
    documents?: EntityDocument[];
}

export interface RouteLocation {
    id: number;
    name: string;
    created_at?: string | null;
}

export interface Entrybook {
    id: number;
    entry_number: string;
    entry_date: string;
    vehicle_id: number;
    party_id?: number | null;
    route_from?: string | null;
    freight: string | number;
    advance: string | number;
    detention: string | number;
    balance: string | number;
    vehicle?: Pick<Vehicle, 'id' | 'vehicle_number'>;
    party?: Pick<Party, 'id' | 'name'>;
    created_at?: string | null;
    invoice_id?: number | null;
    bill_number?: string | null;
}

export interface EntrybookTotals {
    count: number;
    freight: number;
    advance: number;
    detention: number;
    balance: number;
}

export interface VehicleExpense {
    id: number;
    expense_date: string;
    vehicle_id: number;
    freight: string | number;
    advance: string | number;
    empty_charge: string | number;
    toll: string | number;
    maintenance: string | number;
    balance: string | number;
    vehicle?: Pick<Vehicle, 'id' | 'vehicle_number'>;
    created_at?: string | null;
}

export interface VehicleExpenseTotals {
    count: number;
    freight: number;
    advance: number;
    empty_charge: number;
    toll: number;
    maintenance: number;
    balance: number;
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

export interface Party {
    id: number;
    name: string;
    mobile?: string | null;
    address?: string | null;
    state_code?: string | null;
    invoice_count?: number;
    balance_due?: number | string;
    received?: number | string;
    outstanding?: number | string;
    created_at?: string | null;
}

export interface PartyOverview {
    invoice_count: number;
    entry_count?: number;
    balance_due: number;
    received: number;
    outstanding: number;
    last_invoice_date?: string | null;
    last_payment_date?: string | null;
}

export interface PartyInvoiceRow {
    id: number;
    bill_number: string;
    invoice_date: string;
    status: string;
    net_value: number;
    balance_amount: number;
    received: number;
    outstanding: number;
    payment_status: InvoicePaymentStatus;
}

export interface PartyEntrybookRow {
    id: number;
    entry_number: string;
    entry_date: string;
    vehicle_number: string;
    route_from: string;
    freight: number;
    advance: number;
    detention: number;
    balance: number;
    invoice_id?: number | null;
    bill_number?: string | null;
}

export interface PartyPaymentRow {
    id: number;
    payment_date: string;
    amount: number;
    payment_mode?: string | null;
    reference_no?: string | null;
    notes?: string | null;
    freight_invoice_id: number | null;
    bill_number: string;
}

export interface PartyLedgerEntry {
    date: string;
    type: 'invoice' | 'payment';
    reference: string;
    particulars: string;
    debit: number;
    credit: number;
    balance: number;
    invoice_id?: number | null;
    payment_id?: number | null;
}

export interface PartyAccountData {
    party: Party;
    overview: PartyOverview;
    invoices: PartyInvoiceRow[];
    entrybooks: PartyEntrybookRow[];
    payments: PartyPaymentRow[];
    ledger: PartyLedgerEntry[];
    filters: { date_from?: string; date_to?: string };
    filterSummary: string;
}

export type InvoicePaymentStatus = 'paid' | 'partial' | 'pending';

export interface FreightInvoiceLine {
    id?: number;
    serial_number?: number;
    entrybook_id?: number | null;
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
    detention?: number | string;
    weightman?: number | string;
    parking?: number | string;
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
    total_detention: string | number;
    total_weightman: string | number;
    total_parking: string | number;
    net_value: string | number;
    total_advance: string | number;
    balance_amount: string | number;
    gross_freight: string | number;
    igst_rate: string | number;
    igst_amount: string | number;
    balance_in_words?: string | null;
    prepared_by?: string | null;
    checked_by?: string | null;
    party_id: number;
    company_id: number;
    party?: Party;
    company?: Company;
    lines?: FreightInvoiceLine[];
    payments?: InvoicePayment[];
    received?: string | number;
    outstanding?: string | number;
    payment_status?: InvoicePaymentStatus;
    created_at?: string | null;
}

export interface InvoicePayment {
    id: number;
    freight_invoice_id: number | null;
    party_id: number;
    payment_date: string;
    amount: string | number;
    payment_mode?: string | null;
    reference_no?: string | null;
    notes?: string | null;
    party?: Pick<Party, 'id' | 'name'>;
    freight_invoice?: Pick<FreightInvoice, 'id' | 'bill_number' | 'balance_amount'> | null;
    created_at?: string | null;
}

export interface PartyPaymentSummary {
    balance_due: number;
    received: number;
    outstanding: number;
}

export interface OpenInvoiceOption {
    id: number;
    bill_number: string;
    party_id: number;
    party_name: string;
    balance_amount: number;
    received: number;
    outstanding: number;
}

export interface PartyOutstanding {
    party_id: number;
    party_name: string;
    invoice_count: number;
    balance_due: number;
    received: number;
    outstanding: number;
}

export interface InvoicePaymentTotals {
    count: number;
    amount: number;
}

export interface InvoicePaymentSummary {
    received: number;
    outstanding: number;
    payment_status: InvoicePaymentStatus;
}

export interface InvoiceTotals {
    total_weight: number;
    total_freight: number;
    total_empty_container_charge: number;
    total_detention: number;
    total_weightman: number;
    total_parking: number;
    net_value: number;
    total_advance: number;
    balance_amount: number;
    gross_freight: number;
    igst_amount: number;
}
