import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    DEFAULT: '#0c4a6e',
                    dark: '#082f49',
                    light: '#0369a1',
                    surface: '#f8fafc',
                    muted: 'rgba(12, 74, 110, 0.12)',
                    'on-muted': '#0c4a6e',
                },
            },
            transitionDuration: {
                layout: '280ms',
            },
        },
    },

    plugins: [forms],
};
