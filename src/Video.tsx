import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Frase, PropsEpisodio} from './tipos';
import {Personaje} from './Personaje';
import {Grafica} from './Grafica';
import {Subtitulos} from './Subtitulos';
import {Titulo} from './Titulo';
import {COLORES, clamp, easeInOut, easeOut, lerp} from './util';

const WIPE_IN = 6;
const WIPE_OUT = 9;

function camara(f: Frase, local: number, dur: number): React.CSSProperties {
  const c = f.camara ?? {tipo: 'zoom', desde: 1, hasta: 1.06}; // movimiento mínimo por defecto: nada queda estático
  const p = easeInOut(clamp(local / Math.max(1, dur)));
  const foco = c.foco ?? [540, 960];
  if (c.tipo === 'paneo') {
    const d = c.desde ?? -60, h = c.hasta ?? 60;
    const z = Math.max(c.zoom ?? 1.12, 1 + (2 * Math.max(Math.abs(d), Math.abs(h))) / 1080);
    return {transform: `translateX(${lerp(d, h, p)}px) scale(${z})`, transformOrigin: '50% 50%'};
  }
  if (c.tipo === 'fija') return {};
  return {transform: `scale(${lerp(c.desde ?? 1, c.hasta ?? 1.15, p)})`, transformOrigin: `${foco[0]}px ${foco[1]}px`};
}

export const Video: React.FC<PropsEpisodio> = (props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {frases} = props;
  let i = frases.findIndex((f) => frame >= f.inicioFrame && frame < f.finFrame);
  if (i < 0) i = frame < 0 ? 0 : frases.length - 1;
  const f = frases[i];
  const local = frame - f.inicioFrame;
  const dur = f.finFrame - f.inicioFrame;
  const prev = frases[i - 1];
  const sig = frases[i + 1];
  const volumen = props.envolvente[frame] ?? 0;

  // Transición rápida "whip" cuando cambia de escena
  let wipeX: number | null = null;
  if (sig && sig.escena !== f.escena && frame >= f.finFrame - WIPE_IN) wipeX = interpolate(frame, [f.finFrame - WIPE_IN, f.finFrame], [1500, 0], {extrapolateRight: 'clamp'});
  else if (prev && prev.escena !== f.escena && local < WIPE_OUT) wipeX = interpolate(local, [0, WIPE_OUT], [0, -1500], {extrapolateRight: 'clamp'});

  // Pequeño "golpe" de zoom al inicio de cada frase (ritmo)
  const golpe = 1 + 0.035 * (1 - easeOut(clamp(local / 7)));

  return (
    <AbsoluteFill style={{backgroundColor: '#0B0B2E', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${golpe})`}}>
        <AbsoluteFill style={camara(f, local, dur)}>
          <Img src={staticFile(`fondos/${f.escena}.svg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
          {f.personajes.map((p, k) => (
            <Personaje key={`${f.id}-${p.id}-${k}`} p={p} local={local} frameAbs={frame} volumen={volumen} />
          ))}
          {f.grafica && <Grafica g={f.grafica} local={local} />}
        </AbsoluteFill>
      </AbsoluteFill>

      {wipeX !== null && (
        <div style={{position: 'absolute', top: -100, bottom: -100, width: 1500, left: wipeX, background: COLORES.morado, borderLeft: `14px solid ${COLORES.tinta}`, transform: 'skewX(-8deg)', boxShadow: '-30px 0 0 #3F7BF0'}} />
      )}

      <Titulo texto={props.titulo} />
      <Subtitulos palabras={props.palabras} porBloque={props.palabrasPorBloque} />
      <span style={{display: 'none'}}>{fps}</span>
    </AbsoluteFill>
  );
};
