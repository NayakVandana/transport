const ones = [
    'ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
];
const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

function twoDigits(n: number): string {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o ? ` ${ones[o]}` : ''}`.trim();
}

function threeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const parts: string[] = [];
    if (h > 0) parts.push(`${ones[h]} HUNDRED`);
    if (rest > 0) parts.push(twoDigits(rest));
    return parts.join(' ').trim();
}

function indianGroupWords(n: number): string {
    if (n === 0) return 'ZERO';
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const hundred = n % 1000;
    const parts: string[] = [];
    if (crore > 0) parts.push(`${threeDigits(crore)} CRORE`);
    if (lakh > 0) parts.push(`${threeDigits(lakh)} LAKH`);
    if (thousand > 0) parts.push(`${threeDigits(thousand)} THOUSAND`);
    if (hundred > 0) parts.push(threeDigits(hundred));
    return parts.join(' ').trim();
}

/** Matches legacy invoice: "FIVE THOUSAND ... AND PAISE ZERO ONLY" */
export function balanceInWords(amount: number): string {
    const value = Math.max(0, Math.round(amount * 100) / 100);
    const rupees = Math.floor(value);
    const paise = Math.round((value - rupees) * 100);
    const words = indianGroupWords(rupees);
    const paiseWords = twoDigits(paise);
    return `${words} AND PAISE ${paiseWords} ONLY`;
}
