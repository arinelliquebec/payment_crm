/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        // Paleta Futurista CRM JURÍDICO: Preto, Cinza Escuro e Dourado
        primary: {
          DEFAULT: "#D4AF37", // Dourado principal
          foreground: "#0A0A0A",
          50: "#FFFBF0",
          100: "#FFF5D6",
          200: "#FFEBAD",
          300: "#FFE184",
          400: "#FFD75B",
          500: "#D4AF37", // Dourado rico
          600: "#B8941F",
          700: "#9C7A15",
          800: "#80600D",
          900: "#644607",
          950: "#483003",
        },
        gold: {
          DEFAULT: "#D4AF37",
          50: "#FFFBF0",
          100: "#FFF5D6",
          200: "#FFEBAD",
          300: "#FFE184",
          400: "#FFD75B",
          500: "#D4AF37", // Dourado rico
          600: "#B8941F",
          700: "#9C7A15",
          800: "#80600D",
          900: "#644607",
          950: "#483003",
        },
        neutral: {
          50: "#F5F5F5",
          100: "#E8E8E8",
          200: "#D1D1D1",
          300: "#B0B0B0",
          400: "#888888",
          500: "#6B6B6B",
          600: "#505050",
          700: "#3A3A3A", // Cinza escuro
          800: "#262626", // Cinza muito escuro
          900: "#1A1A1A", // Quase preto
          950: "#0A0A0A", // Preto profundo
        },
        dark: {
          DEFAULT: "#0A0A0A",
          50: "#1A1A1A",
          100: "#262626",
          200: "#3A3A3A",
          300: "#505050",
          400: "#6B6B6B",
        },
        accent: {
          gold: "#D4AF37",
          "gold-light": "#FFD75B",
          "gold-dark": "#9C7A15",
          silver: "#C0C0C0",
          bronze: "#CD7F32",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-dark": "linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)",
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #FFD75B 100%)",
        "gradient-premium":
          "linear-gradient(135deg, #0A0A0A 0%, #262626 50%, #D4AF37 100%)",
        "gradient-subtle": "linear-gradient(180deg, #1A1A1A 0%, #0A0A0A 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(212, 175, 55, 0.3)",
        "gold-glow-lg": "0 0 40px rgba(212, 175, 55, 0.4)",
        "dark-elevated": "0 10px 40px rgba(0, 0, 0, 0.5)",
        premium:
          "0 4px 20px rgba(212, 175, 55, 0.15), 0 0 0 1px rgba(212, 175, 55, 0.1)",
      },
    },
  },
  plugins: [],
};
