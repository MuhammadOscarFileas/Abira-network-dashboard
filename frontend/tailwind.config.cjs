/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1A237E",
        secondary: "#FFFFFF",
        accent: "#2979FF",
        success: "#00C853",
        danger: "#FF3D00",
        warning: "#FF9800",
        background: "#F5F7FA",
        textcharcoal: "#37474F",
      },
    },
  },
  plugins: [],
};

