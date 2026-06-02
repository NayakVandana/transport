import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type Props = {
    children: ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'success';
    target?: string;
    type?: 'button' | 'submit';
};

const variantClasses = {
    primary:
        'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
    secondary:
        'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    success:
        'border-green-600 bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
};

const baseClass =
    'inline-flex min-h-[2.25rem] w-full items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold no-underline transition-colors';

export default function ListingMobileAction({
    children,
    href,
    onClick,
    variant = 'secondary',
    target,
    type = 'button',
}: Props) {
    const className = `${baseClass} ${variantClasses[variant]}`;

    if (href) {
        return (
            <Link href={href} className={className} target={target}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} className={className}>
            {children}
        </button>
    );
}
