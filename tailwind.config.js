/** @type {import('tailwindcss').Config} */

// Colours come from CSS variables (RGB channels in src/index.css) so every token accepts opacity: bg-surface-1/80.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Hover styles only apply on devices with a real pointer: no "sticky hover" after a tap on iPhone/iPad.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      colors: {
        bg: token('bg'),
        surface: {
          DEFAULT: token('surface-1'),
          1: token('surface-1'),
          '1-hover': token('surface-1-hover'),
          2: token('surface-2'),
          3: token('surface-3'),
        },
        label: {
          1: token('label-1'),
          2: token('label-2'),
          3: token('label-3'),
        },
        separator: token('separator'),
        primary: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          pressed: token('accent-pressed'),
          600: token('accent-pressed'), // legacy alias
        },
        'on-primary': token('on-accent'),
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
        info: token('info'),
        // Chart palette (WakaTime bar/legend only).
        data: {
          1: '#0a84ff',
          2: '#30d158',
          3: '#ff9f0a',
          4: '#bf5af2',
          5: '#64d2ff',
          6: '#ff375f',
          7: '#8e8e93',
        },
        // Legacy aliases kept so untouched markup still compiles — don't use in new code.
        muted: token('label-2'),
        text: token('label-1'),
      },
      fontFamily: {
        // SF Pro on Apple devices (system font, zero bytes); self-hosted Inter Variable everywhere else.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Inter Variable"',
          'Inter',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', '"SF Mono"', 'SFMono-Regular', 'Menlo', '"Cascadia Code"', '"Roboto Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Fluid type scale (phone → desktop). Nothing below `caption` (12px).
        display: ['clamp(2.5rem, 1.6rem + 4vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '600' }],
        headline: ['clamp(2rem, 1.4rem + 2.6vw, 3.5rem)', { lineHeight: '1.08', letterSpacing: '-0.018em', fontWeight: '600' }],
        stat: ['clamp(2.5rem, 1.9rem + 2.4vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'title-1': ['clamp(1.5rem, 1.2rem + 1.2vw, 2rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'title-2': ['clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)', { lineHeight: '1.2', letterSpacing: '-0.012em', fontWeight: '600' }],
        'title-3': ['clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        lead: ['clamp(1.125rem, 1rem + 0.5vw, 1.3125rem)', { lineHeight: '1.42', letterSpacing: '-0.012em' }],
        body: ['1.0625rem', { lineHeight: '1.47', letterSpacing: '-0.012em' }],
        callout: ['1rem', { lineHeight: '1.5', letterSpacing: '-0.011em' }],
        subhead: ['0.9375rem', { lineHeight: '1.4', letterSpacing: '-0.009em' }],
        footnote: ['0.8125rem', { lineHeight: '1.385', letterSpacing: '-0.004em' }],
        caption: ['0.75rem', { lineHeight: '1.333', letterSpacing: '0em' }],
      },
      spacing: {
        tap: '2.75rem', // 44px — Apple HIG minimum touch target (min-h-tap, size-tap)
        gutter: 'var(--gutter)',
        section: 'var(--section-y)',
        'section-head': 'var(--section-head-gap)',
        card: 'var(--card-pad)',
        nav: 'var(--nav-h)',
        grid: 'var(--grid-gap)',
      },
      maxWidth: {
        reading: '40rem',
        narrow: '52rem',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        sheet: '28px',
        tile: '16px',
        media: '12px',
        control: '10px',
        pill: '999px',
      },
      boxShadow: {
        hairline: 'inset 0 0 0 1px rgb(255 255 255 / 0.08)',
        float: '0 8px 30px rgb(0 0 0 / 0.45)',
        sheet: '0 24px 70px -12px rgb(0 0 0 / 0.7)',
        frame: '0 24px 48px rgb(0 0 0 / 0.5)',
        paper: '0 6px 20px rgb(0 0 0 / 0.45)',
      },
      zIndex: {
        raised: '10',
        dock: '40',
        nav: '50',
        menu: '60',
        sheet: '100',
        toast: '110',
        skip: '120',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        emphasized: 'cubic-bezier(0.22, 1, 0.36, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
        slower: '600ms',
      },
      keyframes: {
        'eq-bar': {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'eq-bar': 'eq-bar 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [
    // Capability variants: use instead of breakpoints for anything that depends on hover vs touch.
    ({ addVariant }) => {
      addVariant('can-hover', '@media (hover: hover) and (pointer: fine)');
      addVariant('touch', '@media (hover: none), (pointer: coarse)');
    },
  ],
};
