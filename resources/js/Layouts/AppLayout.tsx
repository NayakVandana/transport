import {
    PageHeaderProvider,
    usePageHeaderValue,
} from '@/contexts/PageHeaderContext';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { ReactNode } from 'react';

function AppLayoutFrame({ children }: { children: ReactNode }) {
    const header = usePageHeaderValue();

    return <AuthenticatedLayout header={header}>{children}</AuthenticatedLayout>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <PageHeaderProvider>
            <AppLayoutFrame>{children}</AppLayoutFrame>
        </PageHeaderProvider>
    );
}

export function appLayout(page: ReactNode) {
    return <AppLayout>{page}</AppLayout>;
}
