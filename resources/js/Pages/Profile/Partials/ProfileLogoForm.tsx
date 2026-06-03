import LogoUploadField from '@/Components/LogoUploadField';
import { FormSectionHeader } from '@/Components/FormPage';
import { clearAuthUserCache, useAuthUser } from '@/auth/useAuthUser';

export default function ProfileLogoForm() {
    const { user, refresh } = useAuthUser();

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-4">
            <FormSectionHeader
                title="Profile Logo"
                description="Your logo is stored on your profile, not in documents."
            />
            <LogoUploadField
                label="User logo"
                logoUrl={user.logo_url}
                uploadPath="/profile/profile-logo-update"
                onUpdated={() => {
                    clearAuthUserCache();
                    void refresh();
                }}
            />
        </div>
    );
}
