import Dropdown from '@/Components/Dropdown';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

/** Inertia/JSON sometimes yields plain objects; normalize for .includes */
function asStringList(value) {
    if (value == null) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.map((v) =>
            typeof v === 'string' ? v : String(v?.name ?? v ?? ''),
        );
    }
    if (typeof value === 'object') {
        return Object.values(value).map((v) =>
            typeof v === 'string' ? v : String(v?.name ?? v ?? ''),
        );
    }
    return [];
}

function inertiaPathname(url) {
    let p = (url ?? '/').split('?')[0].split('#')[0];
    if (!p.startsWith('/')) {
        p = `/${p}`;
    }
    return p || '/';
}

function pathMatchesCatalog(url, basePath) {
    const pathname = inertiaPathname(url);
    return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function IconDashboard({ className }) {
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
        </svg>
    );
}

function IconBuilding({ className }) {
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
        </svg>
    );
}

function IconBranch({ className }) {
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
        </svg>
    );
}

function IconWarehouse({ className }) {
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
        </svg>
    );
}

function IconCatalog({ className }) {
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
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
        </svg>
    );
}

function IconRectangleStack({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
        </svg>
    );
}

function IconBrand({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9h.008v.008H6V9z"
            />
        </svg>
    );
}

function IconCube({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
            />
        </svg>
    );
}

function IconPercent({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 4.5 4.5 19.5M9.75 9.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm4.5 4.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
        </svg>
    );
}

function IconSwatch({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15a4.5 4.5 0 004.5 4.5H17.25a4.5 4.5 0 10-4.5-4.5V4.5a2.25 2.25 0 10-4.5 0V15z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 10.5h4.5"
            />
        </svg>
    );
}

function IconProducts({ className }) {
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
        </svg>
    );
}

function IconShoppingCart({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3.75h1.386c.51 0 .955.343 1.087.835l.383 1.437m0 0L6.75 15.75h11.628c.46 0 .86-.312.97-.758l1.5-6A1 1 0 0 0 19.88 7.5H5.106m0 0L4.5 5.25m3.75 16.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
        </svg>
    );
}

function IconShield({ className }) {
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
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
        </svg>
    );
}

function IconUsers({ className }) {
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
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.813-2.022M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
        </svg>
    );
}

function IconClock({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
            />
        </svg>
    );
}

function IconCalendar({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
            />
        </svg>
    );
}

function IconListBullet({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.008v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.008v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.008v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
        </svg>
    );
}

function IconArrowRightOnRectangle({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3-6 3 3m0 0-3 3m3-3H9"
            />
        </svg>
    );
}

function IconBriefcase({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M20.25 7.5H3.75M20.25 7.5V18A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V7.5M9 9.75H15M9 12.75H15M12 3.75v3.75"
            />
        </svg>
    );
}

function IconCog6Tooth({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.094c.55 0 1.02.398 1.11.94l.149.894c.07.424.37.774.78.908.545.178 1.05.443 1.5.785.34.26.79.32 1.154.145l.84-.402c.5-.24 1.1-.12 1.43.32l.77 1.047c.33.45.28 1.07-.13 1.46l-.671.64a1.125 1.125 0 0 0-.33 1.08c.14.55.21 1.12.21 1.71 0 .59-.07 1.16-.21 1.71-.12.45.02.93.33 1.08l.671.64c.41.39.46 1.01.13 1.46l-.77 1.047c-.33.44-.93.56-1.43.32l-.84-.402a1.125 1.125 0 0 0-1.154.145 6.958 6.958 0 0 1-1.5.785c-.41.134-.71.484-.78.908l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.125 1.125 0 0 0-.78-.908 6.958 6.958 0 0 1-1.5-.785 1.125 1.125 0 0 0-1.154-.145l-.84.402c-.5.24-1.1.12-1.43-.32l-.77-1.047c-.33-.45-.28-1.07.13-1.46l.671-.64c.31-.3.45-.74.33-1.08A6.978 6.978 0 0 1 3 12c0-.59.07-1.16.21-1.71.12-.45-.02-.93-.33-1.08l-.671-.64c-.41-.39-.46-1.01-.13-1.46l.77-1.047c.33-.44.93-.56 1.43-.32l.84.402c.39.19.85.12 1.154-.145.45-.342.955-.607 1.5-.785.41-.134.71-.484.78-.908l.149-.894Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
        </svg>
    );
}

