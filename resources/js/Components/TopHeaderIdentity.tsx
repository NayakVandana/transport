import Dropdown from '@/Components/Dropdown';
import { initialsFromName } from '@/lib/initials';
import type { User } from '@/types';
import type { Company } from '@/types/transport';
import { Link } from '@inertiajs/react';

function AvatarCircle({
    label,
    imageUrl,
    className,
    sizeClass = 'h-9 w-9',
}: {
    label: string;
    imageUrl?: string | null;
    className: string;
    sizeClass?: string;
}) {
    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt=""
                className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <span
            className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase text-white ${className}`}
        >
            {label}
        </span>
    );
}

function ProfileIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
        </svg>
    );
}

export default function TopHeaderIdentity({
    user,
    company,
    onLogout,
}: {
    user: User | null;
    company: Company | null;
    onLogout: () => void;
}) {
    const companyName = company?.name?.trim() || 'Set up company';
    const userName = user?.name?.trim() || 'User';
    const profileActive = route().current('profile.*') ?? false;

    return (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
                href={route('company.show')}
                className="flex max-w-[12rem] items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:max-w-xs sm:px-3"
                title={companyName}
            >
                <AvatarCircle
                    label={initialsFromName(companyName)}
                    imageUrl={company?.logo_url}
                    className="bg-sky-500"
                    sizeClass="h-8 w-8"
                />
                <span className="hidden truncate text-xs font-semibold uppercase tracking-wide text-gray-900 sm:inline sm:text-sm">
                    {companyName}
                </span>
            </Link>

            <Dropdown>
                <Dropdown.Trigger>
                    <button
                        type="button"
                        className="rounded-full transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        title={userName}
                        aria-label="User menu"
                    >
                        <AvatarCircle
                            label={initialsFromName(userName)}
                            imageUrl={user?.photo_url}
                            className="bg-indigo-900"
                        />
                    </button>
                </Dropdown.Trigger>

                <Dropdown.Content
                    align="right"
                    width="w-56"
                    contentClasses="rounded-lg bg-slate-900 p-3 ring-1 ring-slate-700"
                >
                    <div className="mb-3 truncate px-1">
                        <p className="truncate text-sm font-medium text-white">{userName}</p>
                        <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
                    </div>

                    <Link
                        href={route('profile.show')}
                        className={
                            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                            (profileActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white')
                        }
                    >
                        <span
                            className={
                                profileActive
                                    ? 'text-white'
                                    : 'text-slate-400 group-hover:text-slate-200'
                            }
                        >
                            <ProfileIcon />
                        </span>
                        Profile
                    </Link>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="group mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                        <span className="text-slate-400 group-hover:text-slate-200">
                            <LogoutIcon />
                        </span>
                        Log Out
                    </button>
                </Dropdown.Content>
            </Dropdown>
        </div>
    );
}
