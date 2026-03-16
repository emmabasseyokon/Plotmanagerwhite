// Theme color configuration — single source of truth for brand color
// Set NEXT_PUBLIC_THEME_COLOR in .env.local to a hex value (e.g., #2563eb for blue)
// Default: #059669 (emerald green)

const DEFAULT_COLOR = '#059669'

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
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

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  if (s === 0) {
    const v = Math.round(l * 255)
    return `#${v.toString(16).padStart(2, '0').repeat(3)}`
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255)
  const g = Math.round(hue2rgb(p, q, h / 360) * 255)
  const b = Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

/**
 * Generate a full Tailwind-style color palette (50-950) from a single hex color.
 * The input hex is treated as the 600 shade (the main brand color).
 */
export function generatePalette(hex: string): Record<string, string> {
  const [h, s] = hexToHsl(hex)

  // Lightness values for each shade (approximate Tailwind mapping)
  const shades: [string, number, number][] = [
    ['50', 0.97, 0.15],
    ['100', 0.94, 0.25],
    ['200', 0.88, 0.35],
    ['300', 0.78, 0.50],
    ['400', 0.64, 0.65],
    ['500', 0.50, 0.80],
    ['600', 0.40, 1.0],
    ['700', 0.34, 1.0],
    ['800', 0.28, 0.95],
    ['900', 0.23, 0.90],
    ['950', 0.15, 0.85],
  ]

  const palette: Record<string, string> = {}
  for (const [shade, lightness, satMult] of shades) {
    palette[shade] = hslToHex(h, Math.min(s * satMult, 1), lightness)
  }

  return palette
}

/**
 * Get the theme color hex from environment variable.
 */
export function getThemeColor(): string {
  return process.env.NEXT_PUBLIC_THEME_COLOR || DEFAULT_COLOR
}

/**
 * Get the theme color as RGB tuple (for jsPDF and other non-CSS usage).
 */
export function getThemeColorRgb(): [number, number, number] {
  return hexToRgb(getThemeColor())
}

/**
 * Get the full generated palette for the theme color.
 */
export function getThemePalette(): Record<string, string> {
  return generatePalette(getThemeColor())
}
