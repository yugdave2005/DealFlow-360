/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        /* DealFlow360 warm design tokens */
        df: {
          bg: '#FAF9F6',
          sidebar: '#F7F5F1',
          surface: '#FFFFFF',
          'surface-secondary': '#F5F2ED',
          'surface-hover': '#F2EFEA',
          border: '#E6E1D9',
          'border-subtle': '#EEEAE4',
          primary: '#D97757',
          'primary-hover': '#C96648',
          'primary-soft': '#F8E9E3',
          'primary-border': '#E9B8A7',
          foreground: '#171717',
          secondary: '#6F6B66',
          muted: '#96918A',
          disabled: '#B4AEA6',
          success: '#3F8F63',
          'success-soft': '#EAF5EE',
          warning: '#C98A32',
          'warning-soft': '#FBF2E3',
          danger: '#C95757',
          'danger-soft': '#FBEAEA',
          info: '#5D83A8',
          'info-soft': '#EBF1F7',
        },

        /* shadcn/ui compatibility */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'df': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'df-md': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'df-lg': '0 4px 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
