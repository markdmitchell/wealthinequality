import * as THREE from "three";
import type { BodyType } from "@/data/wealthSteps";

/**
 * Procedural textures for the celestial bodies. Surfaces are sampled from
 * seamless 3D fractal noise (wrapped around a cylinder so the longitude seam
 * never shows), generated once, cached by key, and disposed together.
 */

const cache = new Map<string, THREE.Texture>();

function cached(key: string, make: () => THREE.Texture): THREE.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const tex = make();
  cache.set(key, tex);
  return tex;
}

export function disposeTextureCache() {
  cache.forEach((t) => t.dispose());
  cache.clear();
  mapCache.clear();
}

function makeCtx(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function finish(c: HTMLCanvasElement, srgb = true) {
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function hex(color: number) {
  return "#" + color.toString(16).padStart(6, "0");
}

function rgb(color: number): [number, number, number] {
  return [(color >> 16) & 255, (color >> 8) & 255, color & 255];
}

/* ── NOISE ───────────────────────────────────────────────── */

function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = seed >>> 0 || 1;
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]!;
  const rnd = (x: number, y: number, z: number) =>
    perm[(perm[(perm[x & 255]! + y) & 255]! + z) & 255]! / 255;
  const fade = (t: number) => t * t * (3 - 2 * t);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  function noise(x: number, y: number, z: number) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    const c = (dx: number, dy: number, dz: number) => rnd(xi + dx, yi + dy, zi + dz);
    return lerp(
      lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
      lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
      zf,
    );
  }
  function fbm(x: number, y: number, z: number, oct = 5) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * noise(x * f, y * f, z * f);
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum / norm;
  }
  return { noise, fbm };
}

/**
 * Render a seamless equirectangular map. `shade(u, v, nx, ny, nz)` receives the
 * unit-sphere direction for each pixel and returns [r, g, b].
 */
function paint(
  w: number,
  h: number,
  shade: (u: number, v: number, x: number, y: number, z: number) => [number, number, number],
) {
  const { c, ctx } = makeCtx(w, h);
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let j = 0; j < h; j++) {
    const v = j / (h - 1);
    const lat = (0.5 - v) * Math.PI;
    const cy = Math.sin(lat), cr = Math.cos(lat);
    for (let i = 0; i < w; i++) {
      const u = i / w;
      const lon = u * Math.PI * 2;
      const [r, g, b] = shade(u, v, cr * Math.cos(lon), cy, cr * Math.sin(lon));
      const k = (j * w + i) * 4;
      d[k] = r;
      d[k + 1] = g;
      d[k + 2] = b;
      d[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixC = (a: number[], b: number[], t: number): [number, number, number] => [
  mix(a[0]!, b[0]!, t),
  mix(a[1]!, b[1]!, t),
  mix(a[2]!, b[2]!, t),
];
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

/* ── SURFACES ────────────────────────────────────────────── */

const EARTH_SEA_LEVEL = 0.52;

function earthHeight(n: ReturnType<typeof makeNoise>, x: number, y: number, z: number) {
  const warp = n.fbm(x * 1.5 + 7, y * 1.5, z * 1.5, 3) - 0.5;
  return n.fbm(x * 1.8 + warp, y * 1.8 + warp, z * 1.8, 6);
}

function earthTexture() {
  const n = makeNoise(42);
  return finish(
    paint(1024, 512, (_u, v, x, y, z) => {
      const h = earthHeight(n, x, y, z);
      const lat = Math.abs(v - 0.5) * 2;
      let col: [number, number, number];
      if (h < EARTH_SEA_LEVEL) {
        const depth = smooth(0.3, EARTH_SEA_LEVEL, h);
        col = mixC([6, 28, 70], [22, 92, 150], depth);
      } else {
        const t = smooth(EARTH_SEA_LEVEL, 0.75, h);
        const dry = n.fbm(x * 3 + 20, y * 3, z * 3, 3);
        const green = mixC([52, 104, 46], [34, 74, 36], t);
        const desert = mixC([170, 145, 96], [120, 96, 64], t);
        col = mixC(green, desert, smooth(0.5, 0.65, dry) * (1 - smooth(0.55, 0.8, lat)));
        col = mixC(col, [120, 110, 100], smooth(0.68, 0.8, h));
      }
      const ice = smooth(0.8, 0.9, lat + (n.noise(x * 8, y * 8, z * 8) - 0.5) * 0.12);
      return mixC(col, [236, 244, 252], ice);
    }),
  );
}

function earthRoughness() {
  const n = makeNoise(42);
  return finish(
    paint(512, 256, (_u, _v, x, y, z) => {
      const g = earthHeight(n, x, y, z) < EARTH_SEA_LEVEL ? 70 : 235;
      return [g, g, g];
    }),
    false,
  );
}

function cloudTexture() {
  const n = makeNoise(7);
  const { c, ctx } = makeCtx(1024, 512);
  const src = paint(1024, 512, (_u, v, x, y, z) => {
    const lat = Math.abs(v - 0.5) * 2;
    const swirl = n.fbm(x * 2, y * 6, z * 2, 3) * 2;
    const f = n.fbm(x * 3 + swirl, y * 5, z * 3 + swirl, 5);
    const band = 0.75 + 0.25 * Math.cos(lat * Math.PI * 3);
    const a = smooth(0.5, 0.72, f * band) * 255;
    return [a, a, a];
  });
  // Convert luminance to alpha on a white layer.
  const sctx = src.getContext("2d")!;
  const img = sctx.getImageData(0, 0, 1024, 512);
  for (let k = 0; k < img.data.length; k += 4) {
    img.data[k + 3] = img.data[k]!;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return finish(c);
}

function craterField(seed: number, count: number) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: count }, () => {
    const lon = r() * Math.PI * 2, lat = Math.asin(r() * 2 - 1);
    return {
      x: Math.cos(lat) * Math.cos(lon),
      y: Math.sin(lat),
      z: Math.cos(lat) * Math.sin(lon),
      size: 0.04 + Math.pow(r(), 3) * 0.22,
    };
  });
}

/** Height in 0..1 with bowl-shaped craters and raised rims. */
function rockyHeight(
  n: ReturnType<typeof makeNoise>,
  craters: ReturnType<typeof craterField>,
  x: number,
  y: number,
  z: number,
) {
  let h = n.fbm(x * 3, y * 3, z * 3, 5);
  for (const c of craters) {
    const d = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2 + (z - c.z) ** 2) / c.size;
    if (d < 1.3) {
      h += d < 1 ? -0.35 * (1 - d * d) : 0.18 * (1 - (d - 1) / 0.3);
    }
  }
  return h;
}

