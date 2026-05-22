import { Toaster } from 'react-hot-toast';

/**
 * Single global toast host (mount once beside the Inertia tree in app.jsx).
 */
export default function AppToaster() {
    return (
        <Toaster
            position="top-right"
            gutter={12}
            containerClassName="!z-[100]"
            toastOptions={{
                duration: 4000,
                className: '!text-sm !shadow-lg',
                style: {
                    borderRadius: '0.5rem',
                },
                success: {
                    iconTheme: {
                        primary: '#0c4a6e',
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}
