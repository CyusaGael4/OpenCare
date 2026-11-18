/**
 * OpenCare design tokens.
 *
 * This file is the canonical definition of the brand palette. Values come from
 * the OpenCare logo: deep medical teal (#194C54) and warm medical gold (#F3D66A),
 * plus the neutral supporting range. Do not introduce colours from outside this
 * scale — every page, component and state must draw from these tokens.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep Medical Teal — primary
        primary: {
          DEFAULT: '#194C54',
          50: '#EAF3F1',
          100: '#DCEBE9',
          200: '#BFDAD6',
          300: '#97C2BE',
          400: '#69A5A2',
          500: '#3E8385',
          600: '#2A6A70',
          700: '#1F585F',
          800: '#194C54', // brand primary
          900: '#123C43',
          950: '#0E2F35',
        },
        // Warm Medical Gold — accent, used sparingly
        accent: {
          DEFAULT: '#F3D66A',
          50: '#FEFBF0',
          100: '#FCF6DE',
          200: '#F9ECC0',
          300: '#F3D66A', // brand accent
          400: '#E6C44E',
          500: '#C9A93C',
          600: '#A88B2E',
          700: '#7E6822',
        },
        // Text
        ink: {
          DEFAULT: '#18373B',
          muted: '#748286',
        },
        // Surfaces
        canvas: '#F5F6F4',
        surface: '#FFFFFF',
        line: '#E7EBE8',
        mist: '#F0F2F1',
        /*
         * Functional, not decorative: validation and destructive states need a
         * colour that reads as "attention" and still passes contrast. It is
         * deliberately muted and never used for brand emphasis.
         */
        danger: {
          50: '#FDF2F1',
          100: '#FBE3E0',
          200: '#F5C7C2',
          600: '#B3261E',
          700: '#8F1D17',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Slightly tighter display sizes than Tailwind's defaults, per the Medica reference
        'page-title': ['1.9rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'section-title': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'label-xs': ['0.75rem', { lineHeight: '1.1rem', fontWeight: '500' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24, 55, 59, 0.04), 0 10px 28px -22px rgba(24, 55, 59, 0.35)',
        lift: '0 2px 6px rgba(24, 55, 59, 0.06), 0 18px 40px -28px rgba(24, 55, 59, 0.45)',
        focus: '0 0 0 3px rgba(25, 76, 84, 0.18)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
