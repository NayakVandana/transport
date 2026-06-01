import PageContainer from '@/Components/PageContainer';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { Company } from '@/types/transport';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { validateCompanyForm } from '@/lib/companyValidation';
import { Head } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

const defaultData = {
    name: '',
    pan: '',
    gst: '',
    udyam_reg_no: '',
    udyam_date: '',
    jurisdiction: 'SUBJECT TO VAPI JURISDICTION',
    sac_code: '996791',
    entry_number_prefix: 'R2526',
    entry_next_sequence: '1769',
    igst_rate: '5',
    bank_account_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    bank_name: '',
    bank_branch: '',
    address: '',
};

export default function CompanyEdit() {
    usePageHeader(
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
            Company Profile
        </h2>,
    );

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [data, setData] = useState(defaultData);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLoading(true);

        void appApiPost<ApiEnvelope<{ company: Company | null }>>('/company/company-show', {})
            .then((res) => {
                if (!res.success) {
                    setLoadError(res.message || 'Could not load company.');
                    return;
                }

                const company = res.data?.company;
                if (company) {
                    setData({
                        name: company.name ?? '',
                        pan: company.pan ?? '',
                        gst: company.gst ?? '',
                        udyam_reg_no: company.udyam_reg_no ?? '',
                        udyam_date: company.udyam_date?.slice(0, 10) ?? '',
                        jurisdiction: company.jurisdiction ?? defaultData.jurisdiction,
                        sac_code: company.sac_code ?? defaultData.sac_code,
                        entry_number_prefix:
                            company.entry_number_prefix ?? defaultData.entry_number_prefix,
                        entry_next_sequence: String(
                            company.entry_next_sequence ?? defaultData.entry_next_sequence,
                        ),
                        igst_rate: String(company.igst_rate ?? defaultData.igst_rate),
                        bank_account_name: company.bank_account_name ?? '',
                        bank_account_no: company.bank_account_no ?? '',
                        bank_ifsc: company.bank_ifsc ?? '',
                        bank_name: company.bank_name ?? '',
                        bank_branch: company.bank_branch ?? '',
                        address: company.address ?? '',
                    });
                }
            })
            .catch(() => {
                setLoadError('Could not load company.');
            })
            .finally(() => setLoading(false));
    }, []);

    const setField = (field: keyof typeof data, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setSaved(false);
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);
        setSaved(false);

        const clientErrors = validateCompanyForm(data);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const res = await appApiPost<ApiEnvelope<{ company: Company }>>(
                '/company/company-update',
                {
                    ...data,
                    entry_next_sequence: Number(data.entry_next_sequence),
                    igst_rate: Number(data.igst_rate),
                },
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save company.');
                }
                return;
            }

            setSaved(true);
        } catch {
            setLoadError('Could not save company.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Company" />

            <PageContainer width="3xl">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading…</p>
                    ) : loadError && !data.name ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    ) : (
                        <form onSubmit={submit} className="space-y-6 rounded-lg bg-white p-6 shadow">
                            {loadError && (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                    {loadError}
                                </p>
                            )}

                            <Section title="Business Details">
                                <Field label="Company Name" error={errors.name}>
                                    <TextInput
                                        className={fieldInputClass(Boolean(errors.name))}
                                        value={data.name}
                                        onChange={(e) => setField('name', e.target.value)}
                                        placeholder="Enter company name"
                                    />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="PAN" error={errors.pan}>
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.pan}
                                            onChange={(e) => setField('pan', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="GST" error={errors.gst}>
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.gst}
                                            onChange={(e) => setField('gst', e.target.value)}
                                        />
                                    </Field>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Udyam Reg No" error={errors.udyam_reg_no}>
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.udyam_reg_no}
                                            onChange={(e) => setField('udyam_reg_no', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Udyam Date" error={errors.udyam_date}>
                                        <TextInput
                                            type="date"
                                            className="mt-1 block w-full"
                                            value={data.udyam_date}
                                            onChange={(e) => setField('udyam_date', e.target.value)}
                                        />
                                    </Field>
                                </div>
                                <Field label="Jurisdiction" error={errors.jurisdiction}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.jurisdiction}
                                        onChange={(e) => setField('jurisdiction', e.target.value)}
                                    />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="SAC Code" error={errors.sac_code}>
                                        <TextInput
                                            className={fieldInputClass(Boolean(errors.sac_code))}
                                            value={data.sac_code}
                                            onChange={(e) => setField('sac_code', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="IGST Rate %" error={errors.igst_rate}>
                                        <TextInput
                                            type="number"
                                            step="0.0001"
                                            className={fieldInputClass(Boolean(errors.igst_rate))}
                                            value={data.igst_rate}
                                            onChange={(e) => setField('igst_rate', e.target.value)}
                                        />
                                    </Field>
                                </div>
                            </Section>

                            <Section title="Entry Number Settings">
                                <p className="text-sm text-gray-500">
                                    Consignment entry numbers are auto-generated as{' '}
                                    <span className="font-mono">PREFIX-SEQUENCE</span> (e.g. R2526-1767).
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Entry Prefix" error={errors.entry_number_prefix}>
                                        <TextInput
                                            className={`${fieldInputClass(Boolean(errors.entry_number_prefix))} font-mono`}
                                            value={data.entry_number_prefix}
                                            onChange={(e) =>
                                                setField(
                                                    'entry_number_prefix',
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            placeholder="R2526"
                                        />
                                    </Field>
                                    <Field label="Next Sequence Number" error={errors.entry_next_sequence}>
                                        <TextInput
                                            type="number"
                                            min={1}
                                            className={fieldInputClass(Boolean(errors.entry_next_sequence))}
                                            value={data.entry_next_sequence}
                                            onChange={(e) =>
                                                setField('entry_next_sequence', e.target.value)
                                            }
                                        />
                                    </Field>
                                </div>
                            </Section>

                            <Section title="Bank Details">
                                <Field label="Account Name" error={errors.bank_account_name}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.bank_account_name}
                                        onChange={(e) => setField('bank_account_name', e.target.value)}
                                    />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Account No" error={errors.bank_account_no}>
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.bank_account_no}
                                            onChange={(e) => setField('bank_account_no', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="IFSC" error={errors.bank_ifsc}>
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.bank_ifsc}
                                            onChange={(e) => setField('bank_ifsc', e.target.value)}
                                        />
                                    </Field>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Bank Name" error={errors.bank_name}>
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.bank_name}
                                            onChange={(e) => setField('bank_name', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Branch" error={errors.bank_branch}>
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={data.bank_branch}
                                            onChange={(e) => setField('bank_branch', e.target.value)}
                                        />
                                    </Field>
                                </div>
                            </Section>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>Save Company</PrimaryButton>
                                {saved && (
                                    <p className="text-sm text-gray-600">Saved.</p>
                                )}
                            </div>
                        </form>
                    )}
            </PageContainer>
        </>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4 border-b border-gray-100 pb-6 last:border-0">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {children}
        </div>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <InputLabel value={label} />
            {children}
            <InputError message={error} className="mt-1" />
        </div>
    );
}
