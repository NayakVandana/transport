export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    photo_url?: string | null;
    full_address?: string | null;
    city?: string | null;
    taluka?: string | null;
    district?: string | null;
    pincode?: string | null;
    state_code?: string | null;
    country?: string | null;
    address?: string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T;
