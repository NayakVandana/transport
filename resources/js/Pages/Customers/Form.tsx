import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { Customer } from '@/types/transport';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function CustomerForm({ customer }: { customer: Customer | null }) {
    const isEdit = Boolean(customer);
    const { data, setData, post, put, processing, errors } = useForm({
        name: customer?.name ?? '',
        mobile: customer?.mobile ?? '',
        address: customer?.address ?? '',
        state_code: customer?.state_code ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit && customer) {
            put(route('customers.update', customer.id));
        } else {
            post(route('customers.store'));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-gray-800">
                    {isEdit ? 'Edit Customer' : 'New Customer'}
                </h2>
            }
        >
            <Head title={isEdit ? 'Edit Customer' : 'New Customer'} />

            <div className="py-8">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow">
                        <div>
                            <InputLabel value="Name" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="Mobile" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={data.mobile}
                                onChange={(e) => setData('mobile', e.target.value)}
                            />
                            <InputError message={errors.mobile} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="Address" />
                            <textarea
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={4}
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                            />
                            <InputError message={errors.address} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="State Code" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={data.state_code}
                                onChange={(e) => setData('state_code', e.target.value)}
                                placeholder="e.g. 27"
                            />
                        </div>
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update' : 'Create'}
                        </PrimaryButton>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
