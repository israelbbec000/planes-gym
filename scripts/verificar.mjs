#!/usr/bin/env node
// Comprobaciones técnicas de final.mp4. Sale con código ≠ 0 si algo falla.
//   node scripts/verificar.mjs <slug> [--json]
import fs from 'node:fs';
import path from 'node:path';
import {config, carpetaEpisodio, escribirJson, args, ejecutar} from './lib.mjs';

const {pos, flags} = args();
const dir = carpetaEpisodio(pos[0]);
const cfg = config();
const f = path.join(dir, 'final.mp4');
const res = {archivo: f, checks: [], ok: true};
const check = (nombre, ok, detalle, nivel = 'error') => { res.checks.push({nombre, ok, detalle, nivel}); if (!ok && nivel === 'error') res.ok = false; };

if (!fs.existsSync(f)) { check('existe final.mp4', false, 'no se encontró'); }
else {
  const p = JSON.parse(ejecutar('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', f]).stdout);
  const v = p.streams.find((s) => s.codec_type === 'video'), au = p.streams.find((s) => s.codec_type === 'audio');
  const dur = parseFloat(p.format.duration);
  res.duracion_s = +dur.toFixed(2);
  check('duración > 60 s', dur > cfg.video.duracion_minima_s, `${dur.toFixed(1)} s`);
  const [mn, mx] = cfg.video.duracion_objetivo_s;
  check(`duración en ${mn}-${mx} s`, dur >= mn && dur <= mx, `${dur.toFixed(1)} s`, 'aviso');
  check('resolución 1080x1920', v && v.width === cfg.video.ancho && v.height === cfg.video.alto, v ? `${v.width}x${v.height}` : 'sin video');
  check('códec H.264', v?.codec_name === 'h264', v?.codec_name ?? '-');
  check('tiene audio', !!au, au ? `${au.codec_name} ${au.sample_rate} Hz` : 'sin audio');
  if (v && au) check('audio y video con la misma duración (±0.5 s)', Math.abs(parseFloat(v.duration) - parseFloat(au.duration)) < 0.5, `${v.duration} vs ${au.duration}`);

  if (au) {
    const r = ejecutar('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-vn', '-af', 'astats=metadata=0:reset=0,ebur128=peak=true', '-f', 'null', '-'], {tolerante: true});
    const err = r.stderr;
    const pico = [...err.matchAll(/Peak level dB:\s*(-?[\d.]+|-inf)/g)].map((m) => parseFloat(m[1])).filter((n) => !isNaN(n));
    const picoMax = pico.length ? Math.max(...pico) : null;
    const clip = [...err.matchAll(/Number of clipped samples:\s*(\d+)/g)].map((m) => +m[1]);
    const lufs = [...err.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].map((m) => +m[1]).pop();
    const tp = [...err.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].map((m) => +m[1]).pop();
    res.audio = {pico_dbfs: picoMax, true_peak_dbfs: tp, lufs, muestras_saturadas: clip.length ? Math.max(...clip) : 0};
    check('audio sin saturación (pico ≤ -0.5 dBFS)', picoMax !== null && picoMax <= -0.5, `pico ${picoMax} dBFS`);
    check('sin muestras recortadas', !clip.some((n) => n > 0), `${clip.length ? Math.max(...clip) : 0} muestras`);
    check('volumen razonable (-20 a -12 LUFS)', lufs !== undefined && lufs > -20 && lufs < -12, `${lufs} LUFS`, 'aviso');
  }
  const pr = path.join(dir, 'render-props.json');
  if (fs.existsSync(pr)) {
    const props = JSON.parse(fs.readFileSync(pr, 'utf8'));
    check('timestamps de whisper reales', props.fuenteTiempos === 'whisper', `fuente: ${props.fuenteTiempos}`, 'aviso');
  }
  check('voz real (no placeholder)', !fs.existsSync(path.join(dir, 'voz.placeholder')), 'existe voz.placeholder', 'aviso');
}
escribirJson(path.join(dir, 'tmp', 'verificacion.json'), res);
if (flags.json) console.log(JSON.stringify(res, null, 2));
else {
  for (const c of res.checks) console.log(`${c.ok ? '✔' : c.nivel === 'aviso' ? '⚠' : '✖'} ${c.nombre} — ${c.detalle}`);
  console.log(res.ok ? '\nRESULTADO: OK' : '\nRESULTADO: FALLA');
}
process.exit(res.ok ? 0 : 1);
