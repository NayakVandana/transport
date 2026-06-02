import PageHeaderBar from '@/Components/PageHeaderBar';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

export function HeaderCreateButton({
    href,
    label,
    mobileLabel,
}: {
    href: string;
    label: string;
    mobileLabel?: string;
}) {
    return (
        <Link href={href} className="shrink-0">
            <PrimaryButton className={headerPrimaryBtnClass}>
                <span className="sm:hidden">{mobileLabel ?? label}</span>
                <span className="hidden sm:inline">{label}</span>
            </PrimaryButton>
        </Link>
    );
}

const headerPrimaryBtnClass =
    'whitespace-nowrap !px-2.5 !py-1.5 text-xs normal-case tracking-normal sm:!px-4 sm:!py-2 sm:uppercase sm:tracking-widest';

const headerSecondaryBtnClass =
    'whitespace-nowrap !px-2.5 !py-1.5 text-xs normal-case tracking-normal sm:!px-4 sm:!py-2 sm:uppercase sm:tracking-widest';

/** Compact secondary action for form/detail page headers (e.g. Back, Cancel). */
export function HeaderSecondaryButton({
    href,
    label,
    mobileLabel,
}: {
    href: string;
    label: string;
    mobileLabel?: string;
}) {
    return (
        <Link href={href} className="shrink-0">
            <SecondaryButton type="button" className={headerSecondaryBtnClass}>
                <span className="sm:hidden">{mobileLabel ?? label}</span>
                <span className="hidden sm:inline">{label}</span>
            </SecondaryButton>
        </Link>
    );
}

/** Compact header for detail/show pages. */
export function DetailPageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <PageHeaderBar layout="compact" title={title} subtitle={subtitle} actions={actions} />
    );
}

/** Compact header for create/edit form pages with a back action. */
export function FormPageHeader({
    title,
    backHref,
    backLabel = 'Back to list',
    backMobileLabel = 'Back',
}: {
    title: string;
    backHref: string;
    backLabel?: string;
    backMobileLabel?: string;
}) {
    return (
        <DetailPageHeader
            title={title}
            actions={
                <HeaderSecondaryButton
                    href={backHref}
                    label={backLabel}
                    mobileLabel={backMobileLabel}
                />
            }
        />
    );
}

export const headerCompactPrimaryClass = headerPrimaryBtnClass;
export const headerCompactSecondaryClass = headerSecondaryBtnClass;

type ListPageHeaderProps = {
    title: string;
    actions?: ReactNode;
    create?: { href: string; label: string; mobileLabel?: string };
};

/** Sticky top bar for listing pages — title left, compact action right on mobile. */
export default function ListPageHeader({ title, actions, create }: ListPageHeaderProps) {
    const resolvedActions =
        actions ??
        (create ? (
            <HeaderCreateButton
                href={create.href}
                label={create.label}
                mobileLabel={create.mobileLabel}
            />
        ) : undefined);

    return (
        <PageHeaderBar layout="compact" title={title} actions={resolvedActions} />
    );
}
