import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { invalidateAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, appApiPostFormData, type ApiEnvelope } from '@/api/appClient';
import type { Driver, Expense, ExpenseOption, Vehicle } from '@/types/transport';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

function apiFieldErrors(data: unknown): Record<string, string> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }

    const errors: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val) && val[0]) {
            errors[key] = String(val[0]);
        } else if (typeof val === 'string') {
            errors[key] = val;
        }
    }

    return errors;
}

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

type ExpenseMeta = {
    categories: ExpenseOption[];
    payment_methods: ExpenseOption[];
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    drivers: Pick<Driver, 'id' | 'name' | 'license_number'>[];
};

type ExpenseShowData = ExpenseMeta & {
    expense: Expense;
};

export default function ExpenseForm({ expenseId }: { expenseId?: number }) {
    const isEdit = Boolean(expenseId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Expense' : 'Add Expense'}
        </h2>,
    );

    const [categories, setCategories] = useState<ExpenseOption[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<ExpenseOption[]>([]);
    const [vehicles, setVehicles] = useState<Pick<Vehicle, 'id' | 'vehicle_number'>[]>([]);
    const [drivers, setDrivers] = useState<Pick<Driver, 'id' | 'name' | 'license_number'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [billCopyFile, setBillCopyFile] = useState<File | null>(null);
    const [existingBillCopyUrl, setExistingBillCopyUrl] = useState<string | null>(null);
    const [removeBillCopy, setRemoveBillCopy] = useState(false);
    const [data, setData] = useState({
        expense_date: new Date().toISOString().slice(0, 10),
        category: 'fuel',
        amount: '',
        description: '',
        vehicle_id: '',
        driver_id: '',
        payment_method: '',
    });

    const applyMeta = (meta: ExpenseMeta) => {
        setCategories(meta.categories);
        setPaymentMethods(meta.payment_methods);
        setVehicles(meta.vehicles);
        setDrivers(meta.drivers);
    };

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (expenseId) {
                    const res = await appApiPost<ApiEnvelope<ExpenseShowData>>(
                        '/expenses/expense-show',
                        { id: expenseId },
                    );

                    if (!res.success || !res.data?.expense) {
                        setLoadError(res.message || 'Could not load expense.');
                        return;
                    }

                    applyMeta(res.data);
                    const expense = res.data.expense;
                    setExistingBillCopyUrl(expense.bill_copy_url ?? null);
                    setRemoveBillCopy(false);
                    setBillCopyFile(null);
                    setData({
                        expense_date: dateInputValue(expense.expense_date),
                        category: expense.category,
                        amount: expense.amount != null ? String(expense.amount) : '',
                        description: expense.description ?? '',
                        vehicle_id: expense.vehicle_id ? String(expense.vehicle_id) : '',
                        driver_id: expense.driver_id ? String(expense.driver_id) : '',
                        payment_method: expense.payment_method ?? '',
                    });
                } else {
                    const res = await appApiPost<ApiEnvelope<ExpenseMeta>>(
                        '/expenses/expense-meta',
                        {},
                    );

                    if (!res.success || !res.data) {
                        setLoadError(res.message || 'Could not load form data.');
                        return;
                    }

                    applyMeta(res.data);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [expenseId]);

    const setField = (field: keyof typeof data, value: string) => {
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
        setProcessing(true);

        try {
            const formData = new FormData();
            formData.append('expense_date', data.expense_date);
            formData.append('category', data.category);
            formData.append('amount', String(Number(data.amount)));
            formData.append('description', data.description);
            if (data.vehicle_id) {
                formData.append('vehicle_id', data.vehicle_id);
            }
            if (data.driver_id) {
                formData.append('driver_id', data.driver_id);
            }
            if (data.payment_method) {
                formData.append('payment_method', data.payment_method);
            }
            if (billCopyFile) {
                formData.append('bill_copy', billCopyFile);
            }
            if (expenseId) {
                formData.append('id', String(expenseId));
                if (removeBillCopy) {
                    formData.append('remove_bill_copy', '1');
                }
            }

            const res = await appApiPostFormData<ApiEnvelope<{ expense: Expense }>>(
                expenseId ? '/expenses/expense-update' : '/expenses/expense-store',
                formData,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!res.data) {
                    setLoadError(res.message || 'Could not save expense.');
                }
                return;
            }

            invalidateAppQuery('expenses-list');
            router.visit(route('expenses.index'));
        } catch {
            setLoadError('Could not save expense.');
        } finally {
            setProcessing(false);
        }
    };

    const selectClass = (field: keyof typeof data) =>
        `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500${
            errors[field] ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`;

    return (
        <>
            <Head title={isEdit ? 'Edit Expense' : 'Add Expense'} />

            <div className="py-8">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading…</p>
                    ) : loadError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    ) : (
                        <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Date" />
                                    <input
                                        type="date"
                                        className={selectClass('expense_date')}
                                        value={data.expense_date}
                                        onChange={(e) => setField('expense_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.expense_date} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Category" />
                                    <select
                                        className={selectClass('category')}
                                        value={data.category}
                                        onChange={(e) => setField('category', e.target.value)}
                                        required
                                    >
                                        {categories.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.category} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Amount (₹)" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={selectClass('amount')}
                                    value={data.amount}
                                    onChange={(e) => setField('amount', e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                                <InputError message={errors.amount} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Description" />
                                <textarea
                                    className={selectClass('description')}
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setField('description', e.target.value)}
                                    placeholder="What was this expense for?"
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Vehicle (optional)" />
                                    <select
                                        className={selectClass('vehicle_id')}
                                        value={data.vehicle_id}
                                        onChange={(e) => setField('vehicle_id', e.target.value)}
                                    >
                                        <option value="">None</option>
                                        {vehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.vehicle_number}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.vehicle_id} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Driver (optional)" />
                                    <select
                                        className={selectClass('driver_id')}
                                        value={data.driver_id}
                                        onChange={(e) => setField('driver_id', e.target.value)}
                                    >
                                        <option value="">None</option>
                                        {drivers.map((driver) => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.driver_id} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Payment method (optional)" />
                                <select
                                    className={selectClass('payment_method')}
                                    value={data.payment_method}
                                    onChange={(e) => setField('payment_method', e.target.value)}
                                >
                                    <option value="">Not specified</option>
                                    {paymentMethods.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.payment_method} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Bill copy (optional)" />
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                    className={`mt-1 block w-full text-sm text-gray-600${
                                        errors.bill_copy ? ' rounded-md border border-red-500 p-2' : ''
                                    }`}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setBillCopyFile(file);
                                        setRemoveBillCopy(false);
                                        setErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.bill_copy;
                                            return next;
                                        });
                                    }}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    JPEG, PNG, or PDF up to 5 MB.
                                </p>
                                {existingBillCopyUrl && !removeBillCopy && !billCopyFile && (
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                                        <a
                                            href={existingBillCopyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline"
                                        >
                                            View current bill
                                        </a>
                                        <label className="flex items-center gap-2 text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={removeBillCopy}
                                                onChange={(e) => {
                                                    setRemoveBillCopy(e.target.checked);
                                                    if (e.target.checked) {
                                                        setBillCopyFile(null);
                                                    }
                                                }}
                                            />
                                            Remove bill copy
                                        </label>
                                    </div>
                                )}
                                <InputError message={errors.bill_copy} className="mt-1" />
                            </div>

                            <PrimaryButton disabled={processing}>
                                {isEdit ? 'Update' : 'Create'}
                            </PrimaryButton>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
