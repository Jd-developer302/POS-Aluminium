import Dropdown from '@/Components/Dropdown';

function IconMenu({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
            />
        </svg>
    );
}

function IconSearch({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
        </svg>
    );
}

function IconBell({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
        </svg>
    );
}

export default function AuthenticatedHeader({
    toggleSidebar,
    currentBranch,
    user,
}) {
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <header className="sticky top-0 z-20 grid h-16 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-gray-200/80 bg-white px-3 shadow-sm sm:gap-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
                    aria-label="Toggle sidebar"
                >
                    <IconMenu className="h-5 w-5" />
                </button>

                <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-xs lg:max-w-md">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        placeholder="Search..."
                        className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                </div>
            </div>

            <div className="flex min-w-0 justify-center px-1">
                <span
                    className="inline-flex max-w-full truncate rounded-full bg-brand-muted px-2.5 py-1.5 text-xs font-semibold text-brand-on-muted sm:px-3 sm:text-sm"
                    title="Branch is fixed to your account assignment"
                >
                    Branch: {currentBranch?.name ?? '—'}
                </span>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-3">
                <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    aria-label="Notifications"
                >
                    <IconBell className="h-5 w-5" />
                </button>

                <Dropdown>
                    <Dropdown.Trigger>
                        <button
                            type="button"
                            className="flex max-w-[200px] items-center gap-2 rounded-lg py-1 text-start hover:bg-gray-50 sm:max-w-none sm:gap-3 sm:pr-2"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                                {userInitial}
                            </span>
                            <span className="hidden min-w-0 flex-col sm:flex">
                                <span className="truncate text-sm font-medium text-gray-900">
                                    {user?.name}
                                </span>
                                <span className="truncate text-xs text-gray-500">
                                    {user?.email}
                                </span>
                            </span>
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content align="right" width="48">
                        <Dropdown.Link href={route('profile.edit')}>
                            Profile
                        </Dropdown.Link>
                        <Dropdown.Link
                            href={route('logout')}
                            method="post"
                            as="button"
                        >
                            Log out
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
        </header>
    );
}
