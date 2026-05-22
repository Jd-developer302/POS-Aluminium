import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { useCallback, useEffect, useRef, useState } from 'react';

const acceptMime =
    'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp';

function isImageFile(file) {
    return (
        file &&
        (file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(file.name))
    );
}

function IconPhotoUpload({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.25}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
        </svg>
    );
}

export default function BranchLogoDropzone({
    id = 'logo',
    label = 'Logo',
    error,
    file,
    existingUrl,
    onFileChange,
    disabled,
    className = '',
}) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (file instanceof File) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreview(null);
    }, [file]);

    const applyFiles = useCallback(
        (list) => {
            const first = list?.[0];
            if (first && isImageFile(first)) {
                onFileChange(first);
            }
        },
        [onFileChange],
    );

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) {
            return;
        }
        applyFiles(e.dataTransfer?.files);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        if (!disabled) {
            setDragOver(true);
        }
    };

    const onDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(false);
        }
    };

    const showPreview = preview || (existingUrl && !file);

    const zoneBase =
        'group relative mt-1 flex w-full min-h-[9.5rem] flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dotted px-3 py-4 text-center outline-none transition-[border-color,background-color,box-shadow,color] duration-200 sm:min-h-0';

    const zoneIdle =
        'border-gray-300 bg-gradient-to-b from-gray-50/90 to-white text-gray-600 shadow-sm hover:border-gray-400/90 hover:from-gray-50 hover:to-gray-50/80 hover:shadow';

    const zoneActive =
        'border-brand bg-brand-muted/35 text-brand shadow-inner shadow-brand/10 ring-2 ring-inset ring-brand/25';

    return (
        <div className={`flex h-full min-h-0 w-full min-w-0 flex-col ${className}`.trim()}>
            <div className="flex shrink-0 items-center justify-between gap-2">
                <InputLabel htmlFor={id} value={label} />
                <span className="hidden shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:inline">
                    Optional
                </span>
            </div>
            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={acceptMime}
                className="sr-only"
                disabled={disabled}
                onChange={(e) => {
                    applyFiles(e.target.files);
                    e.target.value = '';
                }}
            />
            <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`${zoneBase} ${dragOver ? zoneActive : zoneIdle} ${
                    disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
                } focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/35`}
            >
                {showPreview ? (
                    <div className="flex max-h-full min-h-0 w-full flex-col items-center justify-center gap-1.5 overflow-hidden px-1">
                        <div className="relative shrink-0">
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow ring-1 ring-white">
                                ✓
                            </span>
                            <img
                                src={preview || existingUrl}
                                alt=""
                                className="h-16 w-16 rounded-lg border border-gray-200/80 bg-white object-contain shadow-sm sm:h-20 sm:w-20"
                            />
                        </div>
                        <div className="max-w-full shrink-0 space-y-0.5 text-center">
                            <p className="line-clamp-1 text-xs font-medium text-gray-900 sm:text-sm">
                                {file ? file.name : 'Current logo'}
                            </p>
                            <p className="line-clamp-1 text-[11px] text-gray-500 sm:text-xs">
                                {file
                                    ? 'Save the form to upload'
                                    : 'Drop or click to replace'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex max-h-full min-h-0 w-full flex-col items-center justify-center gap-2 overflow-hidden px-1">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-dotted border-gray-300 bg-white text-gray-400 shadow-inner transition group-hover:border-brand/40 group-hover:text-brand/80 sm:h-14 sm:w-14">
                            <IconPhotoUpload className="h-7 w-7 sm:h-8 sm:w-8" />
                        </span>
                        <div className="min-h-0 shrink-0 space-y-0.5">
                            <p className="text-sm font-semibold text-gray-800">
                                Drop image here
                            </p>
                            <p className="text-xs leading-snug text-gray-500">
                                or{' '}
                                <span className="font-medium text-brand underline decoration-brand/30 underline-offset-2">
                                    browse
                                </span>
                                <span className="mt-0.5 block text-[10px] text-gray-400 sm:text-[11px]">
                                    JPEG, PNG, GIF, WebP · max 2&nbsp;MB
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </button>
            <div className="mt-2 shrink-0 space-y-2">
                <div className="flex min-h-8 items-center">
                    {file && !disabled ? (
                        <button
                            type="button"
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileChange(null);
                            }}
                        >
                            Remove file
                        </button>
                    ) : null}
                </div>
                <InputError message={error} />
            </div>
        </div>
    );
}
