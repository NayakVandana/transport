import { InertiaLinkProps, Link } from '@inertiajs/react';
import { ReactNode } from 'react';

export default function SidebarNavLink({
    active = false,
    className = '',
    children,
    icon,
    ...props
}: InertiaLinkProps & { active: boolean; icon?: ReactNode }) {
    return (
        <Link
            prefetch
            {...props}
            className={
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                (active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white') +
                className
            }
        >
            <span
                className={
                    active
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-slate-200'
                }
            >
                {icon}
            </span>
            {children}
        </Link>
    );
}
