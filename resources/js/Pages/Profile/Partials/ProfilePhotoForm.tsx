import PhotoUploadField from '@/Components/PhotoUploadField';
import { FormSectionHeader } from '@/Components/FormPage';
import { clearAuthUserCache, useAuthUser } from '@/auth/useAuthUser';

export default function ProfilePhotoForm() {
    const { user, refresh } = useAuthUser();

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-4">
            <FormSectionHeader
                title="Profile Photo"
                description="Your photo is stored on your profile, not in documents."
            />
            <PhotoUploadField
                label="User photo"
                photoUrl={user.photo_url}
                uploadPath="/profile/profile-photo-update"
                onUpdated={() => {
                    clearAuthUserCache();
                    void refresh();
                }}
            />
        </div>
    );
}
