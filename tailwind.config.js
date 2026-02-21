/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
            colors: {
                saffron: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#F26B02', // Official Brand Color
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                cream: {
                    50: '#fdfbf7',
                    100: '#f9f5eb',
                    200: '#ece5d0', // Warm undertone
                }
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'card': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
                'float': '0 20px 25px -5px rgba(242, 107, 2, 0.15), 0 10px 10px -5px rgba(242, 107, 2, 0.1)',
            }
        },
    },
    plugins: [],
}
