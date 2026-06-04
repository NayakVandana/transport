import InputLabel from '@/Components/InputLabel';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPostFormData, type ApiEnvelope } from '@/api/appClient';
import { useRef, useState } from 'react';

type LogoUploadFieldProps = {
    label: string;
    logoUrl?: string | null;
    uploadPath: string;
    formFields?: Record<string, string | number>;
    onUpdated: (logoUrl: string | null) => void;
};

type LogoUploadResponse = ApiEnvelope<{
    user?: { logo_url?: string | null };
    company?: { logo_url?: string | null };
    party?: { logo_url?: string | null };
}>;

export default function LogoUploadField({
    label,
    logoUrl,
    uploadPath,
    formFields,
    onUpdated,
}: LogoUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadLogo = async (file: File | null, remove = false) => {
        setProcessing(true);
        setError(null);

        try {
            const formData = new FormData();

            if (remove) {
                formData.append('remove_logo', '1');
            } else if (file) {
                formData.append('logo', file);
            } else {
                return;
            }

            Object.entries(formFields ?? {}).forEach(([key, value]) => {
                formData.append(key, String(value));
            });

            const res = await appApiPostFormData<LogoUploadResponse>(uploadPath, formData);

            if (!res.success) {
                setError(res.message || 'Could not update logo.');
                return;
            }

            const nextUrl =
                res.data?.user?.logo_url ??
                res.data?.company?.logo_url ??
                res.data?.party?.logo_url ??
                null;

            onUpdated(nextUrl ?? null);

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        } catch {
            setError('Could not update logo.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <InputLabel value={label} />
            <div className="mt-2 flex flex-wrap items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {logoUrl ? (
                        <img src={logoUrl} alt={label} className="h-full w-full object-contain" />
                    ) : (
                        <span className="px-2 text-center text-xs text-gray-400">No logo</span>
                    )}
                </div>

                <div className="space-y-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="block w-full max-w-xs text-sm text-gray-600 file:me-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                        disabled={processing}
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (file) {
                                void uploadLogo(file);
                            }
                        }}
                    />
                    {logoUrl && (
                        <SecondaryButton
                            type="button"
                            disabled={processing}
                            onClick={() => void uploadLogo(null, true)}
                        >
                            Remove logo
                        </SecondaryButton>
                    )}
                    <p className="text-xs text-gray-500">JPEG or PNG, up to 2 MB.</p>
                </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}
