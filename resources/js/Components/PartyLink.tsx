import { Link } from '@inertiajs/react';

export default function PartyLink({
    partyId,
    name,
    className = '',
}: {
    partyId?: number | null;
    name?: string | null;
    className?: string;
}) {
    const label = name?.trim() || '—';

    if (!partyId || !name?.trim()) {
        return <span className={className}>{label}</span>;
    }

    return (
        <Link
            href={route('parties.overview', partyId)}
            className={`text-indigo-600 hover:underline ${className}`}
        >
            {name}
        </Link>
    );
}
