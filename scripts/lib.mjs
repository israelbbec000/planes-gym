// Utilidades compartidas por todos los scripts.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EPISODIOS = path.join(RAIZ, 'episodios');

export function cargarEnv() {
  const f = path.join(RAIZ, '.env');
  if (!fs.existsSync(f)) return;
  for (const linea of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !linea.trim().startsWith('#') && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

export function config() {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, 'config.json'), 'utf8'));
}

export function leerJson(f) {
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
export function escribirJson(f, o) {
  fs.mkdirSync(path.dirname(f), {recursive: true});
  fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');
}

/** Resuelve un slug (o ruta) a la carpeta del episodio. */
export function carpetaEpisodio(arg) {
  if (!arg) throw new Error('Falta el slug del episodio (ej. 2026-11-03-mi-tema)');
  const p = fs.existsSync(arg) ? path.resolve(arg) : path.join(EPISODIOS, arg);
  if (!fs.existsSync(p)) throw new Error(`No existe el episodio: ${p}`);
  return p;
}

export function slugify(t) {
  return t
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[¿?¡!.,;:"']/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .split('-').slice(0, 9).join('-').slice(0, 48);
}

/** Normaliza una palabra para comparar (sin acentos, sin puntuación, minúsculas). */
export function norm(p) {
  return p.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9ñ]/g, '');
}

export function ejecutar(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts});
  if (r.error) throw r.error;
  if (r.status !== 0 && !opts.tolerante) {
    throw new Error(`${cmd} ${args.slice(0, 6).join(' ')}… falló (${r.status}):\n${(r.stderr || '').slice(-2000)}`);
  }
  return r;
}

export function duracionAudio(f) {
  const r = ejecutar('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]);
  return parseFloat(r.stdout.trim());
}

export function hoy() {
  // Fecha local (AAAA-MM-DD)
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function args(argv = process.argv.slice(2)) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[k] = argv[++i];
      else flags[k] = true;
    } else pos.push(a);
  }
  return {pos, flags};
}

/** Extrae el texto narrado de escenas.json (fuente de verdad del guion). */
export function textoNarrado(escenas) {
  return escenas.frases.map((f) => f.texto.trim()).join(' ');
}
export function contarPalabras(t) {
  return t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
