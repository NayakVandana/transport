import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

type PageHeaderContextValue = {
    header: ReactNode;
    setHeader: (header: ReactNode) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
    const [header, setHeaderState] = useState<ReactNode>(null);

    const setHeader = useCallback((next: ReactNode) => {
        setHeaderState(next);
    }, []);

    const value = useMemo(
        () => ({
            header,
            setHeader,
        }),
        [header, setHeader],
    );

    return (
        <PageHeaderContext.Provider value={value}>
            {children}
        </PageHeaderContext.Provider>
    );
}

export function usePageHeaderValue(): ReactNode {
    return useContext(PageHeaderContext)?.header ?? null;
}

export function usePageHeaderSetter(): (header: ReactNode) => void {
    const context = useContext(PageHeaderContext);

    if (!context) {
        return () => {};
    }

    return context.setHeader;
}
