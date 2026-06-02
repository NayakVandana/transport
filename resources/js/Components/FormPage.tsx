import PageContainer from '@/Components/PageContainer';
import type { ReactNode } from 'react';

type FormPageSize = 'sm' | 'md' | 'lg';

const pageMaxWidth: Record<FormPageSize, string> = {
    sm: 'max-w-xl',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
};

type FormFieldWidth = 'xs' | 'sm' | 'md' | 'lg' | 'full';

const fieldMaxWidth: Record<FormFieldWidth, string> = {
    xs: 'max-w-[9rem]',
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
    full: 'max-w-full',
};

export default function FormPage({
    children,
    className = '',
    size = 'md',
}: {
    children: ReactNode;
    className?: string;
    size?: FormPageSize;
}) {
    return (
        <PageContainer>
            <div className={`mx-auto w-full space-y-5 ${pageMaxWidth[size]} ${className}`}>
                {children}
            </div>
        </PageContainer>
    );
}

export function FormCard({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`rounded-lg bg-white p-4 shadow sm:p-6 ${className}`}>{children}</div>
    );
}

export function FormSectionHeader({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
    );
}

/** Wraps a label + input so the control width matches the field type, not the whole page. */
export function FormField({
    children,
    width = 'full',
    className = '',
}: {
    children: ReactNode;
    width?: FormFieldWidth;
    className?: string;
}) {
    return <div className={`w-full ${fieldMaxWidth[width]} ${className}`}>{children}</div>;
}

export function FormGrid({
    cols = 2,
    children,
    className = '',
}: {
    cols?: 2 | 3 | 4;
    children: ReactNode;
    className?: string;
}) {
    const colsClass =
        cols === 4
            ? 'grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4'
            : cols === 3
              ? 'grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2';

    return <div className={`${colsClass} ${className}`}>{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&_a]:w-full sm:[&_a]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
            {children}
        </div>
    );
}

export const formControlClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export const formSelectClass =
    'mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';
