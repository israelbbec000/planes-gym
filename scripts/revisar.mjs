#!/usr/bin/env node
// Reúne hechos objetivos para el revisor → tmp/revision-datos.json
//   node scripts/revisar.mjs <slug>
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ, carpetaEpisodio, leerJson, escribirJson, textoNarrado, contarPalabras, norm, args} from './lib.mjs';

const {pos} = args();
const dir = carpetaEpisodio(pos[0]);
const esc = leerJson(path.join(dir, 'escenas.json'));
const texto = textoNarrado(esc);
const out = {titulo: esc.titulo, palabras: contarPalabras(texto), frases: esc.frases.length};

const unicas = [...new Set(texto.split(/\s+/).map((w) => w.replace(/^[¿¡"«(]+|[.,;:?!"»)…]+$/g, '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
out.palabras_unicas = unicas;
out.cifras_en_guion = [...texto.matchAll(/\b(?:\d[\d.,]*|(?:uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|trece|catorce|veintitrés|veintiocho|treinta|cincuenta|setenta|ochocientos|cuatrocientos|mil|millones?)\b)/gi)].map((m) => m[0]);

// Assets usados y su cobertura de licencia
const usados = new Set();
esc.frases.forEach((f) => { usados.add(`fondos/${f.escena}.svg`); f.personajes.forEach((p) => usados.add(`personajes/${p.id}/`)); (f.sfx ?? []).forEach((s) => usados.add(`sfx/${typeof s === 'string' ? s : s.nombre}.wav`)); });
usados.add('musica/loop_curioso.wav');
const lic = fs.readFileSync(path.join(RAIZ, 'assets/LICENCIAS.md'), 'utf8');
out.assets_usados = [...usados].map((a) => ({asset: a, existe: fs.existsSync(path.join(RAIZ, 'assets', a)), cubierto_por_licencia: /assets\/(sfx|musica|personajes|fondos|graficas)/.test(lic) && /CC0/.test(lic)}));

// Términos sospechosos de marca/copyright en texto y en SVG
const SOSPECHOSOS = ['mickey', 'disney', 'pixar', 'marvel', 'pokemon', 'pikachu', 'mario', 'nintendo', 'minecraft', 'spiderman', 'batman', 'superman', 'goku', 'dragon ball', 'simpson', 'peppa', 'bluey', 'coca-cola', 'netflix', 'youtube', 'tiktok'];
const alerta = [];
const buscar = (nombre, t) => SOSPECHOSOS.forEach((s) => { if (norm(t).includes(norm(s))) alerta.push(`${nombre}: contiene "${s}"`); });
buscar('guion', texto + ' ' + esc.titulo);
const recorre = (d) => fs.readdirSync(d, {withFileTypes: true}).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) recorre(p); else if (e.name.endsWith('.svg') || e.name.endsWith('.md')) buscar(path.relative(RAIZ, p), fs.readFileSync(p, 'utf8')); });
recorre(path.join(RAIZ, 'assets'));
out.terminos_sospechosos = alerta;

const props = path.join(dir, 'render-props.json');
if (fs.existsSync(props)) { const p = leerJson(props); out.fuente_timestamps = p.fuenteTiempos; out.duracion_estimada_s = +(p.duracionFrames / p.fps).toFixed(1); }
out.voz_placeholder = fs.existsSync(path.join(dir, 'voz.placeholder'));
escribirJson(path.join(dir, 'tmp', 'revision-datos.json'), out);
console.log(`✔ tmp/revision-datos.json — ${out.palabras} palabras, ${unicas.length} únicas, ${alerta.length} términos sospechosos, timestamps: ${out.fuente_timestamps ?? 'n/d'}, placeholder: ${out.voz_placeholder}`);
