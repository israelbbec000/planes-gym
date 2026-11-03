#!/usr/bin/env node
// Render con Remotion.
//   node scripts/render.mjs <slug>                         → video_mudo.mp4 (+ final.mp4 si existe audio_final.m4a)
//   node scripts/render.mjs <slug> --stills                → PNG de cada frase (usa render-props.preview.json si no hay render-props.json)
//   node scripts/render.mjs <slug> --stills=120,900        → PNG de frames concretos
//   opciones: --escala=0.5 (borrador rápido), --props=archivo.json
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {RAIZ, config, carpetaEpisodio, leerJson, args, ejecutar} from './lib.mjs';

const {pos, flags} = args();
const dir = carpetaEpisodio(pos[0]);
const cfg = config();
const escala = flags.escala ? parseFloat(flags.escala) : 1;

let propsFile = flags.props ? path.resolve(flags.props) : path.join(dir, 'render-props.json');
if (!fs.existsSync(propsFile)) {
  const prev = path.join(dir, 'render-props.preview.json');
  if (flags.stills && fs.existsSync(prev)) propsFile = prev;
  else throw new Error(`Falta ${propsFile}. Corre scripts/sincronizar.mjs primero.`);
}
const inputProps = leerJson(propsFile);

const navegador = cfg.render.navegador ?? process.env.REMOTION_BROWSER ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : null);
const comun = {
  ...(navegador ? {browserExecutable: navegador} : {}),
  chromiumOptions: {disableWebSecurity: false, enableMultiProcessOnLinux: true},
  logLevel: 'error',
};

console.log('Empaquetando composición…');
const serveUrl = await bundle({
  entryPoint: path.join(RAIZ, 'src/index.ts'),
  publicDir: path.join(RAIZ, 'assets'),
});
const composition = await selectComposition({serveUrl, id: 'Episodio', inputProps, ...comun});

if (flags.stills) {
  const salida = path.join(dir, 'tmp', 'stills'); fs.mkdirSync(salida, {recursive: true});
  const frames = flags.stills === true
    ? inputProps.frases.map((f) => Math.round((f.inicioFrame + Math.min(f.finFrame - 1, f.inicioFrame + 45))))
    : String(flags.stills).split(',').map(Number);
  for (const fr of frames) {
    const out = path.join(salida, `frame-${String(fr).padStart(5, '0')}.png`);
    await renderStill({composition, serveUrl, output: out, frame: Math.min(fr, composition.durationInFrames - 1), inputProps, scale: escala, ...comun});
    console.log('  still', out);
  }
  process.exit(0);
}

const mudo = path.join(dir, 'video_mudo.mp4');
let ultimo = -1;
await renderMedia({
  composition, serveUrl, inputProps, codec: 'h264', outputLocation: mudo, crf: cfg.render.crf, scale: escala,
  imageFormat: 'jpeg', jpegQuality: 92, pixelFormat: 'yuv420p', muted: true,
  ...(cfg.render.concurrencia ? {concurrency: cfg.render.concurrencia} : {}),
  onProgress: ({progress}) => { const p = Math.floor(progress * 20); if (p !== ultimo) { ultimo = p; process.stdout.write(`\r  render ${p * 5}%   `); } },
  ...comun,
});
console.log('\n✔ video_mudo.mp4');

const audio = path.join(dir, 'audio_final.m4a');
if (fs.existsSync(audio) && escala === 1) {
  const final = path.join(dir, 'final.mp4');
  ejecutar('ffmpeg', ['-y', '-loglevel', 'error', '-i', mudo, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', '-shortest', final]);
  console.log('✔ final.mp4');
}
