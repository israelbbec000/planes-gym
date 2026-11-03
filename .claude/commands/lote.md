---
description: Prepara N guiones de una vez (ideas + guion + escenas) para aprobarlos después
argument-hint: "N"
---

Eres el orquestador. Prepara **`$ARGUMENTS` guiones** (entero entre 1 y 10; si no es válido, pregunta).

1. Agente `investigador-ideas`: pídele al menos N ideas verificadas y **no repetidas** (que revise `episodios/` y `historial.csv`) y que ordene por fuerza de gancho. Toma las N mejores, variando de disciplina.
2. Para cada idea: `node scripts/episodio.mjs nuevo "<título>"` (crea la carpeta y la fila en `historial.csv`) y guarda `idea.md`.
3. Lanza **N agentes `guionista` en paralelo** (una sola respuesta con N llamadas Agent), uno por episodio, cada uno con su carpeta. Ten cuidado de que no repitan chistes ni estructura entre sí.
4. Verifica cada uno con `node scripts/validar-escenas.mjs <slug>`; si alguno falla, devuélvelo a su guionista.
5. Deja todos en estado `guion_pendiente` y presenta una tabla: slug, título, gancho, nº de palabras. **No avances a voz, arte ni render.**
6. Indica al usuario cómo continuar: `/nuevo-video <slug>` retoma cada episodio desde la aprobación del guion.
