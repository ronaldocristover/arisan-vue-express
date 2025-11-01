import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            fontSize: {
                'xs': ['0.875rem', { lineHeight: '1.25rem' }],
                'sm': ['1rem', { lineHeight: '1.5rem' }],
                'base': ['1.125rem', { lineHeight: '1.75rem' }],
                'lg': ['1.25rem', { lineHeight: '2rem' }],
                'xl': ['1.5rem', { lineHeight: '2.25rem' }],
                '2xl': ['1.875rem', { lineHeight: '2.5rem' }],
                '3xl': ['2.25rem', { lineHeight: '3rem' }],
            },
        },
    },
    plugins: [
        forms,
    ],
}
