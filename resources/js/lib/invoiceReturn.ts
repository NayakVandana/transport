export function invoiceFromEntrybookHref(
    entry: {
        id: number;
        party_id?: number | null;
        party?: { id?: number } | null;
    },
    partyId?: number,
): string {
    const resolvedPartyId = entry.party_id ?? entry.party?.id ?? partyId;

    return route('invoices.create', {
        party: resolvedPartyId ?? undefined,
        entrybook: entry.id,
    });
}

export function invoiceReturnQuery(isEdit: boolean, invoiceId?: number): Record<string, string | number> {
    if (isEdit && invoiceId) {
        return {
            return_route: 'invoices.edit',
            return_id: invoiceId,
        };
    }

    return { return_route: 'invoices.create' };
}

export function entrybookReturnQuery(isEdit: boolean, entrybookId?: number): Record<string, string | number> {
    if (isEdit && entrybookId) {
        return {
            return_route: 'entrybooks.edit',
            return_id: entrybookId,
        };
    }

    return { return_route: 'entrybooks.create' };
}

export function masterListHref(
    listRoute: 'vehicles.index' | 'locations.index',
    isEdit: boolean,
    entityId?: number,
    context: 'invoice' | 'entrybook' = 'invoice',
): string {
    const query =
        context === 'entrybook'
            ? entrybookReturnQuery(isEdit, entityId)
            : invoiceReturnQuery(isEdit, entityId);

    if (listRoute === 'locations.index') {
        return route('locations.create', query);
    }

    return route(listRoute, query);
}

export function resolveReturnHref(
    returnRoute: string | null,
    returnId: number | null,
): string | null {
    if (!returnRoute || !route().has(returnRoute)) {
        return null;
    }

    if (returnRoute === 'invoices.edit' && returnId) {
        return route(returnRoute, { invoice: returnId });
    }

    if (returnRoute === 'entrybooks.edit' && returnId) {
        return route(returnRoute, { id: returnId });
    }

    return route(returnRoute);
}
