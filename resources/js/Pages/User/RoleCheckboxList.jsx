import Checkbox from '@/Components/Checkbox';
import InputLabel from '@/Components/InputLabel';

function roleFieldMessage(errors) {
    if (!errors || typeof errors !== 'object') {
        return undefined;
    }
    if (errors.roles) {
        return errors.roles;
    }
    const key = Object.keys(errors).find((k) => k.startsWith('roles.'));
    return key ? errors[key] : undefined;
}

export default function RoleCheckboxList({
    roles,
    selected,
    onToggle,
    errors,
}) {
    const roleError = roleFieldMessage(errors);

    return (
        <div>
            <InputLabel value="Roles" />
            <p className="mt-1 text-xs text-gray-500">
                At least one role is required.
            </p>
            {roleError && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                    {roleError}
                </p>
            )}
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                    <li key={role.name}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition hover:border-brand/30 hover:bg-brand-muted/40">
                            <Checkbox
                                className="text-brand focus:ring-brand"
                                checked={selected.includes(role.name)}
                                onChange={() => onToggle(role.name)}
                            />
                            <span className="font-medium">{role.name}</span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}
