/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12161C",
        panel: "#1A1F27",
        panel2: "#20262F",
        line: "#2B3340",
        paper: "#F6F4EE",
        signal: "#4F7CFF",
        signal2: "#8DA3FF",
        amber: "#E0A526",
        coral: "#E0644A",
        mint: "#3FAE83",
        ash: "#8A93A3"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,14,20,0.4), 0 8px 24px -8px rgba(10,14,20,0.5)"
      }
    }
  },
  plugins: []
};
