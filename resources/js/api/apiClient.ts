import axios from 'axios';

export type ApiEnvelope<T> = {
    success: boolean;
    message: string;
    data: T;
};

export async function apiPost<T>(
    path: string,
    data: Record<string, unknown> = {},
): Promise<T> {
    const res = await axios.post<T>(path, data, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });

    return res.data;
}
