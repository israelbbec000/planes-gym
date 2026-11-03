#!/usr/bin/env node
// Une escenas.json + palabras.json (whisper) + envolvente de audio → render-props.json
// que consume la composición de Remotion.
//   node scripts/sincronizar.mjs <slug>              (con voz.mp3 + palabras.json)
//   node scripts/sincronizar.mjs <slug> --sin-audio  (tiempos estimados por texto; para previsualizar el arte)
import fs from 'node:fs';
import path from 'node:path';
import {config, carpetaEpisodio, leerJson, escribirJson, norm, args, ejecutar, RAIZ} from './lib.mjs';

const {pos, flags} = args();
const dir = carpetaEpisodio(pos[0]);
const cfg = config();
const fps = cfg.video.fps;
const escenas = leerJson(path.join(dir, 'escenas.json'));

// 1) Tokens del guion (con su frase)
const tokens = [];
escenas.frases.forEach((f, fi) => {
  for (const t of f.texto.trim().split(/\s+/)) if (/[\p{L}\p{N}]/u.test(t)) tokens.push({texto: t, n: norm(t), frase: fi});
});

// 2) Tiempos por palabra
let fuente, audioDur = null;
const archivoVoz = path.join(dir, cfg.voz.archivo);
if (flags['sin-audio'] || !fs.existsSync(path.join(dir, 'palabras.json'))) {
  if (!flags['sin-audio']) throw new Error('Falta palabras.json. Corre primero: python3 scripts/transcribir.py ' + dir);
  fuente = 'sin-audio';
  let t = 0.25;
  for (const k of tokens) {
    const d = 0.13 + 0.055 * k.n.length;
    k.inicio = t; k.fin = t + d * 0.92; t += d + (/[.?!]$/.test(k.texto) ? 0.35 : /[,;:]$/.test(k.texto) ? 0.15 : 0);
  }
} else {
  const pj = leerJson(path.join(dir, 'palabras.json'));
  fuente = pj.fuente;
  const W = pj.palabras.map((p) => ({...p, n: norm(p.texto)})).filter((p) => p.n);
  // LCS sobre palabras normalizadas
  const n = tokens.length, m = W.length;
  const dp = Array.from({length: n + 1}, () => new Int16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = tokens[i].n === W[j].n ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (tokens[i].n === W[j].n) { tokens[i].inicio = W[j].inicio; tokens[i].fin = W[j].fin; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  const calzadas = tokens.filter((t) => t.inicio !== undefined).length;
  console.log(`Alineación: ${calzadas}/${n} palabras del guion calzan con la transcripción (${fuente})`);
  // Interpolar las que no calzaron
  const ancla = tokens.map((t, i) => (t.inicio !== undefined ? i : -1)).filter((i) => i >= 0);
  if (!ancla.length) throw new Error('Ninguna palabra del guion coincide con la transcripción. ¿Es el audio correcto?');
  const reparte = (desde, hasta, t0, t1) => {
    const peso = []; let s = 0;
    for (let i = desde; i <= hasta; i++) { const w = tokens[i].n.length + 1.5; peso.push(w); s += w; }
    let c = t0; for (let i = desde; i <= hasta; i++) {
      const d = ((t1 - t0) * peso[i - desde]) / s; tokens[i].inicio = c; tokens[i].fin = c + d * 0.92; c += d;
    }
  };
  if (ancla[0] > 0) { const t1 = tokens[ancla[0]].inicio; reparte(0, ancla[0] - 1, Math.max(0, t1 - 0.09 * ancla[0] * 2), t1); }
  for (let a = 0; a < ancla.length - 1; a++)
    if (ancla[a + 1] - ancla[a] > 1) reparte(ancla[a] + 1, ancla[a + 1] - 1, tokens[ancla[a]].fin, tokens[ancla[a + 1]].inicio);
  const ult = ancla[ancla.length - 1];
  if (ult < n - 1) reparte(ult + 1, n - 1, tokens[ult].fin, tokens[ult].fin + 0.2 * (n - 1 - ult));
}

// 3) Línea de tiempo de frases (cada frase dura hasta que empieza la siguiente)
const primeraPorFrase = escenas.frases.map((_, fi) => tokens.find((t) => t.frase === fi));
const inicioF = primeraPorFrase.map((t, i) => (i === 0 ? 0 : t.inicio));
const ultimoFin = tokens[tokens.length - 1].fin;
if (fs.existsSync(archivoVoz) && fuente !== 'sin-audio') {
  audioDur = parseFloat(ejecutar('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivoVoz]).stdout);
}
const duracionS = Math.max(ultimoFin, audioDur ?? 0) + cfg.video.cola_final_s;
const duracionFrames = Math.ceil(duracionS * fps);
const frases = escenas.frases.map((f, i) => {
  const fin = i < escenas.frases.length - 1 ? inicioF[i + 1] : duracionS;
  return {
    ...f,
    inicioFrame: Math.round(inicioF[i] * fps),
    finFrame: i < escenas.frases.length - 1 ? Math.round(fin * fps) : duracionFrames,
  };
});

// 4) Palabras clave
const claves = new Map();
escenas.frases.forEach((f, fi) => (f.claves ?? []).forEach((c) => {
  const o = typeof c === 'string' ? {texto: c} : c;
  for (const w of o.texto.split(/\s+/)) claves.set(`${fi}:${norm(w)}`, o.color ?? cfg.subtitulos.color_clave_defecto);
}));
const palabras = tokens.map((t) => ({
  texto: t.texto, inicio: +t.inicio.toFixed(3), fin: +t.fin.toFixed(3), frase: t.frase,
  clave: claves.get(`${t.frase}:${t.n}`) ?? null,
}));

// 5) Envolvente de volumen para la boca
let envolvente;
if (fs.existsSync(archivoVoz) && !flags['sin-audio']) {
  const tmp = path.join(dir, 'tmp'); fs.mkdirSync(tmp, {recursive: true});
  const salida = path.join(tmp, 'envolvente.json');
  ejecutar('python3', [path.join(RAIZ, 'scripts/analizar_audio.py'), archivoVoz, '--fps', String(fps), '--salida', salida]);
  envolvente = leerJson(salida).valores;
} else {
  // sintética: la boca "habla" durante cada palabra
  envolvente = Array.from({length: duracionFrames}, (_, f) => {
    const t = f / fps; const p = palabras.find((w) => t >= w.inicio && t <= w.fin);
    return p ? 0.45 + 0.5 * Math.abs(Math.sin(f * 1.7)) : 0;
  });
}

// 6) Efectos de sonido
const sfx = [];
frases.forEach((f, i) => (f.sfx ?? []).forEach((s) => {
  const o = typeof s === 'string' ? {nombre: s} : s;
  const t = inicioF[i] + (o.offset ?? 0);
  if (t < duracionS - 0.3) sfx.push({nombre: o.nombre, t: +t.toFixed(3), volumen: o.volumen ?? 1});
}));

const props = {
  titulo: escenas.titulo, fps, ancho: cfg.video.ancho, alto: cfg.video.alto,
  duracionFrames, fuenteTiempos: fuente, palabrasPorBloque: cfg.subtitulos.palabras_por_bloque,
  frases, palabras, envolvente, sfx,
};
const out = flags['sin-audio'] ? 'render-props.preview.json' : 'render-props.json';
escribirJson(path.join(dir, out), props);
console.log(`✔ ${out}: ${frases.length} frases, ${palabras.length} palabras, ${(duracionFrames / fps).toFixed(1)} s, ${sfx.length} sfx`);
