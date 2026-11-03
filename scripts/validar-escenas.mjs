#!/usr/bin/env node
// Valida guion.md / escenas.json de un episodio: palabras, estructura y que existan fondos, personajes y sfx.
//   node scripts/validar-escenas.mjs <slug>
import fs from 'node:fs';
import path from 'node:path';
import {config, carpetaEpisodio, leerJson, textoNarrado, contarPalabras, args, RAIZ} from './lib.mjs';

const {pos} = args();
const dir = carpetaEpisodio(pos[0]);
const cfg = config();
const errores = [], avisos = [];
const E = (m) => errores.push(m), A = (m) => avisos.push(m);

const ACCIONES = ['idle', 'saluda', 'sorpresa', 'grita', 'corre', 'cae', 'senala', 'piensa', 'feliz', 'caido'];
const POS = ['izq', 'centro', 'der'];
const CAMARAS = ['fija', 'zoom', 'paneo'];

const ls = (d, ext) => fs.existsSync(path.join(RAIZ, d)) ? fs.readdirSync(path.join(RAIZ, d)).filter((f) => f.endsWith(ext)).map((f) => f.replace(ext, '')) : [];
const fondos = ls('assets/fondos', '.svg');
const personajes = fs.readdirSync(path.join(RAIZ, 'assets/personajes'), {withFileTypes: true}).filter((d) => d.isDirectory()).map((d) => d.name);
const sfxs = ls('assets/sfx', '.wav');

const fEsc = path.join(dir, 'escenas.json');
if (!fs.existsSync(fEsc)) { console.error('Falta escenas.json'); process.exit(1); }
const esc = leerJson(fEsc);
if (!esc.titulo) E('Falta "titulo"');
if (!Array.isArray(esc.frases) || !esc.frases.length) E('"frases" vacío');

const palabras = contarPalabras(textoNarrado(esc));
if (palabras < cfg.guion.palabras_min || palabras > cfg.guion.palabras_max)
  E(`El guion tiene ${palabras} palabras; debe estar entre ${cfg.guion.palabras_min} y ${cfg.guion.palabras_max}`);

const fGuion = path.join(dir, 'guion.md');
if (!fs.existsSync(fGuion)) E('Falta guion.md');
else {
  const g = fs.readFileSync(fGuion, 'utf8');
  const narr = g.split('\n').filter((l) => l.trim() && !/^(#|>|---|<!--|\*\*|-\s*\[)/.test(l.trim())).join(' ');
  const pg = contarPalabras(narr);
  if (Math.abs(pg - palabras) > 3) E(`guion.md (${pg} palabras) no coincide con escenas.json (${palabras})`);
}

(esc.frases ?? []).forEach((f, i) => {
  const p = `frase ${f.id ?? i + 1}`;
  if (f.id !== i + 1) E(`${p}: los id deben ser consecutivos desde 1 (esperaba ${i + 1})`);
  if (!f.texto?.trim()) E(`${p}: sin texto`);
  if (!fondos.includes(f.escena)) E(`${p}: fondo "${f.escena}" no existe en assets/fondos (hay: ${fondos.join(', ')})`);
  if (!Array.isArray(f.personajes)) E(`${p}: "personajes" debe ser lista (puede ser vacía)`);
  (f.personajes ?? []).forEach((c) => {
    if (!personajes.includes(c.id)) E(`${p}: personaje "${c.id}" no existe (hay: ${personajes.join(', ')})`);
    if (c.pos && !POS.includes(c.pos)) E(`${p}: pos "${c.pos}" inválida (${POS.join('|')})`);
    if (c.accion && !ACCIONES.includes(c.accion)) E(`${p}: acción "${c.accion}" no soportada (${ACCIONES.join('|')})`);
  });
  if (f.camara && !CAMARAS.includes(f.camara.tipo)) E(`${p}: cámara "${f.camara.tipo}" inválida (${CAMARAS.join('|')})`);
  for (const s of f.sfx ?? []) { const n = typeof s === 'string' ? s : s.nombre; if (!sfxs.includes(n)) E(`${p}: sfx "${n}" no existe (hay: ${sfxs.join(', ')})`); }
  if (f.grafica) {
    const g = f.grafica;
    if (!Array.isArray(g.valores) || g.valores.length !== g.etiquetas?.length) E(`${p}: grafica.valores y etiquetas deben tener la misma longitud`);
  }
  const palabrasF = f.texto ? contarPalabras(f.texto) : 0;
  if (palabrasF > 22) A(`${p}: ${palabrasF} palabras en una sola frase (conviene partirla)`);
  for (const c of f.claves ?? []) {
    const t = typeof c === 'string' ? c : c.texto;
    if (!f.texto.toLowerCase().includes(t.toLowerCase())) E(`${p}: la clave "${t}" no aparece en el texto`);
  }
});

// Gancho: primeros ~2 s ≈ primeras 5-6 palabras en la primera frase
if (esc.frases?.[0] && contarPalabras(esc.frases[0].texto) > 9) A('La primera frase es larga para un gancho de 2 s (ideal ≤ 8 palabras)');

avisos.forEach((m) => console.log('⚠ ', m));
errores.forEach((m) => console.log('✖ ', m));
console.log(errores.length ? `\n${errores.length} error(es)` : `✔ Válido: ${esc.frases.length} frases, ${palabras} palabras`);
process.exit(errores.length ? 1 : 0);
