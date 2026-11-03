import React from 'react';
import {Img, spring, staticFile, useVideoConfig} from 'remotion';
import type {Grafica as G} from './tipos';
import {COLORES, FUENTE} from './util';

export const Grafica: React.FC<{g: G; local: number}> = ({g, local}) => {
  const {fps} = useVideoConfig();
  const max = Math.max(...g.valores);
  const n = g.valores.length;
  const x0 = 100, ancho = 730, base = 470, alto = 340;
  const paso = ancho / n, bw = paso * 0.7;
  const panel = spring({frame: local, fps, config: {damping: 11, stiffness: 160}});
  const fmt = (v: number, i: number) => g.textos?.[i] ?? `${v}${g.unidad ? ' ' + g.unidad : ''}`;
  return (
    <div style={{position: 'absolute', left: 90, top: 440, width: 900, height: 560, transform: `scale(${0.6 + 0.4 * panel})`, opacity: Math.min(1, panel * 1.4), transformOrigin: '50% 50%'}}>
      <Img src={staticFile('graficas/marco.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
      <svg viewBox="0 0 900 560" width={900} height={560} style={{position: 'absolute', inset: 0}}>
        {g.titulo && <text x={450} y={58} textAnchor="middle" fontFamily={FUENTE} fontWeight={900} fontSize={34} fill={COLORES.moradoOsc}>{g.titulo}</text>}
        {g.valores.map((v, i) => {
          const s = spring({frame: local - 6 - i * 5, fps, config: {damping: 9, stiffness: 150, mass: 0.8}});
          const h = Math.max(4, (v / max) * alto * Math.max(0, s));
          const x = x0 + i * paso + (paso - bw) / 2;
          return (
            <g key={i}>
              <rect x={x} y={base - h} width={bw} height={h} rx={8} fill={i % 2 ? COLORES.morado : COLORES.azul} stroke={COLORES.tinta} strokeWidth={6} />
              {s > 0.6 && <text x={x + bw / 2} y={base - h - 12} textAnchor="middle" fontFamily={FUENTE} fontWeight={900} fontSize={n > 6 ? 22 : 26} fill={COLORES.tinta}>{fmt(v, i)}</text>}
              <text x={x + bw / 2} y={base + 40} textAnchor="middle" fontFamily={FUENTE} fontWeight={800} fontSize={28} fill={COLORES.tinta}>{g.etiquetas[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
