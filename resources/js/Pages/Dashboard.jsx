import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const PERIODS = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
];

const EMPTY_PERIODS = {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
};

/** Matches primary UI / tailwind `brand.DEFAULT` (sky-900). */
const CHART_BRAND_STROKE = '#0c4a6e';

function formatYAxis(n) {
    if (n === 0) return '0';
    const abs = Math.abs(n);
    if (abs >= 1000) {
        const k = n / 1000;
        const s = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
        return `${s}K`;
    }
    return n % 1 === 0 ? String(n) : n.toFixed(0);
}

function EmployeeAvatar({ name, photoUrl }) {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-100"
            />
        );
    }

    return (
        <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 ring-1 ring-gray-100"
            aria-hidden
        >
            {initials || '?'}
        </div>
    );
}

function employeeStatusBadgeClass(status) {
    if (status === 'active') {
        return 'bg-green-100 text-green-800';
    }
    if (status === 'inactive') {
        return 'bg-gray-100 text-gray-700';
    }
    return 'bg-red-100 text-red-800';
}

function formatEmployeeStatus(status) {
    if (!status) return '—';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

const MONTH_OPTIONS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

const selectFieldClass =
    'h-10 min-w-[7.5rem] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

function formatDashboardDate(iso) {
    if (!iso) return '—';
    const raw = String(iso).split('T')[0];
    const p = raw.split('-');
    if (p.length !== 3) return raw;
    return `${p[2]}-${p[1]}-${p[0]}`;
}

function dashMoney(n) {
    return Number(n).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

function attendanceStatusTextClass(status) {
    switch (status) {
        case 'present':
            return 'font-medium text-green-600';
        case 'absent':
            return 'font-medium text-red-600';
        case 'late':
            return 'font-medium text-amber-600';
        case 'leave':
            return 'font-medium text-gray-600';
        default:
            return 'font-medium text-gray-700';
    }
}

function attendanceStatusLabel(status) {
    if (!status) return '—';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function payrollStatusTextClass(status) {
    if (status === 'paid') return 'font-medium text-green-600';
    if (status === 'processed') return 'font-medium text-amber-600';
    return 'font-medium text-red-600';
}

function payrollStatusLabel(status) {
    if (!status) return '—';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function StatCard({ title, value, delta }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                {value}
            </p>
            {delta && (
                <p className="mt-1 text-xs font-medium text-brand">{delta}</p>
            )}
        </div>
    );
}

function TrendChartCard({ heading, dataByPeriod, stroke, gradientId }) {
    const [period, setPeriod] = useState('daily');
    const [chartKind, setChartKind] = useState('area');

    const data = dataByPeriod[period] ?? [];
    const periodTitle =
        period === 'daily'
            ? 'Daily'
            : period === 'weekly'
              ? 'Weekly'
              : period === 'monthly'
                ? 'Monthly'
                : 'Yearly';

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-6 border-b border-gray-100">
                        {PERIODS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setPeriod(p.id)}
                                className={`-mb-px pb-2 text-sm font-medium transition-colors ${
                                    period === p.id
                                        ? 'border-b-2 border-brand text-brand'
                                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <h3 className="mt-4 text-base font-bold text-gray-900">
                        {heading} ({periodTitle})
                    </h3>
                </div>
                <div className="relative shrink-0">
                    <label htmlFor={`chart-kind-${gradientId}`} className="sr-only">
                        Chart type
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden
                            >
                                <path d="M3 17v4h4M21 17v4h-4M7 14l3-3 4 4 4-7" />
                            </svg>
                        </span>
                        <select
                            id={`chart-kind-${gradientId}`}
                            value={chartKind}
                            onChange={(e) => setChartKind(e.target.value)}
                            className="h-10 cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        >
                            <option value="area">Area chart</option>
                            <option value="line">Line chart</option>
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            ▾
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 h-[320px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    {chartKind === 'area' ? (
                        <AreaChart
                            data={data}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id={gradientId}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={stroke}
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={stroke}
                                        stopOpacity={0.02}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e7eb"
                            />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                interval="preserveStartEnd"
                                minTickGap={28}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                tickFormatter={formatYAxis}
                                width={48}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '13px',
                                }}
                                formatter={(v) => [
                                    typeof v === 'number'
                                        ? v.toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                          })
                                        : v,
                                    heading,
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={stroke}
                                strokeWidth={2}
                                fill={`url(#${gradientId})`}
                                dot={{
                                    r: 4,
                                    fill: '#fff',
                                    stroke,
                                    strokeWidth: 2,
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke,
                                    strokeWidth: 2,
                                    fill: '#fff',
                                }}
                            />
                        </AreaChart>
                    ) : (
                        <LineChart
                            data={data}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e7eb"
                            />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                interval="preserveStartEnd"
                                minTickGap={28}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                tickFormatter={formatYAxis}
                                width={48}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '13px',
                                }}
                                formatter={(v) => [
                                    typeof v === 'number'
                                        ? v.toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                          })
                                        : v,
                                    heading,
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={stroke}
                                strokeWidth={2}
                                dot={{
                                    r: 4,
                                    fill: '#fff',
                                    stroke,
                                    strokeWidth: 2,
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke,
                                    strokeWidth: 2,
                                    fill: '#fff',
                                }}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default function Dashboard({
    todaySalesCount = 0,
    todaySalesDeltaLabel,
    todaySalesAmount = 0,
    todaySalesAmountDeltaLabel,
    todayPurchasesCount = 0,
    todayPurchasesDeltaLabel,
    todayNetProfit = 0,
    todayNetProfitDeltaLabel,
    charts,
    employeesPreview = [],
    dashboardFilters = {
        att_date: '',
        att_branch: '',
        pay_month: 1,
        pay_year: new Date().getFullYear(),
    },
    filterBranches = [],
    attendancePreview = [],
    payrollPreview = [],
    payrollYearOptions = [],
    lowStockLineCount = 0,
    stocksIndexFilters = {},
}) {
    const salesSeries = charts?.sales ?? EMPTY_PERIODS;
    const purchaseSeries = charts?.purchases ?? EMPTY_PERIODS;

    const [attStatusFilter, setAttStatusFilter] = useState('all');
    const [payMonthDraft, setPayMonthDraft] = useState(dashboardFilters.pay_month);
    const [payYearDraft, setPayYearDraft] = useState(dashboardFilters.pay_year);

    useEffect(() => {
        setPayMonthDraft(dashboardFilters.pay_month);
        setPayYearDraft(dashboardFilters.pay_year);
    }, [dashboardFilters.pay_month, dashboardFilters.pay_year]);

    const filteredAttendance = useMemo(() => {
        if (attStatusFilter === 'all') {
            return attendancePreview;
        }
        return attendancePreview.filter((r) => r.status === attStatusFilter);
    }, [attendancePreview, attStatusFilter]);

    const reloadDashboard = (patch) => {
        router.get(
            route('dashboard'),
            {
                att_date: patch.att_date ?? dashboardFilters.att_date,
                att_branch: patch.att_branch ?? dashboardFilters.att_branch,
                pay_month: patch.pay_month ?? dashboardFilters.pay_month,
                pay_year: patch.pay_year ?? dashboardFilters.pay_year,
            },
            { preserveScroll: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 sm:text-base">
                        Welcome to your POS dashboard
                    </p>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Today's Sales"
                        value={Number(todaySalesCount).toLocaleString()}
                        delta={todaySalesDeltaLabel}
                    />
                    <StatCard
                        title="Today's Purchases"
                        value={Number(todayPurchasesCount).toLocaleString()}
                        delta={todayPurchasesDeltaLabel}
                    />
                    <StatCard
                        title="Today's Sales Amount"
                        value={Number(todaySalesAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                        delta={todaySalesAmountDeltaLabel}
                    />
                    <StatCard
                        title="Today's Net Profit"
                        value={Number(todayNetProfit).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                        delta={todayNetProfitDeltaLabel}
                    />
                </div>

                <div
                    className={
                        'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ' +
                        (lowStockLineCount > 0
                            ? 'border-amber-200 bg-amber-50/90'
                            : 'border-gray-100 bg-white')
                    }
                >
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            Low stock (warehouse rows)
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600">
                            {lowStockLineCount > 0 ? (
                                <>
                                    <span className="font-semibold text-amber-900">
                                        {Number(lowStockLineCount).toLocaleString()}
                                    </span>{' '}
                                    active stock row
                                    {lowStockLineCount === 1 ? '' : 's'} at or below the alert
                                    level (per product or default from Settings → Stock).
                                </>
                            ) : (
                                <>
                                    No active stock rows are at or below the alert level for this
                                    branch scope.
                                </>
                            )}
                        </p>
                    </div>
                    <Link
                        href={route('stocks.index', stocksIndexFilters)}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                    >
                        View stock
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <TrendChartCard
                        heading="Total Sales"
                        dataByPeriod={salesSeries}
                        stroke={CHART_BRAND_STROKE}
                        gradientId="dashTotalSalesFill"
                    />
                    <TrendChartCard
                        heading="Total Purchase"
                        dataByPeriod={purchaseSeries}
                        stroke={CHART_BRAND_STROKE}
                        gradientId="dashTotalPurchaseFill"
                    />
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-bold text-slate-900">
                            Employees
                        </h2>
                        <Link
                            href={route('employees.create')}
                            className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        >
                            + Add Employee
                        </Link>
                    </div>
                    <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 font-semibold text-gray-700"
                                    >
                                        #
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-center font-semibold text-gray-700"
                                    >
                                        Photo
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 font-semibold text-gray-700"
                                    >
                                        Name
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 font-semibold text-gray-700"
                                    >
                                        Employee Code
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 font-semibold text-gray-700"
                                    >
                                        Branch
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 font-semibold text-gray-700"
                                    >
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {employeesPreview.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            No employees yet. Add one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    employeesPreview.map((row, idx) => (
                                        <tr
                                            key={row.employee_key}
                                            className="hover:bg-gray-50/80"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center">
                                                    <EmployeeAvatar
                                                        name={row.name}
                                                        photoUrl={row.photo_url}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {row.name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                {row.employee_key}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {row.branch_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${employeeStatusBadgeClass(row.status)}`}
                                                >
                                                    {formatEmployeeStatus(row.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900">
                            Attendance
                        </h2>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-gray-500">
                                    Date
                                </span>
                                <input
                                    type="date"
                                    value={dashboardFilters.att_date}
                                    onChange={(e) =>
                                        reloadDashboard({
                                            att_date: e.target.value,
                                        })
                                    }
                                    className={`${selectFieldClass} min-w-[10rem] font-medium`}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-gray-500">
                                    Branch
                                </span>
                                <select
                                    value={dashboardFilters.att_branch}
                                    onChange={(e) =>
                                        reloadDashboard({
                                            att_branch: e.target.value,
                                        })
                                    }
                                    className={selectFieldClass}
                                >
                                    <option value="">Branch</option>
                                    {filterBranches.map((b) => (
                                        <option key={b.id} value={String(b.id)}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-gray-500">
                                    Status
                                </span>
                                <select
                                    value={attStatusFilter}
                                    onChange={(e) =>
                                        setAttStatusFilter(e.target.value)
                                    }
                                    className={selectFieldClass}
                                >
                                    <option value="all">Status</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                    <option value="leave">Leave</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            #
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Employee
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Check In
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Check Out
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredAttendance.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                No attendance rows for this
                                                filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAttendance.map((row, idx) => (
                                            <tr
                                                key={`${row.employee_name}-${row.date}-${idx}`}
                                                className="hover:bg-gray-50/80"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {row.employee_name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                    {formatDashboardDate(
                                                        row.date,
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                    {row.check_in ?? '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                    {row.check_out ?? '—'}
                                                </td>
                                                <td
                                                    className={`px-4 py-3 ${attendanceStatusTextClass(row.status)}`}
                                                >
                                                    {attendanceStatusLabel(
                                                        row.status,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900">
                            Payroll
                        </h2>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-gray-500">
                                        Month
                                    </span>
                                    <select
                                        value={String(payMonthDraft)}
                                        onChange={(e) =>
                                            setPayMonthDraft(
                                                Number(e.target.value),
                                            )
                                        }
                                        className={selectFieldClass}
                                    >
                                        {MONTH_OPTIONS.map((m) => (
                                            <option
                                                key={m.value}
                                                value={String(m.value)}
                                            >
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-gray-500">
                                        Year
                                    </span>
                                    <select
                                        value={String(payYearDraft)}
                                        onChange={(e) =>
                                            setPayYearDraft(
                                                Number(e.target.value),
                                            )
                                        }
                                        className={selectFieldClass}
                                    >
                                        {payrollYearOptions.map((y) => (
                                            <option key={y} value={String(y)}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    reloadDashboard({
                                        pay_month: payMonthDraft,
                                        pay_year: payYearDraft,
                                    })
                                }
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                            >
                                Calculate
                            </button>
                        </div>
                        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Employee
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Basic Salary
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Allowances
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Deductions
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Net Salary
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {payrollPreview.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                No payroll records for this
                                                period.
                                            </td>
                                        </tr>
                                    ) : (
                                        payrollPreview.map((row, pIdx) => (
                                            <tr
                                                key={`payroll-${pIdx}-${row.employee_name}`}
                                                className="hover:bg-gray-50/80"
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {row.employee_name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                    {dashMoney(
                                                        row.basic_salary,
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                    {dashMoney(row.allowances)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                    {dashMoney(row.deductions)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                    {dashMoney(row.net_salary)}
                                                </td>
                                                <td
                                                    className={`px-4 py-3 ${payrollStatusTextClass(row.status)}`}
                                                >
                                                    {payrollStatusLabel(
                                                        row.status,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
