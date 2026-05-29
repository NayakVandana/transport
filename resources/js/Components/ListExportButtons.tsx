import SecondaryButton from '@/Components/SecondaryButton';

type ListExportButtonsProps = {
    onExport: (type: 'csv' | 'pdf') => void;
};

export default function ListExportButtons({ onExport }: ListExportButtonsProps) {
    return (
        <>
            <SecondaryButton
                type="button"
                onClick={() => onExport('csv')}
                className="!px-2.5 !py-1 normal-case tracking-normal"
            >
                CSV
            </SecondaryButton>
            <SecondaryButton
                type="button"
                onClick={() => onExport('pdf')}
                className="!px-2.5 !py-1 normal-case tracking-normal"
            >
                PDF
            </SecondaryButton>
        </>
    );
}
