export default function AuthenticatedFooter() {
    return (
        <footer className="mt-auto border-t border-gray-200 bg-white px-4 py-4 text-xs text-gray-500 sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
                <p>
                    © {new Date().getFullYear()}, CopyRight By{' '}
                    <span className="text-brand" aria-hidden="true">
                        ♥
                    </span>{' '}
                    TechLape
                </p>
            </div>
        </footer>
    );
}