function rockyMaps(base: number[], seed: number) {
  const n = makeNoise(seed);
  const craters = craterField(seed, 70);
  const color = paint(512, 256, (_u, _v, x, y, z) => {
    const h = rockyHeight(n, craters, x, y, z);
    const t = clamp01(h * 1.2 - 0.1);
    return mixC(base.map((c) => c * 0.45), base.map((c) => Math.min(255, c * 1.15)), t);
  });
  const bump = paint(512, 256, (_u, _v, x, y, z) => {
    const g = clamp01(rockyHeight(n, craters, x, y, z)) * 255;
    return [g, g, g];
  });
  return { map: finish(color), bump: finish(bump, false) };
}

function terrestrialMaps(color: number) {
  const n = makeNoise(11);
  const base = rgb(color);
  const height = (x: number, y: number, z: number) => {
    const ridge = 1 - Math.abs(n.fbm(x * 2.5, y * 2.5, z * 2.5, 5) * 2 - 1);
    return ridge * 0.6 + n.fbm(x * 6, y * 6, z * 6, 3) * 0.4;
  };
  const map = paint(512, 256, (_u, v, x, y, z) => {
    const h = height(x, y, z);
    let col = mixC(base.map((c) => c * 0.35), base.map((c) => Math.min(255, c * 1.05)), h);
    col = mixC(col, [176, 150, 110], smooth(0.62, 0.8, n.fbm(x * 4 + 3, y * 4, z * 4, 3)));
    const lat = Math.abs(v - 0.5) * 2;
    return mixC(col, [230, 238, 240], smooth(0.84, 0.93, lat));
  });
  const bump = paint(512, 256, (_u, _v, x, y, z) => {
    const g = height(x, y, z) * 255;
    return [g, g, g];
  });
  return { map: finish(map), bump: finish(bump, false) };
}

function gasTexture(color: number) {
  const n = makeNoise(color & 0xffff);
  const base = rgb(color);
  const light = base.map((c) => Math.min(255, c * 1.35 + 40));
  const dark = base.map((c) => c * 0.45);
  // A large oval storm, like Jupiter's Great Red Spot.
  const storm = { lon: 1.9, lat: -0.35, w: 0.32, h: 0.13 };
  return finish(
    paint(1024, 512, (u, v, x, y, z) => {
      const lat = (0.5 - v) * Math.PI;
      const shear = (n.fbm(x * 2, y * 2, z * 2, 4) - 0.5) * 0.35;
      const turb = n.fbm(x * 4, y * 16, z * 4, 4);
      const band = 0.5 + 0.5 * Math.sin((lat + shear) * 14 + turb * 2.2);
      let col = mixC(dark, light, band * 0.75 + turb * 0.25);
      let dl = (u * Math.PI * 2 - storm.lon) / storm.w;
      dl = ((dl % (Math.PI * 2 / storm.w)) + Math.PI * 2 / storm.w) % (Math.PI * 2 / storm.w);
      if (dl > Math.PI / storm.w) dl -= Math.PI * 2 / storm.w;
      const sd = Math.hypot(dl, (lat - storm.lat) / storm.h);
      if (sd < 1.4) {
        const swirl = n.fbm(x * 12, y * 12, z * 12, 3);
        col = mixC(col, [196, 96, 64], (1 - smooth(0.6, 1.4, sd)) * (0.6 + swirl * 0.4));
      }
      return col;
    }),
  );
}

