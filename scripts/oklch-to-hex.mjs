// One-off helper: convert the oklch design tokens in globals.css to hex for
// places that cannot take oklch (PWA manifest theme_color, meta themeColor).
// Run: node scripts/oklch-to-hex.mjs

function oklchToHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  // OKLab -> LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  // LMS -> linear sRGB
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  const toSrgb = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
    return Math.round(Math.min(1, Math.max(0, c)) * 255)
  }

  return (
    '#' +
    [toSrgb(lr), toSrgb(lg), toSrgb(lb)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}

const tokens = {
  'dark --background': [0.15, 0.02, 230],
  'dark --primary': [0.8, 0.13, 190],
  'dark --primary-foreground': [0.17, 0.03, 220],
  'light --primary': [0.5, 0.1, 195],
}

for (const [name, [L, C, h]] of Object.entries(tokens)) {
  console.log(`${name.padEnd(26)} oklch(${L} ${C} ${h}) -> ${oklchToHex(L, C, h)}`)
}
