import { getUserApiToken } from '@/auth/authToken';
import axios, { isAxiosError } from 'axios';
import type { ApiEnvelope } from './apiClient';

function appHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
    };

    const token = getUserApiToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

export async function appApiPost<T>(
    path: string,
    data: Record<string, unknown> = {},
): Promise<T> {
    const res = await axios.post<T>(`/api/v1/app${path}`, data, {
        headers: appHeaders(),
    });

    return res.data;
}

export async function appApiDownload(
    path: string,
    data: Record<string, unknown>,
    filename: string,
): Promise<void> {
    const res = await axios.post(`/api/v1/app${path}`, data, {
        headers: appHeaders(),
        responseType: 'blob',
    });

    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export function isAppApiUnauthorized(error: unknown): boolean {
    return isAxiosError(error) && error.response?.status === 401;
}

export type { ApiEnvelope };
