import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function FlashMessage() {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [visible, setVisible] = useState(false);
    const message = flash?.success || flash?.error;
    const isError = Boolean(flash?.error);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const t = setTimeout(() => setVisible(false), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    if (!visible || !message) return null;

    return (
        <div
            className={`fixed right-4 top-4 z-50 rounded-md px-4 py-3 text-sm shadow-lg ${
                isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
        >
            {message}
        </div>
    );
}
