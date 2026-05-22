import FlashToastListener from '@/Components/FlashToastListener';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import AuthenticatedFooter from '@/Layouts/Partials/AuthenticatedFooter';
import AuthenticatedHeader from '@/Layouts/Partials/AuthenticatedHeader';
import AuthenticatedSidebar from '@/Layouts/Partials/AuthenticatedSidebar';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, currentBranch, branding } = usePage().props;
    const user = auth?.user;
    const url = usePage().url;

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    useEffect(() => {
        try {
            if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') {
                setSidebarCollapsed(true);
            }
        } catch {
            //
        }
    }, []);

    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [url]);

    useEffect(() => {
        if (!mobileDrawerOpen) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setMobileDrawerOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mobileDrawerOpen]);

    const toggleSidebar = () => {
        const isLarge = window.matchMedia('(min-width: 1024px)').matches;
        if (isLarge) {
            setSidebarCollapsed((c) => {
                const next = !c;
                try {
                    localStorage.setItem(
                        SIDEBAR_COLLAPSED_KEY,
                        next ? '1' : '0',
                    );
                } catch {
                    //
                }
                return next;
            });
        } else {
            setMobileDrawerOpen((o) => !o);
        }
    };

    const showCollapsed = sidebarCollapsed;
    const faviconHref = branding?.favicon_url;

    return (
        <>
            <FlashToastListener />
            {faviconHref ? (
                <Head>
                    <link rel="icon" href={faviconHref} />
                </Head>
            ) : null}
            <div className="min-h-screen bg-brand-surface">
                <div
                    className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity duration-layout lg:hidden ${
                        mobileDrawerOpen
                            ? 'visible opacity-100'
                            : 'invisible opacity-0 pointer-events-none'
                    }`}
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-hidden="true"
                />

                <AuthenticatedSidebar
                    mobileDrawerOpen={mobileDrawerOpen}
                    showCollapsed={showCollapsed}
                />

                <div
                    className={`flex min-h-screen flex-col transition-[margin] duration-layout ease-out ${
                        showCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64'
                    }`}
                >
                    <AuthenticatedHeader
                        toggleSidebar={toggleSidebar}
                        currentBranch={currentBranch}
                        user={user}
                    />

                    <main className="flex-1">
                        {header && (
                            <div className="border-b border-gray-200/80 bg-white px-4 py-5 sm:px-6 lg:px-8">
                                <div className="mx-auto max-w-7xl">
                                    {header}
                                </div>
                            </div>
                        )}
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>

                    <AuthenticatedFooter />
                </div>
            </div>
        </>
    );
}
