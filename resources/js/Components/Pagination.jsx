import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
                {links.map((link, index) => (
                    <div key={index}>
                        {link.url === null ? (
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 cursor-default leading-5 rounded-md">
                                {link.label}
                            </span>
                        ) : (
                            <Link
                                href={link.url}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 leading-5 rounded-md hover:text-gray-500 focus:outline-none focus:ring ring-gray-300 active:bg-light-gray active:text-gray-700 transition ease-in-out duration-150"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {links.map((link, index) => (
                            <div key={index}>
                                {link.url === null ? (
                                    <span className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 cursor-default leading-5">
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </span>
                                ) : (
                                    <Link
                                        href={link.url}
                                        className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 leading-5 hover:text-gray-400 focus:z-10 focus:outline-none focus:ring ring-gray-300 active:bg-light-gray active:text-gray-700 transition ease-in-out duration-150"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
}
