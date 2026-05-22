import FlashToastListener from '@/Components/FlashToastListener';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { branding } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col items-center bg-brand pt-6 sm:justify-center sm:pt-0">
            <FlashToastListener />
            {branding?.favicon_url ? (
                <Head>
                    <link rel="icon" href={branding.favicon_url} />
                </Head>
            ) : null}
            <div>
                <Link href="/">
                    {branding?.logo_large_url ? (
                        <img
                            src={branding.logo_large_url}
                            alt=""
                            className="h-20 w-auto max-w-[220px] object-contain"
                        />
                    ) : (
                        <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" />
                    )}
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
