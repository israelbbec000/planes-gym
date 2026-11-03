#!/usr/bin/env node
// node scripts/episodio.mjs nuevo "<tema>"   → crea episodios/AAAA-MM-DD-slug/ y lo registra
// node scripts/episodio.mjs temas             → lista los temas ya usados (para no repetir)
// node scripts/episodio.mjs estado <slug>     → estado del episodio
import fs from 'node:fs';
import path from 'node:path';
import {EPISODIOS, args, hoy, slugify, carpetaEpisodio} from './lib.mjs';
import {agregar, leer} from './historial.mjs';

const {pos} = args(); const [cmd, ...r] = pos;
if (cmd === 'nuevo') {
  const tema = r.join(' ').trim(); if (!tema) { console.error('Falta el tema'); process.exit(1); }
  const slug = `${hoy()}-${slugify(tema)}`;
  const dir = path.join(EPISODIOS, slug);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'idea.md'), `# ${tema}\n\n(pendiente: lo llena el investigador-ideas)\n`);
  agregar(slug, tema);
  console.log(slug);
} else if (cmd === 'temas') {
  const filas = leer();
  const carpetas = fs.existsSync(EPISODIOS) ? fs.readdirSync(EPISODIOS).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)) : [];
  const vistos = new Set();
  for (const f of filas) { vistos.add(f.slug); console.log(`- ${f.tema}  [${f.slug}, ${f.estado}]`); }
  for (const c of carpetas) if (!vistos.has(c)) console.log(`- (sin registro) ${c}`);
  if (!filas.length && !carpetas.length) console.log('(aún no hay episodios)');
} else if (cmd === 'estado') {
  const dir = carpetaEpisodio(r[0]);
  const f = leer().find((x) => x.slug === path.basename(dir));
  console.log(JSON.stringify({slug: path.basename(dir), ...f, archivos: fs.readdirSync(dir)}, null, 2));
} else { console.log('Uso: nuevo "<tema>" | temas | estado <slug>'); process.exit(1); }
