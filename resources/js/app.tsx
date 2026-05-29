import '../css/app.css';
import './bootstrap';

import { appLayout } from '@/Layouts/AppLayout';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import type { ComponentType, ReactNode } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const guestPages = new Set([
    'Welcome',
    'Auth/Login',
    'Auth/Register',
    'Auth/ForgotPassword',
    'Auth/ResetPassword',
    'Auth/VerifyEmail',
    'Auth/ConfirmPassword',
]);

const noLayoutPages = new Set(['Invoices/Print']);

type PageModule = {
    default: ComponentType<Record<string, unknown>> & {
        layout?: (page: ReactNode) => ReactNode;
    };
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const page = (await resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        )) as PageModule;

        if (!guestPages.has(name) && !noLayoutPages.has(name)) {
            page.default.layout = appLayout;
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: false,
});
