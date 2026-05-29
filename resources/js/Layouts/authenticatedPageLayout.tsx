import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { ReactNode } from 'react';

export function authenticatedPageLayout(header?: ReactNode) {
    return function Layout(page: ReactNode) {
        return (
            <AuthenticatedLayout header={header}>
                {page}
            </AuthenticatedLayout>
        );
    };
}
