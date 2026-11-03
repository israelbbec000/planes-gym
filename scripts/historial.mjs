#!/usr/bin/env node
// Registro en episodios/historial.csv  (slug,tema,fecha,duracion_s,estado)
//   node scripts/historial.mjs add <slug> "<tema>"
//   node scripts/historial.mjs set <slug> <estado> [duracion_s]
//   node scripts/historial.mjs list
import fs from 'node:fs';
import path from 'node:path';
import {EPISODIOS, args, hoy} from './lib.mjs';

const CSV = path.join(EPISODIOS, 'historial.csv');
const CAB = ['slug', 'tema', 'fecha', 'duracion_s', 'estado'];
export const ESTADOS = [
  'idea', 'guion_pendiente', 'guion_aprobado', 'voz_lista', 'arte_listo', 'animado',
  'editado', 'revisado', 'aprobado_publicacion', 'borrador_tiktok', 'publicado', 'rechazado',
];

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
function parsear(linea) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (q) { if (c === '"' && linea[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out;
}
export function leer() {
  if (!fs.existsSync(CSV)) return [];
  return fs.readFileSync(CSV, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => {
    const c = parsear(l); return Object.fromEntries(CAB.map((k, i) => [k, c[i] ?? '']));
  });
}
export function guardar(filas) {
  fs.mkdirSync(EPISODIOS, {recursive: true});
  fs.writeFileSync(CSV, CAB.join(',') + '\n' + filas.map((f) => CAB.map((k) => esc(f[k])).join(',')).join('\n') + (filas.length ? '\n' : ''));
}
export function agregar(slug, tema) {
  const f = leer().filter((x) => x.slug !== slug);
  f.push({slug, tema, fecha: hoy(), duracion_s: '', estado: 'idea'});
  guardar(f);
}
export function cambiarEstado(slug, estado, duracion) {
  if (!ESTADOS.includes(estado)) throw new Error(`Estado inválido "${estado}". Válidos: ${ESTADOS.join(', ')}`);
  const f = leer(); const x = f.find((r) => r.slug === slug);
  if (!x) throw new Error(`No está en historial: ${slug}`);
  x.estado = estado; if (duracion) x.duracion_s = String(duracion);
  guardar(f);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const {pos} = args(); const [cmd, ...r] = pos;
  if (cmd === 'add') { agregar(r[0], r[1] ?? r[0]); console.log('Agregado', r[0]); }
  else if (cmd === 'set') { cambiarEstado(r[0], r[1], r[2]); console.log(`${r[0]} → ${r[1]}`); }
  else if (cmd === 'list') { console.table(leer()); }
  else { console.log('Uso: add <slug> "<tema>" | set <slug> <estado> [duracion_s] | list'); process.exit(1); }
}
