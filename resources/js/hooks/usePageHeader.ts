import { usePageHeaderSetter } from '@/contexts/PageHeaderContext';
import { useLayoutEffect, type ReactNode } from 'react';

/**
 * Sets the authenticated layout page header.
 * Pass `deps` when the header content changes after load (e.g. record title).
 * Do not pass `header` itself as a dep — inline JSX is a new reference every render.
 */
export function usePageHeader(
    header: ReactNode,
    deps: readonly unknown[] = [],
): void {
    const setHeader = usePageHeaderSetter();

    useLayoutEffect(() => {
        setHeader(header);

        return () => {
            setHeader(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- header omitted on purpose
    }, [setHeader, ...deps]);
}
