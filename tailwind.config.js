/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Cores da Banda Grupo Emanuel
                brand: {
                    primary: '#c89800',      // Dourado escuro (títulos, ícones)
                    secondary: '#ffef43',    // Amarelo dourado (destaques, hover)
                    bg: {
                        page: '#361b1c',       // Fundo da página
                        card: '#2a1215',       // Cards, header, footer
                    }
                },
            },
        },
    },
    plugins: [],
}
