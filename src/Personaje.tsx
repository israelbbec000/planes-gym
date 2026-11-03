import React from 'react';
import {Img, spring, staticFile, useVideoConfig} from 'remotion';
import type {Accion, PersonajeEscena} from './tipos';
import {POS_X, PERSONAJE_H, PERSONAJE_W, SUELO_Y, clamp} from './util';

const PIVOTE_I = '26.25% 53.1%'; // (105,340) en viewBox 400x640
const PIVOTE_D = '73.75% 53.1%'; // (295,340)

interface Pose {
  armI: number; armD: number; dy: number; dx: number; rot: number; ojos: 'abiertos' | 'cerrados' | 'sorpresa'; bocaFija?: 0 | 1 | 2 | 3;
}

function pose(accion: Accion, t: number): Pose {
  const base: Pose = {armI: 0, armD: 0, dy: 0, dx: 0, rot: 0, ojos: 'abiertos'};
  const w = (hz: number, amp: number, fase = 0) => Math.sin(t * Math.PI * 2 * hz + fase) * amp;
  switch (accion) {
    case 'saluda': return {...base, armD: -150 + w(2.2, 22), armI: w(0.8, 4)};
    case 'sorpresa': {
      const salto = Math.max(0, Math.sin(clamp(t * 2.2, 0, 1) * Math.PI)) * 55;
      return {...base, armI: 135 + w(1, 6), armD: -135 - w(1, 6), dy: -salto, ojos: 'sorpresa', bocaFija: 3};
    }
    case 'grita': return {...base, armI: 150 + w(3, 10), armD: -150 - w(3, 10), dx: w(9, 5), ojos: 'sorpresa'};
    case 'corre': return {...base, armI: w(2.6, 55), armD: -w(2.6, 55), dy: -Math.abs(w(2.6, 26)), rot: w(2.6, 5)};
    case 'cae': { const p = clamp(t / 1.2); return {...base, rot: 82 * p * p, armI: 70 * p, armD: -70 * p, dy: 90 * p, ojos: 'sorpresa', bocaFija: 3}; }
    case 'caido': return {...base, rot: 82, armI: 70, armD: -70, dy: 90, ojos: 'cerrados', bocaFija: 1};
    case 'senala': return {...base, armD: -128 + w(1.2, 4), armI: w(0.8, 3)};
    case 'piensa': return {...base, armD: -18, rot: w(0.5, 3), dy: w(0.8, 3)};
    case 'feliz': return {...base, armI: 30 + w(1.8, 24), armD: -30 - w(1.8, 24), dy: -Math.abs(w(1.8, 16)), ojos: 'cerrados'};
    default: return {...base, armI: w(0.7, 3), armD: -w(0.7, 3)};
  }
}

export const Personaje: React.FC<{
  p: PersonajeEscena; local: number; frameAbs: number; volumen: number;
}> = ({p, local, frameAbs, volumen}) => {
  const {fps} = useVideoConfig();
  const t = local / fps;
  const accion = p.accion ?? 'idle';
  const escala = p.escala ?? 1;
  const cx = POS_X[p.pos ?? 'centro'];
  const ps = pose(accion, t);

  // Rebote de entrada (squash & stretch con resorte) + rebote suave continuo
  const entrada = spring({frame: local, fps, config: {damping: 7, stiffness: 190, mass: 0.7}});
  const sy = 0.72 + 0.28 * entrada;
  const sx = 1.22 - 0.22 * entrada;
  const bob = accion === 'idle' || accion === 'piensa' ? -Math.abs(Math.sin(t * Math.PI * 1.6)) * 9 : 0;
  const respiro = 1 + Math.sin(t * Math.PI * 3.2) * 0.012;

  // Parpadeo cada ~3 s
  const parpadea = ps.ojos === 'abiertos' && frameAbs % Math.round(fps * 3.1) < 4;
  const ojos = parpadea ? 'cerrados' : ps.ojos;

  // Boca sincronizada al volumen
  let boca: 0 | 1 | 2 | 3 = ps.bocaFija ?? 0;
  if (p.habla) boca = volumen < 0.14 ? 0 : volumen < 0.42 ? 1 : 2;
  else if (ps.bocaFija === undefined && (accion === 'feliz')) boca = 2;

  const dir = p.espejo ? -1 : 1;
  const capa: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'};
  const f = (n: string) => staticFile(`personajes/${p.id}/${n}.svg`);

  return (
    <div
      style={{
        position: 'absolute', left: cx - PERSONAJE_W / 2 + ps.dx, top: SUELO_Y - PERSONAJE_H + 8,
        width: PERSONAJE_W, height: PERSONAJE_H, transformOrigin: '50% 100%',
        transform: `translateY(${ps.dy + bob}px) rotate(${ps.rot * dir}deg) scale(${sx * escala * dir * respiro}, ${sy * escala})`,
      }}
    >
      <div style={{...capa, transformOrigin: PIVOTE_I, transform: `rotate(${ps.armI}deg)`}}><Img src={f('brazo_i')} style={capa} /></div>
      <Img src={f('cuerpo')} style={capa} />
      <div style={{...capa, transformOrigin: PIVOTE_D, transform: `rotate(${ps.armD}deg)`}}><Img src={f('brazo_d')} style={capa} /></div>
      <Img src={f(`ojos_${ojos}`)} style={capa} />
      <Img src={f(`boca_${boca}`)} style={capa} />
    </div>
  );
};