function iceTexture() {
  const n = makeNoise(5);
  return finish(
    paint(512, 256, (_u, v, x, y, z) => {
      const f = n.fbm(x * 3, y * 10, z * 3, 4);
      const col = mixC([12, 95, 138], [94, 196, 239], f);
      return mixC(col, [220, 240, 255], smooth(0.8, 0.95, Math.abs(v - 0.5) * 2));
    }),
  );
}

/** Convective granulation; brightness only, tinted by the star's colour in-shader. */
function starSurfaceTexture(color: number) {
  const n = makeNoise(color & 0xffff);
  const base = rgb(color);
  const hot = base.map((c) => Math.min(255, c * 1.12 + 30));
  const cool = base.map((c) => c * 0.55);
  return finish(
    paint(1024, 512, (_u, _v, x, y, z) => {
      const cells = 1 - Math.abs(n.noise(x * 22, y * 22, z * 22) * 2 - 1);
      const large = n.fbm(x * 4, y * 4, z * 4, 4);
      const t = clamp01(cells * 0.55 + large * 0.6 - 0.05);
      const spot = smooth(0.7, 0.78, n.fbm(x * 3 + 9, y * 3, z * 3, 3));
      return mixC(mixC(cool, hot, t), base.map((c) => c * 0.25), spot * 0.8);
    }),
  );
}

/* ── SPRITES ─────────────────────────────────────────────── */

function glowSprite(color: number) {
  const { c, ctx } = makeCtx(256, 256);
  const h = hex(color);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, h + "cc");
  g.addColorStop(0.3, h + "55");
  g.addColorStop(1, h + "00");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return finish(c);
}

/** Soft corona with streamers rather than a lens-flare cross. */
function flareSprite(color: number) {
  const { c, ctx } = makeCtx(512, 512);
  const h = hex(color);
  ctx.translate(256, 256);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + Math.random() * 0.2;
    const len = 150 + Math.random() * 100;
    const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    g.addColorStop(0, h + "55");
    g.addColorStop(1, h + "00");
    ctx.strokeStyle = g;
    ctx.lineWidth = 6 + Math.random() * 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 200);
  core.addColorStop(0, "rgba(255,255,255,0.5)");
  core.addColorStop(0.35, h + "44");
  core.addColorStop(1, h + "00");
  ctx.fillStyle = core;
  ctx.fillRect(-256, -256, 512, 512);
  return finish(c);
}

/** Radial ring profile (u = inner → outer) with fine banding and a Cassini gap. */
function ringSprite(color: number) {
  const { c, ctx } = makeCtx(1024, 4);
  const base = rgb(color).map((v) => Math.min(255, v * 0.7 + 70));
  const img = ctx.createImageData(1024, 4);
  for (let i = 0; i < 1024; i++) {
    const u = i / 1023;
    const fine = 0.55 + 0.45 * Math.sin(u * 180 + Math.sin(u * 37) * 3);
    let a = smooth(0, 0.06, u) * (1 - smooth(0.9, 1, u)) * (0.35 + 0.65 * fine);
    if (u > 0.6 && u < 0.66) a *= 0.08; // Cassini division
    if (u < 0.25) a *= 0.45; // faint inner C ring
    for (let r = 0; r < 4; r++) {
      const k = (r * 1024 + i) * 4;
      img.data[k] = base[0]! * (0.8 + fine * 0.2);
      img.data[k + 1] = base[1]! * (0.8 + fine * 0.2);
      img.data[k + 2] = base[2]! * (0.8 + fine * 0.2);
      img.data[k + 3] = a * 230;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finish(c);
}

/* ── PUBLIC API ──────────────────────────────────────────── */

export interface SurfaceMaps {
  map: THREE.Texture;
  bump?: THREE.Texture;
  roughness?: THREE.Texture;
}

const mapCache = new Map<string, SurfaceMaps>();

export function surfaceMaps(bodyType: BodyType, color: number): SurfaceMaps {
  const key = `surface:${bodyType}:${color}`;
  const hit = mapCache.get(key);
  if (hit) return hit;
  let maps: SurfaceMaps;
  switch (bodyType) {
    case "earth":
      maps = { map: earthTexture(), roughness: earthRoughness() };
      break;
    case "moon":
      maps = rockyMaps([190, 190, 190], 3);
      break;
    case "rocky":
      maps = rockyMaps([118, 130, 104], 9);
      break;
    case "ice":
      maps = { map: iceTexture() };
      break;
    case "gas":
      maps = { map: gasTexture(color) };
      break;
    case "terrestrial":
      maps = terrestrialMaps(color);
      break;
    default:
      maps = { map: starSurfaceTexture(color) };
  }
  Object.values(maps).forEach((t, i) => t && cache.set(`${key}:${i}`, t));
  mapCache.set(key, maps);
  return maps;
}

export const clouds = () => cached("clouds", cloudTexture);
export const glow = (color: number) => cached(`glow:${color}`, () => glowSprite(color));
export const flare = (color: number) => cached(`flare:${color}`, () => flareSprite(color));
export const ring = (color: number) => cached(`ring:${color}`, () => ringSprite(color));
