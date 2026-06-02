import type { ReactNode } from 'react';

type Props = {
    isEmpty: boolean;
    emptyMessage: ReactNode;
    mobile: ReactNode;
    thead: ReactNode;
    tbody: ReactNode;
    className?: string;
    /** Shown above mobile cards, e.g. "12 records". */
    mobileCountLabel?: string;
    /** Flat list inside another panel (party tabs, nested views). */
    embedded?: boolean;
};

export default function ListingTableShell({
    isEmpty,
    emptyMessage,
    mobile,
    thead,
    tbody,
    className = 'overflow-hidden rounded-lg bg-white shadow',
    mobileCountLabel,
    embedded = false,
}: Props) {
    if (isEmpty) {
        return (
            <div className={className}>
                <div className="flex flex-col items-center px-4 py-12 text-center text-sm text-gray-500">
                    {emptyMessage}
                </div>
            </div>
        );
    }

    const mobileListClass = embedded
        ? 'divide-y divide-gray-100 lg:hidden'
        : 'space-y-3 bg-gray-50 p-3 md:hidden';

    const mobileWrapClass = embedded ? 'lg:hidden' : 'md:hidden';
    const desktopWrapClass = embedded
        ? 'hidden overflow-x-auto lg:block'
        : 'hidden overflow-x-auto md:block';

    return (
        <div className={className}>
            <div className={mobileWrapClass}>
                {mobileCountLabel ? (
                    <div
                        className={
                            embedded
                                ? 'border-b border-gray-100 px-3 py-2 sm:px-4'
                                : 'border-b border-gray-100 bg-gray-50 px-4 py-2'
                        }
                    >
                        <p className="text-xs font-medium text-gray-500">{mobileCountLabel}</p>
                    </div>
                ) : null}
                <ul className={mobileListClass}>{mobile}</ul>
            </div>
            <div className={desktopWrapClass}>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">{thead}</thead>
                    <tbody className="divide-y divide-gray-200">{tbody}</tbody>
                </table>
            </div>
        </div>
    );
}
