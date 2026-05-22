import Checkbox from '@/Components/Checkbox';
import InputLabel from '@/Components/InputLabel';

function groupByPrefix(names) {
    const groups = {};
    names.forEach((name) => {
        const key = String(name).includes('.')
            ? String(name).split('.')[0]
            : 'other';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(name);
    });
    const orderedKeys = Object.keys(groups).sort((a, b) =>
        a.localeCompare(b),
    );
    return orderedKeys.map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        items: groups[key].sort((a, b) => a.localeCompare(b)),
    }));
}

export default function PermissionPicker({
    permissions,
    selected,
    onToggle,
    error,
}) {
    const groups = groupByPrefix(permissions);

    return (
        <div>
            <InputLabel value="Permissions" />
            <p className="mt-1 text-xs text-gray-500">
                Select which actions this role can perform.
            </p>
            {error && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}
            <div className="mt-3 max-h-[28rem] space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                {groups.map((group) => (
                    <div key={group.key}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {group.label}
                        </p>
                        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {group.items.map((name) => (
                                <li key={name}>
                                    <label className="flex cursor-pointer items-start gap-2 rounded-md bg-white px-2 py-1.5 text-sm text-gray-800 shadow-sm ring-1 ring-gray-100 hover:ring-gray-200">
                                        <Checkbox
                                            className="mt-0.5 text-brand focus:ring-brand"
                                            checked={selected.includes(name)}
                                            onChange={() => onToggle(name)}
                                        />
                                        <span className="break-all leading-snug">
                                            {name}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
