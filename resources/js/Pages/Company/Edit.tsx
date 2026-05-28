import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { Company } from '@/types/transport';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Props {
    company: Company | null;
}

export default function CompanyEdit({ company }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: company?.name ?? '',
        pan: company?.pan ?? '',
        gst: company?.gst ?? '',
        udyam_reg_no: company?.udyam_reg_no ?? '',
        udyam_date: company?.udyam_date?.slice(0, 10) ?? '',
        jurisdiction: company?.jurisdiction ?? 'SUBJECT TO VAPI JURISDICTION',
        sac_code: company?.sac_code ?? '996791',
        entry_number_prefix: company?.entry_number_prefix ?? 'R2526',
        entry_next_sequence: String(company?.entry_next_sequence ?? '1769'),
        igst_rate: String(company?.igst_rate ?? '5'),
        bank_account_name: company?.bank_account_name ?? '',
        bank_account_no: company?.bank_account_no ?? '',
        bank_ifsc: company?.bank_ifsc ?? '',
        bank_name: company?.bank_name ?? '',
        bank_branch: company?.bank_branch ?? '',
        address: company?.address ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('company.update'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Company Profile
                </h2>
            }
        >
            <Head title="Company" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-6 rounded-lg bg-white p-6 shadow">
                        <Section title="Business Details">
                            <Field label="Company Name" error={errors.name}>
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="PAN" error={errors.pan}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.pan}
                                        onChange={(e) => setData('pan', e.target.value)}
                                    />
                                </Field>
                                <Field label="GST" error={errors.gst}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.gst}
                                        onChange={(e) => setData('gst', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Udyam Reg No" error={errors.udyam_reg_no}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.udyam_reg_no}
                                        onChange={(e) => setData('udyam_reg_no', e.target.value)}
                                    />
                                </Field>
                                <Field label="Udyam Date" error={errors.udyam_date}>
                                    <TextInput
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.udyam_date}
                                        onChange={(e) => setData('udyam_date', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <Field label="Jurisdiction" error={errors.jurisdiction}>
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.jurisdiction}
                                    onChange={(e) => setData('jurisdiction', e.target.value)}
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="SAC Code" error={errors.sac_code}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.sac_code}
                                        onChange={(e) => setData('sac_code', e.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="IGST Rate %" error={errors.igst_rate}>
                                    <TextInput
                                        type="number"
                                        step="0.0001"
                                        className="mt-1 block w-full"
                                        value={data.igst_rate}
                                        onChange={(e) => setData('igst_rate', e.target.value)}
                                        required
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
                                        className="mt-1 block w-full font-mono"
                                        value={data.entry_number_prefix}
                                        onChange={(e) =>
                                            setData('entry_number_prefix', e.target.value.toUpperCase())
                                        }
                                        placeholder="R2526"
                                        required
                                    />
                                </Field>
                                <Field label="Next Sequence Number" error={errors.entry_next_sequence}>
                                    <TextInput
                                        type="number"
                                        min={1}
                                        className="mt-1 block w-full"
                                        value={data.entry_next_sequence}
                                        onChange={(e) =>
                                            setData('entry_next_sequence', e.target.value)
                                        }
                                        required
                                    />
                                </Field>
                            </div>
                        </Section>

                        <Section title="Bank Details">
                            <Field label="Account Name" error={errors.bank_account_name}>
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.bank_account_name}
                                    onChange={(e) => setData('bank_account_name', e.target.value)}
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Account No" error={errors.bank_account_no}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.bank_account_no}
                                        onChange={(e) => setData('bank_account_no', e.target.value)}
                                    />
                                </Field>
                                <Field label="IFSC" error={errors.bank_ifsc}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.bank_ifsc}
                                        onChange={(e) => setData('bank_ifsc', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Bank Name" error={errors.bank_name}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                    />
                                </Field>
                                <Field label="Branch" error={errors.bank_branch}>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.bank_branch}
                                        onChange={(e) => setData('bank_branch', e.target.value)}
                                    />
                                </Field>
                            </div>
                        </Section>

                        <PrimaryButton disabled={processing}>Save Company</PrimaryButton>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
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
