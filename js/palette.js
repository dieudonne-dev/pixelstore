// ==================== COULEURS DYNAMIQUES (assorties à l'image du produit) ====================
// Extrait la palette dominante d'une image (via canvas, sans affichage) puis
// l'applique sur un élément via des variables CSS `--p-*`.
// Valeurs par défaut (vert émeraude de la marque) définies dans le CSS.

// Extrait une palette de couleurs depuis l'image (URL)
function extractPalette(src) {
  return new Promise((resolve) => {
    // Images locales : aucune extension CORS ni paramètre de redimensionnement
    const isRemote = /^https?:\/\//i.test(src);
    const img = new Image();
    if (isRemote) img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = isRemote ? src + (src.includes('?') ? '&' : '?') + 'w=220&q=50&fit=crop' : src;

    img.onload = () => {
      try {
        const W = 120;
        const canvas = document.createElement('canvas');
        const H = Math.max(1, Math.round((W * img.naturalHeight) / img.naturalWidth));
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, W, H);
        const { data } = ctx.getImageData(0, 0, W, H);

        // Agrège les pixels par « seau » de 16 niveaux par canal
        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 100) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          const cur = buckets.get(key);
          if (cur) { cur.r += r; cur.g += g; cur.b += b; cur.n += 1; }
          else buckets.set(key, { r, g, b, n: 1 });
        }

        // Moyenne par seau + note = volume pondéré par la saturation
        const scored = [];
        buckets.forEach(({ r, g, b, n }) => {
          const R = r / n, G = g / n, B = b / n;
          const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
          const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;
          const sat = mx === 0 ? 0 : (mx - mn) / mx;
          const edge = lum > 18 && lum < 240 ? 1 : 0.3;
          scored.push({ r: Math.round(R), g: Math.round(G), b: Math.round(B), w: n * (0.35 + sat) * edge });
        });
        scored.sort((a, b) => b.w - a.w);
        resolve(scored.slice(0, 10));
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
}

// Utilitaires colorimétriques
const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
const toRgb = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;
const toRgba = (c, a) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
const shade = (c, f) => ({ r: clamp255(c.r * f), g: clamp255(c.g * f), b: clamp255(c.b * f) });
const hueOf = (c) => {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx === mn) return 0;
  const d = mx - mn;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return ((h * 60) % 360 + 360) % 360;
};

// Choisit l'accent principal + une couleur secondaire (teinte la plus différente)
function pickAccent(colors) {
  const primary = colors[0];
  if (colors.length === 1) return { primary, secondary: shade(primary, 0.5) };
  const h1 = hueOf(primary);
  let secondary = colors[1];
  let best = -1;
  for (const c of colors.slice(1)) {
    const dist = Math.min(Math.abs(hueOf(c) - h1), 360 - Math.abs(hueOf(c) - h1));
    if (dist > best) { best = dist; secondary = c; }
  }
  return { primary, secondary };
}

// Applique la palette de l'image sur un élément via des variables CSS `--p-*`
function applyPaletteToElement(element, imageSrc) {
  if (!element) return;
  extractPalette(imageSrc).then((colors) => {
    if (!colors || !colors.length) return;

    const { primary: accent, secondary } = pickAccent(colors);
    const accentDark = shade(secondary, 0.72);
    const lumA = 0.2126 * accent.r + 0.7152 * accent.g + 0.0722 * accent.b;
    const lumS = 0.2126 * secondary.r + 0.7152 * secondary.g + 0.0722 * secondary.b;
    const ink = Math.max(lumA, lumS) > 150 ? '#0a0f1c' : '#ffffff';
    const bgTint = {
      r: clamp255(accent.r * 0.13 + 6),
      g: clamp255(accent.g * 0.13 + 8),
      b: clamp255(accent.b * 0.13 + 14)
    };

    element.style.setProperty('--p-accent', toRgb(accent));
    element.style.setProperty('--p-accent-dark', toRgb(accentDark));
    element.style.setProperty('--p-ink', ink);
    element.style.setProperty('--p-glow', toRgba(accent, 0.42));
    element.style.setProperty('--p-glow-strong', toRgba(accent, 0.58));
    element.style.setProperty('--p-tint', toRgba(accent, 0.12));
    element.style.setProperty('--p-line', toRgba(accent, 0.6));
    element.style.setProperty('--p-bg', toRgba(bgTint, 0.88));
    element.style.setProperty('--p-brand', toRgba(accent, 0.16));
  });
}