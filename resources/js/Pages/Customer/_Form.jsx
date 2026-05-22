import { Link } from '@inertiajs/react';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

const GROUP_OPTIONS = [
    { value: 'regular', label: 'Regular' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
    { value: 'platinum', label: 'Platinum' },
];

export default function CustomerForm({ data, setData, errors, onSubmit, processing, submitLabel, cancelHref }) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2">
                    <label className={labelClass}>Name *</label>
                    <input
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                    <label className={labelClass}>Code *</label>
                    <input
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. CUST-003"
                    />
                    {errors?.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                </div>
                <div>
                    <label className={labelClass}>Customer group *</label>
                    <select
                        value={data.customer_group}
                        onChange={(e) => setData('customer_group', e.target.value)}
                        className={inputClass}
                    >
                        {GROUP_OPTIONS.map((g) => (
                            <option key={g.value} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                    {errors?.customer_group && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_group}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Status *</label>
                    <select
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className={inputClass}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    {errors?.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                </div>
                <div>
                    <label className={labelClass}>Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                    <label className={labelClass}>Phone</label>
                    <input
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div>
                    <label className={labelClass}>Tax number</label>
                    <input
                        value={data.tax_number}
                        onChange={(e) => setData('tax_number', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.tax_number && <p className="mt-1 text-sm text-red-600">{errors.tax_number}</p>}
                </div>
            </div>

            <div>
                <label className={labelClass}>Address</label>
                <textarea
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    rows={2}
                    className={inputClass}
                />
                {errors?.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label className={labelClass}>City</label>
                    <input
                        value={data.city}
                        onChange={(e) => setData('city', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
                <div>
                    <label className={labelClass}>State</label>
                    <input
                        value={data.state}
                        onChange={(e) => setData('state', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                </div>
                <div>
                    <label className={labelClass}>Country</label>
                    <input
                        value={data.country}
                        onChange={(e) => setData('country', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                </div>
                <div>
                    <label className={labelClass}>Postal code</label>
                    <input
                        value={data.postal_code}
                        onChange={(e) => setData('postal_code', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div>
                    <label className={labelClass}>Opening balance</label>
                    <input
                        type="number"
                        step="0.01"
                        value={data.opening_balance}
                        onChange={(e) => setData('opening_balance', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.opening_balance && (
                        <p className="mt-1 text-sm text-red-600">{errors.opening_balance}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Loyalty points</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.loyalty_points}
                        onChange={(e) => setData('loyalty_points', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.loyalty_points && (
                        <p className="mt-1 text-sm text-red-600">{errors.loyalty_points}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Credit limit</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.credit_limit}
                        onChange={(e) => setData('credit_limit', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.credit_limit && <p className="mt-1 text-sm text-red-600">{errors.credit_limit}</p>}
                </div>
            </div>

            <div>
                <label className={labelClass}>Notes</label>
                <textarea
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    rows={3}
                    className={inputClass}
                />
                {errors?.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
                <Link
                    href={cancelHref}
                    className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
