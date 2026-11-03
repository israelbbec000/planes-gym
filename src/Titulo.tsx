import React from 'react';
import {COLORES, FUENTE} from './util';

// Título fijo arriba durante todo el video.
export const Titulo: React.FC<{texto: string}> = ({texto}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top: 150, display: 'flex', justifyContent: 'center'}}>
    <div
      style={{
        background: COLORES.morado, border: `9px solid ${COLORES.tinta}`, borderRadius: 40, padding: '26px 38px',
        boxShadow: `0 12px 0 ${COLORES.tinta}`, textAlign: 'center', maxWidth: 940,
      }}
    >
      <span
        style={{
          fontFamily: FUENTE, fontWeight: 900, fontSize: texto.length > 34 ? 64 : 74, lineHeight: 1.12, color: COLORES.blanco,
          WebkitTextStroke: `10px ${COLORES.tinta}`, paintOrder: 'stroke fill', letterSpacing: 0.5,
        }}
      >
        {texto}
      </span>
    </div>
  </div>
);
