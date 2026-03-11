/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: {
                    950: '#020617', // Deepest Navy
                    900: '#0a0f29', // Rich Blue/Navy
                    800: '#111840',
                },
                cyan: {
                    400: '#22d3ee', // Glowing Electric Blue
                    500: '#06b6d4',
                },
                emerald: {
                    400: '#34d399', // Online Status
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'], // For headers if needed
            },
            backgroundImage: {
                'deep-ocean': 'linear-gradient(to bottom right, #020617, #0a0f29)',
            },
        },
    },
    plugins: [],
}
