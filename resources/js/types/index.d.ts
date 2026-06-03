export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    logo_url?: string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T;
