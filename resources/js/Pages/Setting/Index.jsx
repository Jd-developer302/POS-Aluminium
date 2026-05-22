import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const iconStroke = 1.75;

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function IconGear({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
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

function IconBuilding({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 21h18M6 21V7.5A2.25 2.25 0 0 1 8.25 5.25h7.5A2.25 2.25 0 0 1 18 7.5V21M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01"
            />
        </svg>
    );
}

function IconReceipt({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 8.25h6m-6 3h6m-6 3h3M6.75 3h10.5A1.5 1.5 0 0 1 18.75 4.5v16.237a.375.375 0 0 1-.57.32L16.5 20.25l-1.68.807a.375.375 0 0 1-.33 0L12 19.95l-2.49 1.107a.375.375 0 0 1-.33 0L7.5 20.25l-1.68.807a.375.375 0 0 1-.57-.32V4.5A1.5 1.5 0 0 1 6.75 3Z"
            />
        </svg>
    );
}

function IconMail({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909A2.25 2.25 0 0 1 2.25 6.993V6.75"
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
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9.75a2.25 2.25 0 0 1-1.125 1.949L12 22.5m0-9.75L3 7.5m9 5.25v9.75m0 0-7.875-4.551A2.25 2.25 0 0 1 3 16.5V7.5"
            />
        </svg>
    );
}

function IconCurrency({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-4-9h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7"
            />
        </svg>
    );
}

function IconChatBubble({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3h6m10.502-10.092a21.852 21.852 0 0 1-23.004 27.577c-.18.452-.074.974.274 1.299l3.27 3.065a1.125 1.125 0 0 0 1.203.293 59.693 59.693 0 0 1 22.087-23.086 1.125 1.125 0 0 1 1.36.086l7.052 7.049a21.849 21.849 0 0 1-36.086 12.849Z"
            />
        </svg>
    );
}

function IconChartBars({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3v-8Zm7-12h4v20h-4V1Zm7 8h4v12h-4V9Z" />
        </svg>
    );
}

function IconPhoto({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Z"
            />
        </svg>
    );
}

function IconSave({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.5V19.5A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5V9.879a1.5 1.5 0 0 0-.44-1.06l-3.379-3.379A1.5 1.5 0 0 0 16.121 5H4.5A1.5 1.5 0 0 0 3 6.5v1Zm6 13.5v-6h6v6m-6-12h6v3H9V9Z"
            />
        </svg>
    );
}

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

const fileInputClass =
    'mt-2 block w-full cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50/80 px-3 py-2 text-sm text-gray-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark';

const labelClass = 'block text-sm font-semibold text-gray-700';

export default function Index({
    settings,
    currencies = [],
    brandingUrls = {},
    notificationAnalysis = null,
    canViewReports = false,
}) {
    const { flash } = usePage().props;
    const [tab, setTab] = useState('general');

    const currencyMap = useMemo(() => {
        const m = new Map();
        (currencies ?? []).forEach((c) => m.set(c.code, c));
        return m;
    }, [currencies]);

    const { data, setData, post, processing, errors, reset } = useForm({
        app_name: settings?.app_name ?? '',
        tagline: settings?.tagline ?? '',
        currency: settings?.currency ?? 'PKR',
        currency_symbol: settings?.currency_symbol ?? '',
        business_name: settings?.business_name ?? '',
        business_phone: settings?.business_phone ?? '',
        business_email: settings?.business_email ?? '',
        business_address: settings?.business_address ?? '',
        invoice_prefix: settings?.invoice_prefix ?? '',
        invoice_footer_text: settings?.invoice_footer_text ?? '',
        low_stock_threshold: settings?.low_stock_threshold ?? 0,
        default_tax_percentage: settings?.default_tax_percentage ?? 0,
        mail_mailer: settings?.mail_mailer ?? 'log',
        mail_scheme: settings?.mail_scheme ?? '',
        mail_host: settings?.mail_host ?? '',
        mail_port: settings?.mail_port ?? '',
        mail_username: settings?.mail_username ?? '',
        mail_password: settings?.mail_password ?? '',
        mail_from_address: settings?.mail_from_address ?? '',
        mail_from_name: settings?.mail_from_name ?? '',
        twilio_account_sid: settings?.twilio_account_sid ?? '',
        twilio_auth_token: settings?.twilio_auth_token ?? '',
        twilio_whatsapp_from: settings?.twilio_whatsapp_from ?? '',
        twilio_phone_country_code: settings?.twilio_phone_country_code ?? '+92',
        logo_large: null,
        logo_small: null,
        favicon: null,
        invoice_logo: null,
        receipt_signature: null,
        remove_logo_large: false,
        remove_logo_small: false,
        remove_favicon: false,
        remove_invoice_logo: false,
        remove_receipt_signature: false,
    });

    useEffect(() => {
        if (!settings) {
            return;
        }
        reset({
            app_name: settings.app_name ?? '',
            tagline: settings.tagline ?? '',
            currency: settings.currency ?? 'PKR',
            currency_symbol: settings.currency_symbol ?? '',
            business_name: settings.business_name ?? '',
            business_phone: settings.business_phone ?? '',
            business_email: settings.business_email ?? '',
            business_address: settings.business_address ?? '',
            invoice_prefix: settings.invoice_prefix ?? '',
            invoice_footer_text: settings.invoice_footer_text ?? '',
            low_stock_threshold: settings.low_stock_threshold ?? 0,
            default_tax_percentage: settings.default_tax_percentage ?? 0,
            mail_mailer: settings.mail_mailer ?? 'log',
            mail_scheme: settings.mail_scheme ?? '',
            mail_host: settings.mail_host ?? '',
            mail_port: settings.mail_port ?? '',
            mail_username: settings.mail_username ?? '',
            mail_password: settings.mail_password ?? '',
            mail_from_address: settings.mail_from_address ?? '',
            mail_from_name: settings.mail_from_name ?? '',
            twilio_account_sid: settings.twilio_account_sid ?? '',
            twilio_auth_token: settings.twilio_auth_token ?? '',
            twilio_whatsapp_from: settings.twilio_whatsapp_from ?? '',
            twilio_phone_country_code: settings.twilio_phone_country_code ?? '+92',
            logo_large: null,
            logo_small: null,
            favicon: null,
            invoice_logo: null,
            receipt_signature: null,
            remove_logo_large: false,
            remove_logo_small: false,
            remove_favicon: false,
            remove_invoice_logo: false,
            remove_receipt_signature: false,
        });
    }, [settings, reset]);

    const active = (key) => tab === key;
    const navItem = (key, label, Icon) => (
        <button
            type="button"
            onClick={() => setTab(key)}
            className={classNames(
                'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition',
                active(key)
                    ? 'bg-brand-muted text-brand'
                    : 'text-gray-700 hover:bg-gray-50',
            )}
        >
            <Icon className={classNames('h-5 w-5', active(key) ? 'text-brand' : 'text-gray-500')} />
            <span>{label}</span>
        </button>
    );

    const onSubmit = (e) => {
        e.preventDefault();
        post(route('settings.update'));
    };

    const onCurrencyChange = (code) => {
        setData('currency', code);
        const c = currencyMap.get(code);
        if (c?.symbol && (!data.currency_symbol || data.currency_symbol === currencyMap.get(data.currency)?.symbol)) {
            setData('currency_symbol', c.symbol);
        }
    };

    const CardTitle = ({ children }) => (
        <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">{children}</h2>
        </div>
    );

    const SaveBar = () => (
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
            >
                <IconSave className="h-5 w-5" />
                Save Settings
            </button>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Settings" />

            <div className="mx-auto max-w-7xl space-y-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your system settings</p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
                    <div className="h-fit overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="p-3">
                            {navItem('general', 'General', IconGear)}
                            {navItem('brand', 'Brand', IconPhoto)}
                            {navItem('business', 'Business', IconBuilding)}
                            {navItem('invoice', 'Invoice', IconReceipt)}
                            {navItem('email', 'Email', IconMail)}
                            {navItem('whatsapp', 'WhatsApp', IconChatBubble)}
                            {navItem('notification_analysis', 'Notifications', IconChartBars)}
                            {navItem('stock', 'Stock', IconCube)}
                            {navItem('tax', 'Tax', IconCurrency)}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <form onSubmit={onSubmit}>
                            {tab === 'general' && (
                                <>
                                    <CardTitle>General Settings</CardTitle>
                                    <div className="space-y-6 p-6">
                                        <div>
                                            <label className={labelClass}>Application Name</label>
                                            <input
                                                value={data.app_name}
                                                onChange={(e) => setData('app_name', e.target.value)}
                                                className={inputClass}
                                            />
                                            {errors.app_name && (
                                                <p className="mt-1 text-sm text-red-600">{errors.app_name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={labelClass}>Tagline</label>
                                            <input
                                                value={data.tagline}
                                                onChange={(e) => setData('tagline', e.target.value)}
                                                className={inputClass}
                                            />
                                            {errors.tagline && (
                                                <p className="mt-1 text-sm text-red-600">{errors.tagline}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Currency</label>
                                                <select
                                                    value={data.currency}
                                                    onChange={(e) => onCurrencyChange(e.target.value)}
                                                    className={inputClass}
                                                >
                                                    {(currencies ?? []).map((c) => (
                                                        <option key={c.code} value={c.code}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.currency && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelClass}>Currency Symbol</label>
                                                <input
                                                    value={data.currency_symbol}
                                                    onChange={(e) => setData('currency_symbol', e.target.value)}
                                                    className={inputClass}
                                                />
                                                {errors.currency_symbol && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.currency_symbol}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <SaveBar />
                                </>
                            )}

                            {tab === 'brand' && (
                                <>
                                    <CardTitle>Brand</CardTitle>
                                    <div className="space-y-8 p-6">
                                        <p className="text-sm text-gray-600">
                                            Large logo, small logo, favicon, and invoice logo. Invoice logo appears
                                            centered at the top of sales receipts, purchase invoices, and quotation
                                            PDFs. If images don&apos;t load, run{' '}
                                            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                                                php artisan storage:link
                                            </code>{' '}
                                            once. Suggested: large ~240×64px, small ~64×64px, favicon 32×32, invoice
                                            logo ~280×80px.
                                        </p>

                                        <div className="grid gap-8 lg:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Large logo (expanded sidebar)</label>
                                                {brandingUrls?.logo_large_url && !data.remove_logo_large ? (
                                                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                        <img
                                                            src={brandingUrls.logo_large_url}
                                                            alt=""
                                                            className="max-h-16 max-w-full object-contain object-left"
                                                        />
                                                    </div>
                                                ) : null}
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                                    className={fileInputClass}
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] ?? null;
                                                        setData('logo_large', f);
                                                        setData('remove_logo_large', false);
                                                    }}
                                                />
                                                {brandingUrls?.logo_large_url ? (
                                                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.remove_logo_large}
                                                            onChange={(e) => {
                                                                setData('remove_logo_large', e.target.checked);
                                                                if (e.target.checked) {
                                                                    setData('logo_large', null);
                                                                }
                                                            }}
                                                        />
                                                        Remove current large logo
                                                    </label>
                                                ) : null}
                                                {errors.logo_large && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.logo_large}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={labelClass}>Small logo (collapsed sidebar / header)</label>
                                                {brandingUrls?.logo_small_url && !data.remove_logo_small ? (
                                                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                        <img
                                                            src={brandingUrls.logo_small_url}
                                                            alt=""
                                                            className="h-12 w-12 object-contain"
                                                        />
                                                    </div>
                                                ) : null}
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                                    className={fileInputClass}
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] ?? null;
                                                        setData('logo_small', f);
                                                        setData('remove_logo_small', false);
                                                    }}
                                                />
                                                {brandingUrls?.logo_small_url ? (
                                                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.remove_logo_small}
                                                            onChange={(e) => {
                                                                setData('remove_logo_small', e.target.checked);
                                                                if (e.target.checked) {
                                                                    setData('logo_small', null);
                                                                }
                                                            }}
                                                        />
                                                        Remove current small logo
                                                    </label>
                                                ) : null}
                                                {errors.logo_small && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.logo_small}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={labelClass}>Favicon</label>
                                                {brandingUrls?.favicon_url && !data.remove_favicon ? (
                                                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                        <img
                                                            src={brandingUrls.favicon_url}
                                                            alt=""
                                                            className="h-8 w-8 object-contain"
                                                        />
                                                        <span className="text-xs text-gray-500">Current favicon</span>
                                                    </div>
                                                ) : null}
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.ico"
                                                    className={fileInputClass}
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] ?? null;
                                                        setData('favicon', f);
                                                        setData('remove_favicon', false);
                                                    }}
                                                />
                                                {brandingUrls?.favicon_url ? (
                                                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.remove_favicon}
                                                            onChange={(e) => {
                                                                setData('remove_favicon', e.target.checked);
                                                                if (e.target.checked) {
                                                                    setData('favicon', null);
                                                                }
                                                            }}
                                                        />
                                                        Remove current favicon
                                                    </label>
                                                ) : null}
                                                {errors.favicon && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.favicon}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={labelClass}>Invoice logo</label>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Centered at the top of printable invoices and quotation PDFs. If
                                                    empty, the large logo is used.
                                                </p>
                                                {brandingUrls?.invoice_logo_url && !data.remove_invoice_logo ? (
                                                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                        <img
                                                            src={brandingUrls.invoice_logo_url}
                                                            alt=""
                                                            className="mx-auto max-h-16 max-w-full object-contain"
                                                        />
                                                    </div>
                                                ) : null}
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                                    className={fileInputClass}
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] ?? null;
                                                        setData('invoice_logo', f);
                                                        setData('remove_invoice_logo', false);
                                                    }}
                                                />
                                                {brandingUrls?.invoice_logo_url ? (
                                                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.remove_invoice_logo}
                                                            onChange={(e) => {
                                                                setData('remove_invoice_logo', e.target.checked);
                                                                if (e.target.checked) {
                                                                    setData('invoice_logo', null);
                                                                }
                                                            }}
                                                        />
                                                        Remove current invoice logo
                                                    </label>
                                                ) : null}
                                                {errors.invoice_logo && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.invoice_logo}</p>
                                                )}
                                            </div>

                                            <div className="lg:col-span-2">
                                                <label className={labelClass}>
                                                    Receipt signature (printed sales receipt)
                                                </label>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Shown at the bottom of the printable sales receipt. PNG
                                                    recommended; max ~2&nbsp;MB.
                                                </p>
                                                {brandingUrls?.receipt_signature_url &&
                                                !data.remove_receipt_signature ? (
                                                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                        <img
                                                            src={brandingUrls.receipt_signature_url}
                                                            alt=""
                                                            className="mx-auto max-h-20 max-w-[220px] object-contain object-bottom"
                                                        />
                                                    </div>
                                                ) : null}
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                                    className={fileInputClass}
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] ?? null;
                                                        setData('receipt_signature', f);
                                                        setData('remove_receipt_signature', false);
                                                    }}
                                                />
                                                {brandingUrls?.receipt_signature_url ? (
                                                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.remove_receipt_signature}
                                                            onChange={(e) => {
                                                                setData(
                                                                    'remove_receipt_signature',
                                                                    e.target.checked,
                                                                );
                                                                if (e.target.checked) {
                                                                    setData('receipt_signature', null);
                                                                }
                                                            }}
                                                        />
                                                        Remove receipt signature
                                                    </label>
                                                ) : null}
                                                {errors.receipt_signature && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.receipt_signature}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <SaveBar />
                                </>
                            )}

                            {tab === 'business' && (
                                <>
                                    <CardTitle>Business Settings</CardTitle>
                                    <div className="space-y-6 p-6">
                                        <div>
                                            <label className={labelClass}>Business Name</label>
                                            <input
                                                value={data.business_name}
                                                onChange={(e) => setData('business_name', e.target.value)}
                                                className={inputClass}
                                            />
                                            {errors.business_name && (
                                                <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Phone</label>
                                                <input
                                                    value={data.business_phone}
                                                    onChange={(e) => setData('business_phone', e.target.value)}
                                                    className={inputClass}
                                                />
                                                {errors.business_phone && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.business_phone}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email</label>
                                                <input
                                                    value={data.business_email}
                                                    onChange={(e) => setData('business_email', e.target.value)}
                                                    className={inputClass}
                                                />
                                                {errors.business_email && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.business_email}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Address</label>
                                            <textarea
                                                rows={3}
                                                value={data.business_address}
                                                onChange={(e) => setData('business_address', e.target.value)}
                                                className={inputClass}
                                            />
                                            {errors.business_address && (
                                                <p className="mt-1 text-sm text-red-600">{errors.business_address}</p>
                                            )}
                                        </div>
                                    </div>
                                    <SaveBar />
                                </>
                            )}

                            {tab === 'invoice' && (
                                <>
                                    <CardTitle>Invoice Settings</CardTitle>
                                    <div className="space-y-6 p-6">
                                        <div>
                                            <label className={labelClass}>Invoice Prefix</label>
                                            <input
                                                value={data.invoice_prefix}
                                                onChange={(e) => setData('invoice_prefix', e.target.value)}
                                                className={inputClass}
                                            />
                                            {errors.invoice_prefix && (
                                                <p className="mt-1 text-sm text-red-600">{errors.invoice_prefix}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={labelClass}>Invoice Footer Text</label>
                                            <textarea
                                                rows={4}
                                                value={data.invoice_footer_text}
                                                onChange={(e) => setData('invoice_footer_text', e.target.value)}
                                                className={inputClass}
                                            />
                                            {errors.invoice_footer_text && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.invoice_footer_text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <SaveBar />
                                </>
                            )}

                            {tab === 'email' && (
                                <>
                                    <CardTitle>Email Settings</CardTitle>
                                    <div className="space-y-6 p-6">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Mailer</label>
                                                <select
                                                    value={data.mail_mailer}
                                                    onChange={(e) =>
                                                        setData('mail_mailer', e.target.value)
                                                    }
                                                    className={inputClass}
                                                >
                                                    <option value="smtp">SMTP</option>
                                                    <option value="log">Log (development)</option>
                                                    <option value="sendmail">Sendmail</option>
                                                </select>
                                                {errors.mail_mailer && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.mail_mailer}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelClass}>Scheme</label>
                                                <input
                                                    value={data.mail_scheme}
                                                    onChange={(e) =>
                                                        setData('mail_scheme', e.target.value)
                                                    }
                                                    className={inputClass}
                                                    placeholder="tls / ssl (optional)"
                                                />
                                                {errors.mail_scheme && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.mail_scheme}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Host</label>
                                                <input
                                                    value={data.mail_host}
                                                    onChange={(e) =>
                                                        setData('mail_host', e.target.value)
                                                    }
                                                    className={inputClass}
                                                    placeholder="smtp.example.com"
                                                />
                                                {errors.mail_host && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.mail_host}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelClass}>Port</label>
                                                <input
                                                    type="number"
                                                    value={data.mail_port}
                                                    onChange={(e) =>
                                                        setData('mail_port', e.target.value)
                                                    }
                                                    className={inputClass}
                                                    placeholder="587"
                                                />
                                                {errors.mail_port && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.mail_port}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Username</label>
                                                <input
                                                    value={data.mail_username}
                                                    onChange={(e) =>
                                                        setData('mail_username', e.target.value)
                                                    }
                                                    className={inputClass}
                                                    placeholder="(optional)"
                                                />
                                                {errors.mail_username && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.mail_username}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelClass}>Password</label>
                                                <input
                                                    type="password"
                                                    value={data.mail_password}
                                                    onChange={(e) =>
                                                        setData('mail_password', e.target.value)
                                                    }
                                                    className={inputClass}
                                                    placeholder="(optional)"
                                                />
                                                {errors.mail_password && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.mail_password}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>From Address</label>
                                                <input
                                                    value={data.mail_from_address}
                                                    onChange={(e) =>
                                                        setData(
                                                            'mail_from_address',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={inputClass}
                                                    placeholder="no-reply@yourdomain.com"
                                                />
                                                {errors.mail_from_address && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.mail_from_address}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelClass}>From Name</label>
                                                <input
                                                    value={data.mail_from_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'mail_from_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={inputClass}
                                                    placeholder="Company name"
                                                />
                                                {errors.mail_from_name && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.mail_from_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <SaveBar />
                                </>
                            )}

                            {tab === 'whatsapp' && (
                                <>
                                    <CardTitle>WhatsApp (Twilio)</CardTitle>
                                    <div className="space-y-6 p-6">
                                        <p className="text-sm text-gray-600">
                                            Used when a purchase order is marked <strong>Sent to supplier</strong>: the
                                            system can send WhatsApp to the supplier number on file using Twilio. Values
                                            are saved in the database and written to{' '}
                                            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">.env</code> so{' '}
                                            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                                                config/services.php
                                            </code>{' '}
                                            picks them up after save (config cache is cleared).
                                        </p>
                                        <div>
                                            <label className={labelClass}>Account SID</label>
                                            <input
                                                value={data.twilio_account_sid}
                                                onChange={(e) =>
                                                    setData('twilio_account_sid', e.target.value)
                                                }
                                                className={inputClass}
                                                placeholder="ACxxxxxxxx…"
                                                autoComplete="off"
                                            />
                                            {errors.twilio_account_sid && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.twilio_account_sid}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClass}>Auth token</label>
                                            <input
                                                type="password"
                                                value={data.twilio_auth_token}
                                                onChange={(e) =>
                                                    setData('twilio_auth_token', e.target.value)
                                                }
                                                className={inputClass}
                                                placeholder="(your Twilio auth token)"
                                                autoComplete="off"
                                            />
                                            {errors.twilio_auth_token && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.twilio_auth_token}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClass}>WhatsApp From</label>
                                            <input
                                                value={data.twilio_whatsapp_from}
                                                onChange={(e) =>
                                                    setData('twilio_whatsapp_from', e.target.value)
                                                }
                                                className={inputClass}
                                                placeholder='e.g. whatsapp:+14155238886'
                                            />
                                            <p className="mt-2 text-xs text-gray-500">
                                                Twilio sender in E.164, usually prefixed with{' '}
                                                <code className="rounded bg-gray-100 px-0.5">whatsapp:</code>.
                                            </p>
                                            {errors.twilio_whatsapp_from && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.twilio_whatsapp_from}
                                                </p>
                                            )}
                                        </div>
                                        <div className="max-w-xs">
                                            <label className={labelClass}>Default phone country code (E.164)</label>
                                            <input
                                                value={data.twilio_phone_country_code}
                                                autoComplete="off"
                                                inputMode="tel"
                                                onChange={(e) => {
                                                    let next = '';
                                                    const t = e.target.value;
                                                    for (let i = 0; i < t.length; i += 1) {
                                                        const ch = t[i];
                                                        if (ch === '+' && next === '') {
                                                            next += '+';
                                                        } else if (/\d/.test(ch) && next.replace(/\D/g, '').length < 9) {
                                                            next += ch;
                                                        }
                                                    }
                                                    setData('twilio_phone_country_code', next);
                                                }}
                                                className={inputClass}
                                                placeholder="+92"
                                            />
                                            <p className="mt-2 text-xs text-gray-500">
                                                Save writes <code className="rounded bg-gray-100 px-0.5">TWILIO_PHONE_COUNTRY_CODE</code> to{' '}
                                                <code className="rounded bg-gray-100 px-0.5">.env</code>. Use{' '}
                                                <code className="rounded bg-gray-100 px-0.5">+92</code> for Pakistan — leading + is
                                                optional in logic; normalization strips to digits internally.
                                            </p>
                                            {errors.twilio_phone_country_code && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.twilio_phone_country_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <SaveBar />
                                </>
                            )}

                            {tab === 'notification_analysis' && (
                                <>
                                    <CardTitle>Notifications &amp; analysis</CardTitle>
                                    <div className="space-y-8 p-6">
                                        <p className="text-sm text-gray-600">
                                            Summary for purchase-order supplier notifications (email + WhatsApp) each
                                            time an order is marked sent. Recent rows show the outcome saved on each
                                            order.
                                        </p>

                                        {!notificationAnalysis ? (
                                            <p className="text-sm text-gray-500">
                                                Unable to load analysis data.
                                            </p>
                                        ) : (
                                            <>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span
                                                        className={classNames(
                                                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                                                            notificationAnalysis.whatsapp_ready
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-amber-100 text-amber-900',
                                                        )}
                                                    >
                                                        WhatsApp (Twilio):{' '}
                                                        {notificationAnalysis.whatsapp_ready
                                                            ? 'Ready'
                                                            : 'Not configured'}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        Total log entries:{' '}
                                                        <strong>{notificationAnalysis.log_total}</strong>
                                                    </span>
                                                </div>

                                                <div className="grid gap-6 lg:grid-cols-2">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900">
                                                            WhatsApp by status
                                                        </h3>
                                                        <ul className="mt-3 space-y-2 text-sm text-gray-700">
                                                            {Object.keys(
                                                                notificationAnalysis.whatsapp_by_status ?? {},
                                                            ).length === 0 ? (
                                                                <li className="text-gray-500">No rows yet.</li>
                                                            ) : (
                                                                Object.entries(
                                                                    notificationAnalysis.whatsapp_by_status,
                                                                ).map(([status, cnt]) => (
                                                                    <li
                                                                        key={`wa-${status}`}
                                                                        className="flex justify-between gap-4 border-b border-gray-100 pb-2"
                                                                    >
                                                                        <span className="font-mono text-xs">
                                                                            {status}
                                                                        </span>
                                                                        <span className="tabular-nums font-semibold">
                                                                            {cnt}
                                                                        </span>
                                                                    </li>
                                                                ))
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900">
                                                            Email by status
                                                        </h3>
                                                        <ul className="mt-3 space-y-2 text-sm text-gray-700">
                                                            {Object.keys(
                                                                notificationAnalysis.email_by_status ?? {},
                                                            ).length === 0 ? (
                                                                <li className="text-gray-500">No rows yet.</li>
                                                            ) : (
                                                                Object.entries(
                                                                    notificationAnalysis.email_by_status,
                                                                ).map(([status, cnt]) => (
                                                                    <li
                                                                        key={`em-${status}`}
                                                                        className="flex justify-between gap-4 border-b border-gray-100 pb-2"
                                                                    >
                                                                        <span className="font-mono text-xs">
                                                                            {status}
                                                                        </span>
                                                                        <span className="tabular-nums font-semibold">
                                                                            {cnt}
                                                                        </span>
                                                                    </li>
                                                                ))
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>

                                                {canViewReports && (
                                                    <Link
                                                        href={route('reports.show', {
                                                            type: 'purchase-order-notifications',
                                                        })}
                                                        className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                                                    >
                                                        Open PO notifications report →
                                                    </Link>
                                                )}

                                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-900">
                                                                    When
                                                                </th>
                                                                <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-900">
                                                                    Order
                                                                </th>
                                                                <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-900">
                                                                    Email
                                                                </th>
                                                                <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-900">
                                                                    WhatsApp
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 bg-white">
                                                            {(notificationAnalysis.recent ?? []).length === 0 ? (
                                                                <tr>
                                                                    <td
                                                                        colSpan={4}
                                                                        className="px-4 py-6 text-center text-gray-500"
                                                                    >
                                                                        No notification logs yet.
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                notificationAnalysis.recent.map((row) => (
                                                                    <tr key={row.id}>
                                                                        <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                                                                            {row.created_at
                                                                                ? new Date(
                                                                                      row.created_at,
                                                                                  ).toLocaleString()
                                                                                : ''}
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            <Link
                                                                                href={route(
                                                                                    'purchase-orders.show',
                                                                                    row.purchase_order_id,
                                                                                )}
                                                                                className="font-medium text-brand hover:underline"
                                                                            >
                                                                                {row.order_number ?? `#${row.purchase_order_id}`}
                                                                            </Link>
                                                                        </td>
                                                                        <td className="max-w-[200px] px-4 py-2">
                                                                            <div className="font-mono text-xs text-gray-800">
                                                                                {row.email_status}
                                                                            </div>
                                                                            <div className="mt-1 break-all text-xs text-gray-500">
                                                                                {row.email_detail || '—'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="max-w-[200px] px-4 py-2">
                                                                            <div className="font-mono text-xs text-gray-800">
                                                                                {row.whatsapp_status}
                                                                            </div>
                                                                            <div className="mt-1 break-all text-xs text-gray-500">
                                                                                {row.whatsapp_detail || '—'}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {tab === 'stock' && (
                                <>
                                    <CardTitle>Stock Settings</CardTitle>
                                    <div className="space-y-6 p-6">
                                        <div>
                                            <label className={labelClass}>Low Stock Threshold (Default)</label>
                                            <input
                                                type="number"
                                                value={data.low_stock_threshold}
                                                onChange={(e) =>
                                                    setData('low_stock_threshold', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                            <p className="mt-2 text-sm text-gray-500">
                                                Products with stock quantity below this threshold will show low stock
                                                alerts.
                                            </p>
                                            {errors.low_stock_threshold && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.low_stock_threshold}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <SaveBar />
                                </>
                            )}

                            {tab === 'tax' && (
                                <>
                                    <CardTitle>Tax Settings</CardTitle>
                                    <div className="space-y-6 p-6">
                                        <div>
                                            <label className={labelClass}>Default Tax Percentage (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.default_tax_percentage}
                                                onChange={(e) =>
                                                    setData('default_tax_percentage', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                            <p className="mt-2 text-sm text-gray-500">
                                                This percentage selects the default catalog tax for new products and
                                                CSV imports when it matches an active percentage tax. Sales use each
                                                product&apos;s assigned tax. Add or adjust a tax under Catalog →
                                                Taxes with the same rate so linking works.
                                            </p>
                                            {errors.default_tax_percentage && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.default_tax_percentage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <SaveBar />
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

