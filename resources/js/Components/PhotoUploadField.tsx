import InputLabel from '@/Components/InputLabel';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPostFormData, type ApiEnvelope } from '@/api/appClient';
import { useRef, useState } from 'react';

type PhotoUploadFieldProps = {
    label: string;
    photoUrl?: string | null;
    uploadPath: string;
    formFields?: Record<string, string | number>;
    onUpdated: (photoUrl: string | null) => void;
};

type PhotoUploadResponse = ApiEnvelope<{
    driver?: { photo_url?: string | null };
    party?: { photo_url?: string | null };
    user?: { photo_url?: string | null };
}>;

export default function PhotoUploadField({
    label,
    photoUrl,
    uploadPath,
    formFields,
    onUpdated,
}: PhotoUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadPhoto = async (file: File | null, remove = false) => {
        setProcessing(true);
        setError(null);

        try {
            const formData = new FormData();

            if (remove) {
                formData.append('remove_photo', '1');
            } else if (file) {
                formData.append('photo', file);
            } else {
                return;
            }

            Object.entries(formFields ?? {}).forEach(([key, value]) => {
                formData.append(key, String(value));
            });

            const res = await appApiPostFormData<PhotoUploadResponse>(uploadPath, formData);

            if (!res.success) {
                setError(res.message || 'Could not update photo.');
                return;
            }

            onUpdated(
                res.data?.driver?.photo_url ??
                    res.data?.party?.photo_url ??
                    res.data?.user?.photo_url ??
                    null,
            );

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        } catch {
            setError('Could not update photo.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <InputLabel value={label} />
            <div className="mt-2 flex flex-wrap items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {photoUrl ? (
                        <img src={photoUrl} alt={label} className="h-full w-full object-cover" />
                    ) : (
                        <span className="px-2 text-center text-xs text-gray-400">No photo</span>
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
                                void uploadPhoto(file);
                            }
                        }}
                    />
                    {photoUrl && (
                        <SecondaryButton
                            type="button"
                            disabled={processing}
                            onClick={() => void uploadPhoto(null, true)}
                        >
                            Remove photo
                        </SecondaryButton>
                    )}
                    <p className="text-xs text-gray-500">JPEG or PNG, up to 2 MB.</p>
                </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}
