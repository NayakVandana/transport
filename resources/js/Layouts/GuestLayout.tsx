import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 px-4 pt-6 sm:justify-center sm:px-0 sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-16 w-16 fill-current text-gray-500 sm:h-20 sm:w-20" />
                </Link>
            </div>

            <div className="mt-6 w-full max-w-md overflow-hidden rounded-lg bg-white px-4 py-4 shadow-md sm:px-6 sm:py-6">
                {children}
            </div>
        </div>
    );
}
