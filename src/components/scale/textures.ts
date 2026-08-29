import * as THREE from "three";
import type { BodyType } from "@/data/wealthSteps";

/**
 * Procedural canvas textures for the celestial bodies. Every texture is
 * generated once, cached by key, and disposed together via disposeTextureCache().
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
  return tex;
}

function hex(color: number) {
  return "#" + color.toString(16).padStart(6, "0");
}

/* ── SURFACES ────────────────────────────────────────────── */

function earthTexture() {
  const { c, ctx } = makeCtx(1024, 512);
  const ocean = ctx.createLinearGradient(0, 0, 0, 512);
  ocean.addColorStop(0, "#0a2f5c");
  ocean.addColorStop(0.5, "#0d4d8a");
  ocean.addColorStop(1, "#0a2f5c");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 1024, 512);

  const landShapes: [number, number, number, number, number][] = [
    [180, 140, 130, 95, 0.3],
    [380, 95, 90, 65, 0.1],
    [510, 195, 110, 85, 0.5],
    [295, 305, 75, 55, 0.8],
    [610, 135, 68, 52, 0.2],
    [145, 255, 55, 42, 0.9],
    [720, 215, 95, 72, 0.15],
    [820, 145, 72, 58, 0.4],
    [450, 350, 60, 42, 0.7],
    [100, 180, 40, 32, 0.6],
    [930, 280, 55, 45, 0.3],
  ];
  landShapes.forEach(([x, y, w, h, rot]) => {
    ctx.fillStyle = `hsl(${120 + Math.random() * 20},${40 + Math.random() * 15}%,${28 + Math.random() * 8}%)`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsl(${110 + Math.random() * 20},${30 + Math.random() * 10}%,${38 + Math.random() * 6}%)`;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.random() * 20 - 10,
      y + Math.random() * 20 - 10,
      w * 0.4,
      h * 0.4,
      rot + 0.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });

  const poleT = ctx.createLinearGradient(0, 0, 0, 90);
  poleT.addColorStop(0, "rgba(240,248,255,0.95)");
  poleT.addColorStop(1, "rgba(220,235,255,0)");
  ctx.fillStyle = poleT;
  ctx.fillRect(0, 0, 1024, 90);
  const poleB = ctx.createLinearGradient(0, 430, 0, 512);
  poleB.addColorStop(0, "rgba(220,235,255,0)");
  poleB.addColorStop(1, "rgba(240,248,255,0.95)");
  ctx.fillStyle = poleB;
  ctx.fillRect(0, 430, 1024, 82);
  return finish(c);
}

function cloudTexture() {
  const { c, ctx } = makeCtx(1024, 512);
  ctx.clearRect(0, 0, 1024, 512);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 1024,
      y = Math.random() * 512,
      r = Math.random() * 60 + 20;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.25 + Math.random() * 0.35})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.45, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c);
}

function moonTexture() {
  const { c, ctx } = makeCtx(512, 512);
  const bg = ctx.createRadialGradient(256, 200, 0, 256, 256, 320);
  bg.addColorStop(0, "#c8c8c8");
  bg.addColorStop(1, "#8a8a8a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 512,
      y = Math.random() * 512,
      r = Math.random() * 22 + 3;
    const cg = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
    cg.addColorStop(0, "rgba(60,60,60,0.8)");
    cg.addColorStop(0.6, "rgba(120,120,120,0.3)");
    cg.addColorStop(1, "rgba(190,190,190,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(220,220,220,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  }
  return finish(c);
}

function gasTexture(color: number) {
  const hexColor = hex(color);
  const { c, ctx } = makeCtx(1024, 512);
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, 1024, 512);
  const bands = 28;
  const r = (color >> 16) & 255,
    g = (color >> 8) & 255,
    b = color & 255;
  for (let i = 0; i < bands; i++) {
    const y = (i / bands) * 512;
    const bh = 6 + Math.random() * 24;
    const factor = 0.6 + Math.random() * 0.8;
    ctx.fillStyle = `rgba(${Math.min(255, r * factor)},${Math.min(255, g * factor)},${Math.min(255, b * factor)},${0.2 + Math.random() * 0.5})`;
    ctx.fillRect(0, y, 1024, bh);
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < 1024; x += 8) {
      const wy = y + Math.sin(x * 0.04) * 3;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  const sg = ctx.createRadialGradient(400, 280, 0, 400, 280, 55);
  sg.addColorStop(0, "rgba(200,100,60,0.7)");
  sg.addColorStop(1, "rgba(200,100,60,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(400, 280, 55, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  return finish(c);
}

function iceTexture() {
  const { c, ctx } = makeCtx(512, 512);
  const bg = ctx.createLinearGradient(0, 0, 512, 512);
  bg.addColorStop(0, "#0c5f8a");
  bg.addColorStop(0.5, "#1a91c8");
  bg.addColorStop(1, "#5ec4ef");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.18})`;
    ctx.lineWidth = Math.random() * 10 + 3;
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.bezierCurveTo(
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 512,
    );
    ctx.stroke();
  }
  const pole = ctx.createRadialGradient(256, 50, 0, 256, 80, 150);
  pole.addColorStop(0, "rgba(220,240,255,0.7)");
  pole.addColorStop(1, "rgba(220,240,255,0)");
  ctx.fillStyle = pole;
  ctx.fillRect(0, 0, 512, 200);
  return finish(c);
}

