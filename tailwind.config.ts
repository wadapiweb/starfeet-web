import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                starfeet: {
                    blue: "#001A49", // Color institucional
                    lime: "#D4FD23", // Color de acento
                    dark: {
                        100: "#545453", // Fondo modo oscuro secundario
                        900: "#292928", // Fondo modo oscuro principal
                    }
                }
            },
            fontFamily: {
                sans: ['var(--font-helvetica)', 'sans-serif'],
                condensed: ['var(--font-helvetica-condensed)', 'sans-serif'],
            }
        },
    },
    plugins: [],
};

export default config;
