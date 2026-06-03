import type { FreightInvoiceLine, InvoiceTotals } from '@/types/transport';

export function calculateFreightInvoice(
    lines: Pick<
        FreightInvoiceLine,
        'weight' | 'rate' | 'advance_paid' | 'empty_container_charge' | 'detention'
    >[],
    igstRate = 5,
): InvoiceTotals {
    let totalWeight = 0;
    let totalFreight = 0;
    let totalEmptyContainer = 0;
    let totalDetention = 0;
    let totalAdvance = 0;

    for (const line of lines) {
        const weight = Number(line.weight) || 0;
        const rate = Number(line.rate) || 0;
        const freight = Math.round(weight * rate * 100) / 100;
        totalWeight += weight;
        totalFreight += freight;
        totalEmptyContainer += Number(line.empty_container_charge) || 0;
        totalDetention += Number(line.detention) || 0;
        totalAdvance += Number(line.advance_paid) || 0;
    }

    const netValue =
        Math.round((totalFreight + totalEmptyContainer + totalDetention) * 100) / 100;
    const balance = Math.round((netValue - totalAdvance) * 100) / 100;
    const igstAmount = Math.round(netValue * (igstRate / 100) * 100) / 100;

    return {
        total_weight: Math.round(totalWeight * 1000) / 1000,
        total_freight: Math.round(totalFreight * 100) / 100,
        total_empty_container_charge:
            Math.round(totalEmptyContainer * 100) / 100,
        total_detention: Math.round(totalDetention * 100) / 100,
        net_value: netValue,
        total_advance: Math.round(totalAdvance * 100) / 100,
        balance_amount: balance,
        gross_freight: netValue,
        igst_amount: igstAmount,
    };
}

export function lineFreight(weight: number | string, rate: number | string): number {
    return Math.round((Number(weight) || 0) * (Number(rate) || 0) * 100) / 100;
}

export function formatMoney(value: number | string): string {
    return Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function calculateEntrybookBalance(
    freight: number | string,
    advance: number | string,
    detention: number | string = 0,
): number {
    return Math.round(
        ((Number(freight) || 0) + (Number(detention) || 0) - (Number(advance) || 0)) * 100,
    ) / 100;
}

export function calculateVehicleExpenseBalance(
    freight: number | string,
    advance: number | string,
    emptyCharge: number | string,
    toll: number | string,
    maintenance: number | string,
): number {
    const total =
        (Number(freight) || 0) +
        (Number(emptyCharge) || 0) -
        (Number(advance) || 0) -
        (Number(toll) || 0) -
        (Number(maintenance) || 0);

    return Math.round(total * 100) / 100;
}

export function formatDate(d: string | null | undefined, short = false): string {
    if (!d) return '';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = short
        ? String(date.getFullYear()).slice(-2)
        : String(date.getFullYear());
    return `${day}-${month}-${year}`;
}
