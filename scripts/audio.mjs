#!/usr/bin/env node
// Mezcla voz + música (con ducking) + efectos → audio_final.m4a, normalizado y sin saturar.
//   node scripts/audio.mjs <slug>      (requiere voz.mp3 y render-props.json)
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ, config, carpetaEpisodio, leerJson, args, ejecutar, duracionAudio} from './lib.mjs';

const {pos} = args();
const dir = carpetaEpisodio(pos[0]);
const cfg = config(); const a = cfg.audio;
const voz = path.join(dir, cfg.voz.archivo);
const props = leerJson(path.join(dir, 'render-props.json'));
const dur = props.duracionFrames / props.fps;
const musica = path.join(RAIZ, a.musica);
const sfxLista = props.sfx ?? [];

// Una entrada por efecto (ffmpeg no permite reutilizar una misma etiqueta de entrada)
const entradas = ['-i', voz, '-stream_loop', '-1', '-i', musica];
sfxLista.forEach((s) => entradas.push('-i', path.join(RAIZ, 'assets/sfx', `${s.nombre}.wav`)));

let g = '';
g += `[0:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=${a.volumen_voz},apad=whole_dur=${dur.toFixed(3)},asplit=2[v1][v2];`;
g += `[1:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:${dur.toFixed(3)},asetpts=N/SR/TB,volume=${a.volumen_musica},afade=t=in:d=1.5,afade=t=out:st=${(dur - 2.5).toFixed(2)}:d=2.5[m];`;
g += `[m][v2]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350[mduck];`;
const etiquetas = ['[v1]', '[mduck]'];
sfxLista.forEach((s, k) => {
  const ms = Math.round(s.t * 1000);
  g += `[${2 + k}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=${(a.volumen_sfx * (s.volumen ?? 1)).toFixed(3)},adelay=${ms}|${ms}[s${k}];`;
  etiquetas.push(`[s${k}]`);
});
g += `${etiquetas.join('')}amix=inputs=${etiquetas.length}:normalize=0:duration=longest,atrim=0:${dur.toFixed(3)},`
  + `loudnorm=I=${a.objetivo_lufs}:TP=${a.pico_maximo_dbfs - 0.5}:LRA=9,alimiter=limit=${Math.pow(10, a.pico_maximo_dbfs / 20).toFixed(3)}:level=disabled[out]`;
const gFix = g;

const salida = path.join(dir, 'audio_final.m4a');
ejecutar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', gFix, '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', salida]);
console.log(`✔ audio_final.m4a (${duracionAudio(salida).toFixed(1)} s, ${sfxLista.length} efectos, música a ${Math.round(a.volumen_musica * 100)}%)`);