function IconBanknotes({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75v-10.5A2.25 2.25 0 0 1 4.5 6h15A2.25 2.25 0 0 1 21.75 8.25v10.5A2.25 2.25 0 0 1 19.5 21h-15a2.25 2.25 0 0 1-2.25-2.25Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9.75h.008v.008H6V9.75Zm0 4.5h.008v.008H6v-.008ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"
            />
        </svg>
    );
}

function IconArrowsRightLeft({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21 3 16.5l4.5-4.5M3 16.5h13.5M16.5 3 21 7.5 16.5 12M21 7.5H7.5"
            />
        </svg>
    );
}

function IconSquares2x2({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25z"
            />
        </svg>
    );
}

function IconChevronDown({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
        </svg>
    );
}

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

function SidebarNavItem({
    href,
    active,
    collapsed,
    icon: Icon,
    label,
    disabled,
}) {
    const inner = (
        <>
            <Icon className="h-5 w-5 shrink-0" />
            <span
                className={`truncate font-medium transition-opacity duration-layout ${
                    collapsed ? 'lg:hidden lg:w-0 lg:opacity-0' : ''
                }`}
            >
                {label}
            </span>
        </>
    );

    const base =
        `flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors duration-layout px-3 ` +
        (collapsed ? 'lg:justify-center lg:gap-0 lg:px-0 ' : '') +
        (active
            ? 'bg-black/20 text-white shadow-inner'
            : 'text-white/90 hover:bg-white/10') +
        (disabled ? ' pointer-events-none cursor-not-allowed opacity-40 hover:bg-transparent' : '');

    if (disabled) {
        return (
            <div className={base} title={collapsed ? label : undefined}>
                {inner}
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={base}
            title={collapsed ? label : undefined}
        >
            {inner}
        </Link>
    );
}

function SidebarCollapsibleNavGroup({
    collapsed,
    items,
    title,
    TitleIcon,
    subMenuId,
    parentActivePath,
}) {
    const { url } = usePage();

    const childActive = (item) => {
        if (item.routeCheck) {
            return route().current(item.routeCheck);
        }
        if (item.activePath) {
            return pathMatchesCatalog(url, item.activePath);
        }
        return false;
    };

    const anyChildActive = items.some((item) => childActive(item));
    const headerActive =
        anyChildActive ||
        (parentActivePath ? pathMatchesCatalog(url, parentActivePath) : false);

    const [open, setOpen] = useState(headerActive);

    useEffect(() => {
        if (headerActive) {
            setOpen(true);
        }
    }, [url, headerActive]);

    if (items.length === 0) {
        return null;
    }

    if (collapsed) {
        return (
            <>
                {items.map((item) => (
                    <SidebarNavItem
                        key={item.label}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        collapsed={collapsed}
                        active={childActive(item)}
                    />
                ))}
            </>
        );
    }

    return (
        <div className="flex flex-col gap-0.5">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={
                    'flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-start text-sm transition-colors duration-layout ' +
                    (headerActive
                        ? 'bg-black/20 text-white shadow-inner'
                        : 'text-white/90 hover:bg-white/10')
                }
                aria-expanded={open}
                aria-controls={subMenuId}
            >
                <TitleIcon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium">
                    {title}
                </span>
                <IconChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-layout ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>
            {open && (
                <div
                    id={subMenuId}
                    className="ml-3 flex flex-col gap-0.5 border-l border-white/20 pl-2"
                >
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = childActive(item);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={
                                    'flex items-center gap-2 rounded-lg py-2 pl-2 pr-3 text-sm transition-colors duration-layout ' +
                                    (active
                                        ? 'bg-black/20 font-medium text-white shadow-inner'
                                        : 'text-white/85 hover:bg-white/10')
                                }
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

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

    const { appName: appNameFromSettings } = usePage().props;
    const appName =
        (typeof appNameFromSettings === 'string' && appNameFromSettings !== ''
            ? appNameFromSettings
            : null) ||
        import.meta.env.VITE_APP_NAME ||
        'TechLape POS';

    const userManagementItems = [];
    const userPerms = asStringList(user?.permissions);
    if (userPerms.includes('settings.roles')) {
        userManagementItems.push({
            label: 'Roles',
            href: route('roles.index'),
            routeCheck: 'roles.*',
            icon: IconShield,
        });
    }
    if (userPerms.includes('settings.users')) {
        userManagementItems.push({
            label: 'Users',
            href: route('users.index'),
            routeCheck: 'users.*',
            icon: IconUsers,
        });
    }

    const settingsNavItem = {
        label: 'Settings',
        href: route('settings.index'),
        routeCheck: 'settings.*',
        activePath: '/settings',
        icon: IconCog6Tooth,
        permission: 'settings.view',
    };

    const expenseItems = [];
    const hasExpenseAccess =
        userPerms.includes('accounting.expenses') ||
        userPerms.includes('accounting.view') ||
        userPerms.includes('expenses.view') ||
        userPerms.includes('expenses.edit') ||
        userPerms.includes('expenses.delete');

    if (hasExpenseAccess) {
        expenseItems.push({
            label: 'Expense Category',
            href: route('expense-categories.index'),
            routeCheck: 'expense-categories.*',
            activePath: '/expense-categories',
            icon: IconRectangleStack,
        });
        expenseItems.push({
            label: 'Expense',
            href: route('expenses.index'),
            routeCheck: 'expenses.*',
            activePath: '/expenses',
            icon: IconBanknotes,
        });
    }

    const employeeItems = [
        {
            label: 'Departments',
            href: route('departments.index'),
            routeCheck: 'departments.*',
            activePath: '/departments',
            icon: IconBuilding,
        },
        {
            label: 'Designations',
            href: route('designations.index'),
            routeCheck: 'designations.*',
            activePath: '/designations',
            icon: IconRectangleStack,
        },
        {
            label: 'Leave types',
            href: route('leave-types.index'),
            routeCheck: 'leave-types.*',
            activePath: '/leave-types',
            icon: IconCalendar,
        },
        {
            label: 'Leave balances',
            href: route('leave-balances.index'),
            routeCheck: 'leave-balances.*',
            activePath: '/leave-balances',
            icon: IconListBullet,
        },
        {
            label: 'Leaves',
            href: route('leaves.index'),
            routeCheck: 'leaves.*',
            activePath: '/leaves',
            icon: IconArrowRightOnRectangle,
        },
        {
            label: 'Employees',
            href: route('employees.index'),
            routeCheck: 'employees.*',
            activePath: '/employees',
            icon: IconUsers,
        },
        {
            label: 'Attendance',
            href: route('attendances.index'),
            routeCheck: 'attendances.*',
            activePath: '/attendances',
            icon: IconClock,
        },
        {
            label: 'Payroll',
            href: route('payrolls.index'),
            routeCheck: 'payrolls.*',
            activePath: '/payrolls',
            icon: IconBanknotes,
        },
    ];

    const catalogItems = [];
    if (userPerms.includes('categories.view')) {
        catalogItems.push({
            label: 'Category',
            href: route('categories.index'),
            routeCheck: 'categories.*',
            icon: IconCatalog,
        });
    }
    if (
        userPerms.includes('sub_categories.view') ||
        userPerms.includes('categories.view')
    ) {
        catalogItems.push({
            label: 'Sub Category',
            href: route('sub-categories.index'),
            routeCheck: 'sub-categories.*',
            icon: IconRectangleStack,
        });
    }
    if (userPerms.includes('brands.view')) {
        catalogItems.push({
            label: 'Brands',
            href: route('brands.index'),
            routeCheck: 'brands.*',
            icon: IconBrand,
        });
    }
    if (userPerms.includes('units.view')) {
        catalogItems.push({
            label: 'Units',
            href: route('units.index'),
            routeCheck: 'units.*',
            icon: IconCube,
        });
    }
    if (
        userPerms.includes('taxes.view') ||
        userPerms.includes('settings.taxes')
    ) {
        catalogItems.push({
            label: 'Taxes',
            href: route('taxes.index'),
            routeCheck: 'taxes.*',
            icon: IconPercent,
        });
    }
    catalogItems.push({
        label: 'Attributes',
        href: route('attributes.index'),
        routeCheck: 'attributes.*',
        icon: IconSwatch,
    });
    catalogItems.push({
        label: 'Attribute Values',
        href: route('attribute-values.index'),
        routeCheck: 'attribute-values.*',
        icon: IconRectangleStack,
    });

    const filterNavItem = (item) => {
        const perms = asStringList(user?.permissions);
        if (item.permissionsAny?.length) {
            return item.permissionsAny.some((p) => perms.includes(p));
        }
        return !item.permission || perms.includes(item.permission);
    };

    const navEntriesTop = [
        {
            label: 'Dashboard',
            href: route('dashboard'),
            routeName: 'dashboard',
            icon: IconDashboard,
        },
        // {
        //     label: 'Companies',
        //     href: '#',
        //     icon: IconBuilding,
        //     disabled: true,
        // },
        {
            label: 'Branches',
            href: route('branches.index'),
            routeCheck: 'branches.*',
            icon: IconBranch,
            permission: 'branches.view',
        },
        {
            label: 'Warehouses',
            href: route('warehouses.index'),
            routeCheck: 'warehouses.*',
            icon: IconWarehouse,
            permission: 'warehouses.view',
        },
    ].filter(filterNavItem);

    const productNavItem = {
        label: 'Products',
        href: route('products.index'),
        routeCheck: 'products.*',
        icon: IconProducts,
        permission: 'products.view',
    };

    const showProductsNav = filterNavItem(productNavItem);

    const salesNavItem = {
        label: 'Sales',
        href: route('sales.index'),
        routeCheck: 'sales.*',
        icon: IconShoppingCart,
        permission: 'sales.view',
    };
    const showSalesNav = filterNavItem(salesNavItem);

    const quotationsNavItem = {
        label: 'Quotations',
        href: route('quotations.index'),
        routeCheck: 'quotations.*',
        icon: IconRectangleStack,
        permission: 'sales.view',
    };
    const showQuotationsNav = filterNavItem(quotationsNavItem);

    const saleHistoryNavItem = {
        label: 'Sale history',
        href: route('sale-history.index'),
        routeCheck: 'sale-history.*',
        activePath: '/sale-history',
        icon: IconCalendar,
        permission: 'sales.view',
    };
    const showSaleHistoryNav = filterNavItem(saleHistoryNavItem);

    const saleReturnsNavItem = {
        label: 'Sale returns',
        href: route('sale-returns.index'),
        routeCheck: 'sale-returns.*',
        icon: IconRectangleStack,
        permission: 'sales.view',
    };
    const showSaleReturnsNav = filterNavItem(saleReturnsNavItem);

    const saleAndReturnItems = [];
    if (showSalesNav) {
        saleAndReturnItems.push({
            href: salesNavItem.href,
            label: salesNavItem.label,
            icon: salesNavItem.icon,
            routeCheck: salesNavItem.routeCheck,
        });
    }
    if (showQuotationsNav) {
        saleAndReturnItems.push({
            href: quotationsNavItem.href,
            label: quotationsNavItem.label,
            icon: quotationsNavItem.icon,
            routeCheck: quotationsNavItem.routeCheck,
        });
    }
    if (showSaleHistoryNav) {
        saleAndReturnItems.push({
            href: saleHistoryNavItem.href,
            label: saleHistoryNavItem.label,
            icon: saleHistoryNavItem.icon,
            routeCheck: saleHistoryNavItem.routeCheck,
            activePath: saleHistoryNavItem.activePath,
        });
    }
    if (showSaleReturnsNav) {
        saleAndReturnItems.push({
            href: saleReturnsNavItem.href,
            label: saleReturnsNavItem.label,
            icon: saleReturnsNavItem.icon,
            routeCheck: saleReturnsNavItem.routeCheck,
        });
    }

    const purchaseOrdersNavItem = {
        label: 'Purchase Orders',
        href: route('purchase-orders.index'),
        routeCheck: 'purchase-orders.*',
        icon: IconSquares2x2,
        permission: 'purchases.view',
    };
    const showPurchaseOrdersNav = filterNavItem(purchaseOrdersNavItem);

    const purchaseInvoicesNavItem = {
        label: 'Purchase Invoices',
        href: route('purchase-invoices.index'),
        routeCheck: 'purchase-invoices.*',
        icon: IconRectangleStack,
        permission: 'purchases.view',
    };
    const showPurchaseInvoicesNav = filterNavItem(purchaseInvoicesNavItem);

    const purchaseHistoryNavItem = {
        label: 'Purchase history',
        href: route('purchase-history.index'),
        routeCheck: 'purchase-history.*',
        activePath: '/purchase-history',
        icon: IconClock,
        permission: 'purchases.view',
    };
    const showPurchaseHistoryNav = filterNavItem(purchaseHistoryNavItem);

    const purchaseItems = [];
    if (showPurchaseOrdersNav) {
        purchaseItems.push({
            href: purchaseOrdersNavItem.href,
            label: purchaseOrdersNavItem.label,
            icon: purchaseOrdersNavItem.icon,
            routeCheck: purchaseOrdersNavItem.routeCheck,
        });
    }
    if (showPurchaseInvoicesNav) {
        purchaseItems.push({
            href: purchaseInvoicesNavItem.href,
            label: purchaseInvoicesNavItem.label,
            icon: purchaseInvoicesNavItem.icon,
            routeCheck: purchaseInvoicesNavItem.routeCheck,
        });
    }
    if (showPurchaseHistoryNav) {
        purchaseItems.push({
            href: purchaseHistoryNavItem.href,
            label: purchaseHistoryNavItem.label,
            icon: purchaseHistoryNavItem.icon,
            routeCheck: purchaseHistoryNavItem.routeCheck,
            activePath: purchaseHistoryNavItem.activePath,
        });
    }

    const suppliersNavItem = {
        label: 'Suppliers',
        href: route('suppliers.index'),
        routeCheck: 'suppliers.*',
        icon: IconBanknotes,
        permission: 'suppliers.view',
    };
    const showSuppliersNav = filterNavItem(suppliersNavItem);

    const customersNavItem = {
        label: 'Customers',
        href: route('customers.index'),
        routeCheck: 'customers.*',
        icon: IconUsers,
        permission: 'customers.view',
    };
    const showCustomersNav = filterNavItem(customersNavItem);

    const customerBalancesNavItem = {
        label: 'Customer balances',
        href: route('customer-receivables.index'),
        routeCheck: 'customer-receivables.*',
        icon: IconBanknotes,
        permission: 'customers.view',
    };
    const showCustomerBalancesNav = filterNavItem(customerBalancesNavItem);


    const stocksNavItem = {
        label: 'Stocks',
        href: route('stocks.index'),
        routeCheck: 'stocks.*',
        icon: IconCube,
        permission: 'inventory.view',
    };
    const showStocksNav = filterNavItem(stocksNavItem);

    const stockTransfersNavItem = {
        label: 'Stock Transfers',
        href: route('stock-transfers.index'),
        routeCheck: 'stock-transfers.*',
        icon: IconArrowsRightLeft,
        permissionsAny: ['inventory.transfer', 'accounting.expenses', 'accounting.view'],
    };
    const showStockTransfersNav = filterNavItem(stockTransfersNavItem);

    const stockItems = [];
    if (showStocksNav) {
        stockItems.push({
            href: stocksNavItem.href,
            label: stocksNavItem.label,
            icon: stocksNavItem.icon,
            routeCheck: stocksNavItem.routeCheck,
        });
    }
    if (showStockTransfersNav) {
        stockItems.push({
            href: stockTransfersNavItem.href,
            label: stockTransfersNavItem.label,
            icon: stockTransfersNavItem.icon,
            routeCheck: stockTransfersNavItem.routeCheck,
        });
    }

    const inventoryMovementsNavItem = {
        label: 'Inventory Movements',
        href: route('inventory-movements.index'),
        routeCheck: 'inventory-movements.*',
        activePath: '/inventory-movements',
        icon: IconRectangleStack,
        permission: 'inventory.movement',
    };
    const showInventoryMovementsNav = filterNavItem(inventoryMovementsNavItem);

    const canViewReports = filterNavItem({ permission: 'reports.view' });
    const reportNavItems = canViewReports
        ? [
              {
                  label: 'Overview',
                  href: route('reports.index'),
                  routeCheck: 'reports.index',
                  icon: IconListBullet,
              },
          ]
        : [];

    const showCollapsed = sidebarCollapsed;
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

    const faviconHref = branding?.favicon_url;

    return (
        <>
            {faviconHref ? (
                <Head>
                    <link rel="icon" href={faviconHref} />
                </Head>
            ) : null}
            <div className="min-h-screen bg-brand-surface">
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity duration-layout lg:hidden ${
                    mobileDrawerOpen
                        ? 'visible opacity-100'
                        : 'invisible opacity-0 pointer-events-none'
                }`}
                onClick={() => setMobileDrawerOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-brand text-white shadow-lg transition-all duration-layout ease-out ${
                    mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 ${
                    showCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-64'
                }`}
            >
                <div
                    className={`flex shrink-0 items-center border-b border-white/10 ${
                        showCollapsed
                            ? 'h-16 justify-center px-2 lg:px-2'
                            : branding?.logo_large_url
                              ? 'min-h-14 w-full justify-center px-2 py-2'
                              : 'h-16 px-4'
                    }`}
                >
                    {!showCollapsed && branding?.logo_large_url ? (
                        <img
                            src={branding.logo_large_url}
                            alt=""
                            className="h-auto w-full max-h-20 object-contain object-center"
                        />
                    ) : null}
                    {!showCollapsed && !branding?.logo_large_url ? (
                        <span className="text-lg font-semibold tracking-tight text-white transition-opacity duration-layout">
                            {appName}
                        </span>
                    ) : null}
                    {showCollapsed && branding?.logo_small_url ? (
                        <img
                            src={branding.logo_small_url}
                            alt=""
                            className="hidden h-9 w-9 object-contain lg:inline"
                        />
                    ) : null}
                    {showCollapsed && !branding?.logo_small_url ? (
                        <span className="hidden text-lg font-bold text-white lg:inline">
                            {appName.charAt(0)}
                        </span>
                    ) : null}
                </div>

                <nav className="scrollbar-hidden flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                    {navEntriesTop.map((item) => (
                        <SidebarNavItem
                            key={item.label}
                            href={item.href}
                            label={item.label}
                            icon={item.icon}
                            collapsed={showCollapsed}
                            disabled={item.disabled}
                            active={
                                item.activePath
                                    ? pathMatchesCatalog(url, item.activePath)
                                    : item.routeCheck
                                      ? route().current(item.routeCheck)
                                      : item.routeName
                                        ? route().current(item.routeName)
                                        : false
                            }
                        />
                    ))}
                    {showSuppliersNav && (
                        <SidebarNavItem
                            href={suppliersNavItem.href}
                            label={suppliersNavItem.label}
                            icon={suppliersNavItem.icon}
                            collapsed={showCollapsed}
                            active={route().current(suppliersNavItem.routeCheck)}
                        />
                    )}
                    {showCustomersNav && (
                        <SidebarNavItem
                            href={customersNavItem.href}
                            label={customersNavItem.label}
                            icon={customersNavItem.icon}
                            collapsed={showCollapsed}
                            active={route().current(customersNavItem.routeCheck)}
                        />
                    )}
                    {showCustomerBalancesNav && (
                        <SidebarNavItem
                            href={customerBalancesNavItem.href}
                            label={customerBalancesNavItem.label}
                            icon={customerBalancesNavItem.icon}
                            collapsed={showCollapsed}
                            active={route().current(customerBalancesNavItem.routeCheck)}
                        />
                    )}
                    <SidebarCollapsibleNavGroup
                        collapsed={showCollapsed}
                        items={catalogItems}
                        title="Catalog"
                        TitleIcon={IconCatalog}
                        subMenuId="sidebar-catalog-sub"
                    />
                    {showProductsNav && (
                        <SidebarNavItem
                            href={productNavItem.href}
                            label={productNavItem.label}
                            icon={productNavItem.icon}
                            collapsed={showCollapsed}
                            active={route().current(productNavItem.routeCheck)}
                        />
                    )}
                    <SidebarCollapsibleNavGroup
                        collapsed={showCollapsed}
                        items={stockItems}
                        title="Stock"
                        TitleIcon={IconWarehouse}
                        subMenuId="sidebar-stock-sub"
                    />
                    <SidebarCollapsibleNavGroup
                        collapsed={showCollapsed}
                        items={saleAndReturnItems}
                        title="Sale & Returns"
                        TitleIcon={IconShoppingCart}
                        subMenuId="sidebar-sale-return-sub"
                    />
                    <SidebarCollapsibleNavGroup
                        collapsed={showCollapsed}
                        items={purchaseItems}
                        title="Purchase"
                        TitleIcon={IconRectangleStack}
                        subMenuId="sidebar-purchase-sub"
                    />
                    {showInventoryMovementsNav && (
                        <SidebarNavItem
                            href={inventoryMovementsNavItem.href}
                            label={inventoryMovementsNavItem.label}
                            icon={inventoryMovementsNavItem.icon}
                            collapsed={showCollapsed}
                            active={
                                inventoryMovementsNavItem.activePath
                                    ? pathMatchesCatalog(url, inventoryMovementsNavItem.activePath)
                                    : route().current(inventoryMovementsNavItem.routeCheck)
                            }
                        />
                    )}
                    {employeeItems.length > 0 && (
                        <SidebarCollapsibleNavGroup
                            collapsed={showCollapsed}
                            items={employeeItems}
                            title="HR Management"
                            TitleIcon={IconBriefcase}
                            subMenuId="sidebar-employee-sub"
                        />
                    )}
                    <SidebarCollapsibleNavGroup
                        collapsed={showCollapsed}
                        items={expenseItems}
                        title="Expense"
                        TitleIcon={IconBanknotes}
                        subMenuId="sidebar-expense-sub"
                    />
                    <SidebarCollapsibleNavGroup
                        collapsed={showCollapsed}
                        items={reportNavItems}
                        title="Reports"
                        TitleIcon={IconListBullet}
                        subMenuId="sidebar-reports-sub"
                        parentActivePath="/reports"
                    />
                    <SidebarCollapsibleNavGroup
                        collapsed={showCollapsed}
                        items={userManagementItems}
                        title="User Management"
                        TitleIcon={IconSquares2x2}
                        subMenuId="sidebar-user-management-sub"
                    />
                    {filterNavItem(settingsNavItem) && (
                        <SidebarNavItem
                            href={settingsNavItem.href}
                            label={settingsNavItem.label}
                            icon={settingsNavItem.icon}
                            collapsed={showCollapsed}
                            active={route().current(settingsNavItem.routeCheck)}
                        />
                    )}
                </nav>
            </aside>

            {/* Main column */}
            <div
                className={`flex min-h-screen flex-col transition-[margin] duration-layout ease-out ${
                    showCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64'
                }`}
            >
                {/* Top header */}
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

                {/* Page content */}
                <main className="flex-1">
                    {header && (
                        <div className="border-b border-gray-200/80 bg-white px-4 py-5 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-7xl">{header}</div>
                        </div>
                    )}
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto border-t border-gray-200 bg-white px-4 py-4 text-xs text-gray-500 sm:px-6">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
                        <p>
                            © {new Date().getFullYear()}, made with{' '}
                            <span className="text-brand" aria-hidden="true">
                                ♥
                            </span>{' '}
                            for a better web.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="#"
                                className="hover:text-brand-dark"
                                onClick={(e) => e.preventDefault()}
                            >
                                About Us
                            </a>
                            <a
                                href="#"
                                className="hover:text-brand-dark"
                                onClick={(e) => e.preventDefault()}
                            >
                                Blog
                            </a>
                            <a
                                href="#"
                                className="hover:text-brand-dark"
                                onClick={(e) => e.preventDefault()}
                            >
                                License
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
        </>
    );
}
