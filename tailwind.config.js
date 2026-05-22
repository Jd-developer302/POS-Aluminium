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
                    DEFAULT: '#00966d',
                    dark: '#007a59',
                    light: '#00b386',
                    surface: '#f8fafc',
                    muted: 'rgba(0, 150, 109, 0.12)',
                    'on-muted': '#0d4a3a',
                },
            },
            transitionDuration: {
                layout: '280ms',
            },
        },
    },

    plugins: [forms],
};
