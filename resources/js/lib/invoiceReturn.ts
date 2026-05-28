export function invoiceReturnQuery(isEdit: boolean, invoiceId?: number): Record<string, string | number> {
    if (isEdit && invoiceId) {
        return {
            return_route: 'invoices.edit',
            return_id: invoiceId,
        };
    }

    return { return_route: 'invoices.create' };
}

export function masterListHref(
    listRoute: 'vehicles.index' | 'routes.index',
    isEdit: boolean,
    invoiceId?: number,
): string {
    return route(listRoute, invoiceReturnQuery(isEdit, invoiceId));
}
