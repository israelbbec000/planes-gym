import React, {useMemo} from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Palabra} from './tipos';
import {COLORES, FUENTE} from './util';

interface Bloque {palabras: Palabra[]; inicio: number; fin: number}

const limpiar = (t: string) => t.replace(/[,;:.…"«»()]/g, '').replace(/^¡/, '¡');

function armarBloques(ps: Palabra[], max: number): Bloque[] {
  const out: Bloque[] = [];
  let cur: Palabra[] = [];
  const cerrar = () => { if (cur.length) { out.push({palabras: cur, inicio: cur[0].inicio, fin: cur[cur.length - 1].fin}); cur = []; } };
  ps.forEach((p, i) => {
    if (cur.length && (cur.length >= max || p.frase !== cur[0].frase)) cerrar();
    cur.push(p);
    if (/[.?!]$/.test(p.texto) || (/,$/.test(p.texto) && cur.length >= 2)) cerrar();
    void i;
  });
  cerrar();
  return out;
}

export const Subtitulos: React.FC<{palabras: Palabra[]; porBloque: number}> = ({palabras, porBloque}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const bloques = useMemo(() => armarBloques(palabras, porBloque), [palabras, porBloque]);

  // bloque actual: el último que ya empezó; se mantiene hasta que empieza el siguiente (máx. 0.6 s tras su fin)
  let idx = -1;
  for (let i = 0; i < bloques.length; i++) if (t >= bloques[i].inicio - 0.02) idx = i; else break;
  if (idx < 0) return null;
  const b = bloques[idx];
  const sig = bloques[idx + 1];
  if (t > b.fin + 0.6 && (!sig || sig.inicio - t > 0.0)) { if (!sig || t < sig.inicio) return null; }

  const chars = b.palabras.reduce((a, p) => a + limpiar(p.texto).length, 0) + b.palabras.length - 1;
  const size = Math.round(Math.max(88, Math.min(128, 138 - Math.max(0, chars - 8) * 3.6)));

  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1290, height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: `0 ${Math.round(size * 0.24)}px`, textAlign: 'center'}}>
      {b.palabras.map((p, i) => {
        const visible = t >= p.inicio - 0.02;
        if (!visible) return null;
        const activa = t >= p.inicio && (i === b.palabras.length - 1 || t < b.palabras[i + 1].inicio);
        const pop = spring({frame: Math.max(0, Math.round((t - p.inicio) * fps)), fps, config: {damping: 9, stiffness: 260, mass: 0.6}});
        const color = p.clave === 'rojo' ? COLORES.rojo : p.clave ? COLORES.amarillo : COLORES.blanco;
        return (
          <span
            key={i}
            style={{
              fontFamily: FUENTE, fontWeight: 900, fontSize: size, lineHeight: 1.12, textTransform: 'uppercase', color,
              WebkitTextStroke: `${Math.round(size * 0.14)}px ${COLORES.tinta}`, paintOrder: 'stroke fill', letterSpacing: 1,
              opacity: visible ? 1 : 0, display: 'inline-block',
              transform: `scale(${visible ? (activa ? 0.82 + 0.3 * pop : 1) : 0.8}) rotate(${activa ? (i % 2 ? 1.5 : -1.5) : 0}deg)`,
              textShadow: `0 ${Math.round(size * 0.06)}px 0 rgba(0,0,0,.35)`,
            }}
          >
            {limpiar(p.texto)}
          </span>
        );
      })}
    </div>
  );
};
