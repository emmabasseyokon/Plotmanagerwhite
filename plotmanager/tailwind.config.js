/** @type {import('tailwindcss').Config} */

// --- Theme color palette generator ---
// Set NEXT_PUBLIC_THEME_COLOR in .env.local to a hex value (e.g., #2563eb for blue)
// Default: #059669 (emerald green)
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

function hslToHex(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  if (s === 0) { const v = Math.round(l * 255); return '#' + v.toString(16).padStart(2,'0').repeat(3) }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = Math.round(hue2rgb(p, q, h/360 + 1/3) * 255)
  const g = Math.round(hue2rgb(p, q, h/360) * 255)
  const b = Math.round(hue2rgb(p, q, h/360 - 1/3) * 255)
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')
}

function generatePalette(hex) {
  const [h, s] = hexToHsl(hex)
  const shades = [
    ['50', 0.97, 0.15], ['100', 0.94, 0.25], ['200', 0.88, 0.35],
    ['300', 0.78, 0.50], ['400', 0.64, 0.65], ['500', 0.50, 0.80],
    ['600', 0.40, 1.0],  ['700', 0.34, 1.0],  ['800', 0.28, 0.95],
    ['900', 0.23, 0.90], ['950', 0.15, 0.85],
  ]
  const palette = {}
  for (const [shade, lightness, satMult] of shades) {
    palette[shade] = hslToHex(h, Math.min(s * satMult, 1), lightness)
  }
  return palette
}

const themeColor = process.env.NEXT_PUBLIC_THEME_COLOR || '#059669'

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: generatePalette(themeColor),
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e6fe',
          300: '#7cd4fd',
          400: '#36bffa',
          500: '#0ba5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
