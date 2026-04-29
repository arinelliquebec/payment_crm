"use client";

import { createTheme, alpha } from "@mui/material/styles";

// 2026 Trending Aesthetic: Deep, rich, glassmorphism, neon accents
const theme = createTheme({
    palette: {
        mode: "dark", // Default to dark mode for that premium feel
        primary: {
            main: "#3b82f6", // Tailwind blue-500
            light: "#60a5fa",
            dark: "#2563eb",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#eab308", // Tailwind amber-500
            light: "#facc15",
            dark: "#ca8a04",
            contrastText: "#000000",
        },
        background: {
            default: "#0a0a0a", // Very dark neutral
            paper: "#171717", // Slightly lighter
        },
        text: {
            primary: "#ffffff",
            secondary: "#a3a3a3",
        },
        action: {
            hover: alpha("#3b82f6", 0.08),
            selected: alpha("#3b82f6", 0.16),
        },
    },
    typography: {
        fontFamily: "var(--font-inter), sans-serif", // Assuming Inter is set in layout
        h1: { fontWeight: 700, letterSpacing: "-0.02em" },
        h2: { fontWeight: 700, letterSpacing: "-0.01em" },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: "none", fontWeight: 600 },
    },
    shape: {
        borderRadius: 12, // Modern, softer corners
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: "8px",
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)", // Subtle glow
                    },
                },
                containedPrimary: {
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                },
                elevation1: {
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: "outlined",
                size: "small",
            },
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.1)",
                        },
                        "&:hover fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.2)",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                            boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
                        },
                    },
                },
            },
        },
    },
});

export default theme;
