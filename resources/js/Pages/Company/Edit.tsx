import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, {
    FormActions,
    FormCard,
    FormField,
    FormGrid,
    FormSectionHeader,
    formControlClass,
} from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { Company } from '@/types/transport';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { validateCompanyForm, type CompanyFormData } from '@/lib/companyValidation';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

const defaultData: CompanyFormData = {
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

function companyToFormData(company: Company): CompanyFormData {
    return {
        name: company.name ?? '',
        pan: company.pan ?? '',
        gst: company.gst ?? '',
        udyam_reg_no: company.udyam_reg_no ?? '',
        udyam_date: company.udyam_date?.slice(0, 10) ?? '',
        jurisdiction: company.jurisdiction ?? defaultData.jurisdiction,
        sac_code: company.sac_code ?? defaultData.sac_code,
        entry_number_prefix: company.entry_number_prefix ?? defaultData.entry_number_prefix,
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
    };
}

export default function CompanyEdit() {
    usePageHeader(
        <FormPageHeader
            title="Edit Company Profile"
            backHref={route('company.show')}
            backLabel="Back to profile"
        />,
    );

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});
    const [data, setData] = useState<CompanyFormData>(defaultData);

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
                    setData(companyToFormData(company));
                }
            })
            .catch(() => {
                setLoadError('Could not load company.');
            })
            .finally(() => setLoading(false));
    }, []);

    const setField = (field: keyof CompanyFormData, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

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

            router.visit(route('company.show'));
        } catch {
            setLoadError('Could not save company.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof CompanyFormData) =>
        fieldInputClass(Boolean(errors[field]), formControlClass);

    return (
        <>
            <Head title="Edit Company" />

            <FormPage size="lg">
                {loading ? (
                    <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
                ) : (
                    <>
                        {loadError && (
                            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                {loadError}
                            </p>
                        )}

                        <FormCard>
                            <form onSubmit={submit} className="space-y-8">
                                <section className="space-y-4">
                                    <FormSectionHeader title="Business Details" />
                                    <FormField width="lg">
                                        <InputLabel value="Company Name" />
                                        <TextInput
                                            className={inputClass('name')}
                                            value={data.name}
                                            onChange={(e) => setField('name', e.target.value)}
                                            placeholder="Enter company name"
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </FormField>

                                    <FormGrid cols={3}>
                                        <FormField width="md">
                                            <InputLabel value="PAN" />
                                            <TextInput
                                                className={inputClass('pan')}
                                                value={data.pan}
                                                onChange={(e) => setField('pan', e.target.value)}
                                            />
                                            <InputError message={errors.pan} className="mt-1" />
                                        </FormField>
                                        <FormField width="md">
                                            <InputLabel value="GST" />
                                            <TextInput
                                                className={inputClass('gst')}
                                                value={data.gst}
                                                onChange={(e) => setField('gst', e.target.value)}
                                            />
                                            <InputError message={errors.gst} className="mt-1" />
                                        </FormField>
                                    </FormGrid>

                                    <FormGrid cols={3}>
                                        <FormField width="md">
                                            <InputLabel value="Udyam Reg No" />
                                            <TextInput
                                                className={inputClass('udyam_reg_no')}
                                                value={data.udyam_reg_no}
                                                onChange={(e) =>
                                                    setField('udyam_reg_no', e.target.value)
                                                }
                                            />
                                            <InputError
                                                message={errors.udyam_reg_no}
                                                className="mt-1"
                                            />
                                        </FormField>
                                        <FormField width="sm">
                                            <InputLabel value="Udyam Date" />
                                            <TextInput
                                                type="date"
                                                className={inputClass('udyam_date')}
                                                value={data.udyam_date}
                                                onChange={(e) =>
                                                    setField('udyam_date', e.target.value)
                                                }
                                            />
                                            <InputError
                                                message={errors.udyam_date}
                                                className="mt-1"
                                            />
                                        </FormField>
                                    </FormGrid>

                                    <FormField width="lg">
                                        <InputLabel value="Jurisdiction" />
                                        <TextInput
                                            className={inputClass('jurisdiction')}
                                            value={data.jurisdiction}
                                            onChange={(e) =>
                                                setField('jurisdiction', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.jurisdiction}
                                            className="mt-1"
                                        />
                                    </FormField>

                                    <FormGrid cols={3}>
                                        <FormField width="sm">
                                            <InputLabel value="SAC Code" />
                                            <TextInput
                                                className={inputClass('sac_code')}
                                                value={data.sac_code}
                                                onChange={(e) => setField('sac_code', e.target.value)}
                                            />
                                            <InputError message={errors.sac_code} className="mt-1" />
                                        </FormField>
                                        <FormField width="sm">
                                            <InputLabel value="IGST Rate %" />
                                            <TextInput
                                                type="number"
                                                step="0.0001"
                                                className={inputClass('igst_rate')}
                                                value={data.igst_rate}
                                                onChange={(e) => setField('igst_rate', e.target.value)}
                                            />
                                            <InputError message={errors.igst_rate} className="mt-1" />
                                        </FormField>
                                    </FormGrid>

                                    <FormField width="full">
                                        <InputLabel value="Address" />
                                        <TextInput
                                            className={inputClass('address')}
                                            value={data.address}
                                            onChange={(e) => setField('address', e.target.value)}
                                        />
                                        <InputError message={errors.address} className="mt-1" />
                                    </FormField>
                                </section>

                                <section className="space-y-4 border-t border-gray-100 pt-6">
                                    <FormSectionHeader
                                        title="Entry Number Settings"
                                        description="Consignment entry numbers are auto-generated as PREFIX-SEQUENCE (e.g. R2526-1767)."
                                    />
                                    <FormGrid cols={3}>
                                        <FormField width="sm">
                                            <InputLabel value="Entry Prefix" />
                                            <TextInput
                                                className={`${inputClass('entry_number_prefix')} font-mono`}
                                                value={data.entry_number_prefix}
                                                onChange={(e) =>
                                                    setField(
                                                        'entry_number_prefix',
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                placeholder="R2526"
                                            />
                                            <InputError
                                                message={errors.entry_number_prefix}
                                                className="mt-1"
                                            />
                                        </FormField>
                                        <FormField width="sm">
                                            <InputLabel value="Next Sequence Number" />
                                            <TextInput
                                                type="number"
                                                min={1}
                                                className={inputClass('entry_next_sequence')}
                                                value={data.entry_next_sequence}
                                                onChange={(e) =>
                                                    setField('entry_next_sequence', e.target.value)
                                                }
                                            />
                                            <InputError
                                                message={errors.entry_next_sequence}
                                                className="mt-1"
                                            />
                                        </FormField>
                                    </FormGrid>
                                </section>

                                <section className="space-y-4 border-t border-gray-100 pt-6">
                                    <FormSectionHeader title="Bank Details" />
                                    <FormField width="lg">
                                        <InputLabel value="Account Name" />
                                        <TextInput
                                            className={inputClass('bank_account_name')}
                                            value={data.bank_account_name}
                                            onChange={(e) =>
                                                setField('bank_account_name', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.bank_account_name}
                                            className="mt-1"
                                        />
                                    </FormField>

                                    <FormGrid cols={3}>
                                        <FormField width="md">
                                            <InputLabel value="Account No" />
                                            <TextInput
                                                className={inputClass('bank_account_no')}
                                                value={data.bank_account_no}
                                                onChange={(e) =>
                                                    setField('bank_account_no', e.target.value)
                                                }
                                            />
                                            <InputError
                                                message={errors.bank_account_no}
                                                className="mt-1"
                                            />
                                        </FormField>
                                        <FormField width="md">
                                            <InputLabel value="IFSC" />
                                            <TextInput
                                                className={inputClass('bank_ifsc')}
                                                value={data.bank_ifsc}
                                                onChange={(e) => setField('bank_ifsc', e.target.value)}
                                            />
                                            <InputError message={errors.bank_ifsc} className="mt-1" />
                                        </FormField>
                                    </FormGrid>

                                    <FormGrid cols={3}>
                                        <FormField width="md">
                                            <InputLabel value="Bank Name" />
                                            <TextInput
                                                className={inputClass('bank_name')}
                                                value={data.bank_name}
                                                onChange={(e) => setField('bank_name', e.target.value)}
                                            />
                                            <InputError message={errors.bank_name} className="mt-1" />
                                        </FormField>
                                        <FormField width="md">
                                            <InputLabel value="Branch" />
                                            <TextInput
                                                className={inputClass('bank_branch')}
                                                value={data.bank_branch}
                                                onChange={(e) =>
                                                    setField('bank_branch', e.target.value)
                                                }
                                            />
                                            <InputError
                                                message={errors.bank_branch}
                                                className="mt-1"
                                            />
                                        </FormField>
                                    </FormGrid>
                                </section>

                                <FormActions>
                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Saving…' : 'Save Company'}
                                    </PrimaryButton>
                                    <Link href={route('company.show')}>
                                        <SecondaryButton type="button">Cancel</SecondaryButton>
                                    </Link>
                                </FormActions>
                            </form>
                        </FormCard>
                    </>
                )}
            </FormPage>
        </>
    );
}
