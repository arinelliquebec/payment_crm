/** @type {import("tailwindcss").Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores do sistema
        border: "rgb(229, 229, 229)",
        input: "rgb(245, 245, 245)",
        ring: "rgb(59, 130, 246)",
        background: "rgb(255, 255, 255)",
        foreground: "rgb(23, 37, 84)",

        // Azul Corporativo Principal
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },

        // Dourado Premium
        gold: {
          DEFAULT: "#eab308",
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
          950: "#78350f",
        },

        // Cores Neutras Executivas
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },

        // Cores Secundárias
        secondary: {
          DEFAULT: "#64748b",
          foreground: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },

        // Verde Sucesso
        green: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },

        // Vermelho Alerta
        red: {
          DEFAULT: "#ef4444",
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },

        // Roxo Accent
        purple: {
          DEFAULT: "#8b5cf6",
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },

        // Cores de Status
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",

        // Cores de Background
        muted: {
          DEFAULT: "#f9fafb",
          foreground: "#6b7280",
        },

        // Cores Destructivas
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },

        // Cores de Accent
        accent: {
          DEFAULT: "#eab308",
          foreground: "#ffffff",
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },

        // Cores de Popover
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },

        // Cores de Card
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
      },

      // Configurações de Border Radius
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      // Fontes
      fontFamily: {
        sans: [
          "Inter",
          "Plus Jakarta Sans",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },

      // Tamanhos de Fonte Customizados
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }], // 10px
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
        "5xl": ["3rem", { lineHeight: "1.2" }], // 48px
        "6xl": ["3.75rem", { lineHeight: "1.1" }], // 60px
        "7xl": ["4.5rem", { lineHeight: "1.1" }], // 72px
        "8xl": ["6rem", { lineHeight: "1" }], // 96px
        "9xl": ["8rem", { lineHeight: "1" }], // 128px
      },

      // Animações Customizadas
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-out": "fadeOut 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "scale-out": "scaleOut 0.3s ease-out",
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        shimmer: "shimmer 2s linear infinite",
        glow: "glow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },

      // Keyframes
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },

      // Box Shadow Customizado
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        "3xl": "0 35px 60px -15px rgba(0, 0, 0, 0.3)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        none: "none",
        // Sombras Premium
        "premium-sm":
          "0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(59, 130, 246, 0.08)",
        "premium-md":
          "0 4px 8px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(59, 130, 246, 0.12)",
        "premium-lg":
          "0 8px 16px rgba(0, 0, 0, 0.16), 0 16px 48px rgba(59, 130, 246, 0.16)",
        "gold-sm":
          "0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(234, 179, 8, 0.08)",
        "gold-md":
          "0 4px 8px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(234, 179, 8, 0.12)",
        "gold-lg":
          "0 8px 16px rgba(0, 0, 0, 0.16), 0 16px 48px rgba(234, 179, 8, 0.16)",
      },

      // Backdrop Blur
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "40px",
        "3xl": "64px",
      },

      // Larguras Máximas Customizadas
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
        "10xl": "104rem",
      },

      // Z-index
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },

      // Spacing adicional
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
        144: "36rem",
      },

      // Transições
      transitionDuration: {
        0: "0ms",
        2000: "2000ms",
        3000: "3000ms",
      },

      // Aspect Ratio
      aspectRatio: {
        "4/3": "4 / 3",
        "21/9": "21 / 9",
      },
    },
  },
  plugins: [
    // Adicione plugins do Tailwind aqui se necessário
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/aspect-ratio'),
  ],
};

export default config;
