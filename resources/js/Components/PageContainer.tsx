import type { ReactNode } from 'react';

type PageWidth = 'full' | 'xl' | '2xl' | '3xl' | '4xl';

const widthClasses: Record<PageWidth, string> = {
    full: 'max-w-none',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
};

export default function PageContainer({
    children,
    className = '',
    width = 'full',
}: {
    children: ReactNode;
    className?: string;
    width?: PageWidth;
}) {
    return (
        <div
            className={`mx-auto w-full min-w-0 px-3 py-5 sm:px-6 sm:py-8 lg:px-8 ${widthClasses[width]} ${className}`}
        >
            {children}
        </div>
    );
}