function rockyTexture() {
  const { c, ctx } = makeCtx(256, 256);
  ctx.fillStyle = "#4a6040";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 18 + 2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 8 + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c);
}

function terrestrialTexture(color: number) {
  const { c, ctx } = makeCtx(512, 512);
  ctx.fillStyle = hex(color);
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512,
      y = Math.random() * 512,
      rx = Math.random() * 40 + 5,
      ry = rx * (0.3 + Math.random() * 0.7);
    ctx.fillStyle =
      Math.random() > 0.5
        ? `rgba(0,0,0,${0.05 + Math.random() * 0.3})`
        : `rgba(255,255,255,${0.03 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c);
}

function starSurfaceTexture(color: number) {
  const { c, ctx } = makeCtx(512, 512);
  const baseR = (color >> 16) & 255,
    baseG = (color >> 8) & 255,
    baseB = color & 255;
  ctx.fillStyle = hex(color);
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 300; i++) {
    const bright = 0.8 + Math.random() * 0.5;
    ctx.fillStyle = `rgba(${Math.min(255, baseR * bright)},${Math.min(255, baseG * bright * 0.9)},${Math.min(255, baseB * bright * 0.6)},${0.2 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 18 + 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const center = ctx.createRadialGradient(256, 256, 0, 256, 256, 180);
  center.addColorStop(0, "rgba(255,255,240,0.6)");
  center.addColorStop(1, "rgba(255,255,240,0)");
  ctx.fillStyle = center;
  ctx.fillRect(0, 0, 512, 512);
  return finish(c);
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

function flareSprite(color: number) {
  const { c, ctx } = makeCtx(512, 512);
  const h = hex(color);
  const hg = ctx.createLinearGradient(0, 256, 512, 256);
  hg.addColorStop(0, "rgba(0,0,0,0)");
  hg.addColorStop(0.5, h + "cc");
  hg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hg;
  ctx.fillRect(0, 248, 512, 16);
  const vg = ctx.createLinearGradient(256, 0, 256, 512);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(0.5, h + "99");
  vg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vg;
  ctx.fillRect(248, 0, 16, 512);
  const core = ctx.createRadialGradient(256, 256, 0, 256, 256, 120);
  core.addColorStop(0, "rgba(255,255,255,0.85)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 512, 512);
  return finish(c);
}

function ringSprite(color: number) {
  const { c, ctx } = makeCtx(512, 64);
  const h = hex(color);
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.08, h + "aa");
  g.addColorStop(0.35, h + "44");
  g.addColorStop(0.5, h + "88");
  g.addColorStop(0.75, h + "33");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 64);
  return finish(c);
}

/* ── PUBLIC API ──────────────────────────────────────────── */

export function surfaceTexture(bodyType: BodyType, color: number): THREE.Texture {
  const key = `surface:${bodyType}:${color}`;
  return cached(key, () => {
    switch (bodyType) {
      case "earth":
        return earthTexture();
      case "moon":
        return moonTexture();
      case "rocky":
        return rockyTexture();
      case "ice":
        return iceTexture();
      case "gas":
        return gasTexture(color);
      case "terrestrial":
        return terrestrialTexture(color);
      default:
        return starSurfaceTexture(color);
    }
  });
}

export const clouds = () => cached("clouds", cloudTexture);
export const glow = (color: number) => cached(`glow:${color}`, () => glowSprite(color));
export const flare = (color: number) => cached(`flare:${color}`, () => flareSprite(color));
export const ring = (color: number) => cached(`ring:${color}`, () => ringSprite(color));
