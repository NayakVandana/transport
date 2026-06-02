import { Link } from '@inertiajs/react';

export const partyTabs = [
    { id: 'overview', label: 'Overview', route: 'parties.overview' },
    { id: 'ledger', label: 'Ledger', route: 'parties.ledger' },
    { id: 'invoices', label: 'Invoices', route: 'parties.invoices' },
    { id: 'entries', label: 'Entries', route: 'parties.entries' },
    { id: 'payments', label: 'Payments', route: 'parties.payments' },
    { id: 'profile', label: 'Profile', route: 'parties.profile' },
] as const;

export type PartyTabId = (typeof partyTabs)[number]['id'];

export type PartyAccountTabId = Exclude<PartyTabId, 'profile'>;

export function PartyTabs({
    partyId,
    activeTab,
}: {
    partyId: number;
    activeTab: PartyTabId;
}) {
    return (
        <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 px-2">
            {partyTabs.map((item) => (
                <Link
                    key={item.id}
                    href={route(item.route, partyId)}
                    preserveScroll
                    className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
                        activeTab === item.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
