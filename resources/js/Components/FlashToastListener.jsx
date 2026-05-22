import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Shows Laravel session flash messages (shared as props.flash via HandleInertiaRequests)
 * after create/update/delete redirects and similar flows.
 */
export default function FlashToastListener() {
    const page = usePage();
    const flash = page.props.flash;

    useEffect(() => {
        const success =
            flash?.success != null && flash.success !== ''
                ? String(flash.success)
                : null;
        const error =
            flash?.error != null && flash.error !== ''
                ? String(flash.error)
                : null;

        if (success) {
            toast.success(success, { id: `success:${success}:${page.url}` });
        }
        if (error) {
            toast.error(error, { id: `error:${error}:${page.url}` });
        }
    }, [
        flash?.success,
        flash?.error,
        page.url,
    ]);

    return null;
}
