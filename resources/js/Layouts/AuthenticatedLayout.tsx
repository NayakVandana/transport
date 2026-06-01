import ApplicationLogo from '@/Components/ApplicationLogo';
import SidebarNavLink from '@/Components/SidebarNavLink';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { clearAuthUserCache, useAuthUser } from '@/auth/useAuthUser';
import { getUserApiToken, setUserApiToken } from '@/auth/authToken';
import { loginUrl } from '@/utils/requireAuth';
import { Link, router } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

type NavItem = {
    name: string;
    route: string;
    icon: ReactNode;
    isActive?: () => boolean;
};

function isInvoicesListActive(): boolean {
    const current = route().current();
    if (!current?.startsWith('invoices.')) {
        return false;
    }
    return current !== 'invoices.create';
}

const navItems: NavItem[] = [
    {
        name: 'Dashboard',
        route: 'dashboard',
        isActive: () => route().current('dashboard') ?? false,
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: 'Entrybook',
        route: 'entrybooks.index',
        isActive: () => (route().current('entrybooks.*') ?? false),
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    {
        name: 'Tax Invoices',
        route: 'invoices.index',
        isActive: isInvoicesListActive,
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        name: 'New Invoice',
        route: 'invoices.create',
        isActive: () => route().current('invoices.create') ?? false,
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        ),
    },
    {
        name: 'Received Payments',
        route: 'invoice-payments.index',
        isActive: () => (route().current('invoice-payments.*') ?? false),
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    {
        name: 'Party',
        route: 'parties.index',
        isActive: () => (route().current('parties.*') ?? false),
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        name: 'Vehicles',
        route: 'vehicles.index',
        isActive: () => (route().current('vehicles.*') ?? false),
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-6 8H6a2 2 0 01-2-2V7a2 2 0 012-2h2l2-2h4l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
        ),
    },
    {
        name: 'Vehicle Expenses',
        route: 'vehicle-expenses.index',
        isActive: () => (route().current('vehicle-expenses.*') ?? false),
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    {
        name: 'Drivers',
        route: 'drivers.index',
        isActive: () => (route().current('drivers.*') ?? false),
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    {
        name: 'Routes (From)',
        route: 'routes.index',
        isActive: () => (route().current('routes.*') ?? false),
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        name: 'Company',
        route: 'company.edit',
        isActive: () => (route().current('company.*') ?? false),
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
];

function SidebarContent({
    onNavigate,
    onLogout,
}: {
    onNavigate?: () => void;
    onLogout: () => void;
}) {
    const { user } = useAuthUser();

    return (
        <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-700 px-4">
                <Link href={route('dashboard')} onClick={onNavigate} className="flex items-center gap-2">
                    <ApplicationLogo className="h-8 w-auto fill-current text-white" />
                    <span className="text-sm font-semibold text-white">Transport</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navItems.map((item) => (
                    <SidebarNavLink
                        key={item.route}
                        href={route(item.route)}
                        active={item.isActive?.() ?? false}
                        icon={item.icon}
                        onClick={onNavigate}
                    >
                        {item.name}
                    </SidebarNavLink>
                ))}
            </nav>

            <div className="border-t border-slate-700 p-3">
                <div className="mb-3 truncate px-3">
                    <p className="truncate text-sm font-medium text-white">{user?.name ?? '—'}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
                </div>
                <SidebarNavLink
                    href={route('profile.edit')}
                    active={route().current('profile.*') ?? false}
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    }
                    onClick={onNavigate}
                >
                    Profile
                </SidebarNavLink>
                <button
                    type="button"
                    onClick={() => {
                        onNavigate?.();
                        onLogout();
                    }}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                >
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                </button>
            </div>
        </div>
    );
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { user, loading } = useAuthUser();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const hasToken = Boolean(getUserApiToken());

    useEffect(() => {
        if (!hasToken) {
            router.visit(loginUrl(window.location.pathname));

            return;
        }

        if (!loading && !user) {
            setUserApiToken(null);
            clearAuthUserCache();
            router.visit(loginUrl(window.location.pathname));
        }
    }, [hasToken, loading, user]);

    const closeSidebar = () => setSidebarOpen(false);

    if (!hasToken) {
        return null;
    }

    const handleLogout = async () => {
        try {
            await appApiPost<ApiEnvelope<null>>('/auth/auth-logout', {});
        } catch {
            // Continue local logout even if API call fails.
        }

        setUserApiToken(null);
        clearAuthUserCache();
        router.visit(route('login'));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={closeSidebar}
                    aria-hidden
                />
            )}

            <aside
                className={
                    'fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col bg-slate-900 shadow-xl transition-transform duration-200 ease-in-out lg:translate-x-0 ' +
                    (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
                }
            >
                <SidebarContent onNavigate={closeSidebar} onLogout={handleLogout} />
            </aside>

            <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
                <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 shadow-sm sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="shrink-0 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {header && (
                        <div className="min-w-0 flex-1 [&>div]:min-w-0 [&>div]:w-full [&_h2]:leading-tight">
                            {header}
                        </div>
                    )}
                </header>

                <main className="w-full min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}
