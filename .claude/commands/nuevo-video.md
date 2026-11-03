---
description: Produce un video "¿Y si…?" completo (ideas → guion → arte → animación → edición → revisión → publicación) con pausas de aprobación
argument-hint: "[tema opcional | slug de un episodio a reanudar]"
---

Eres el **orquestador** del equipo de subagentes del canal. Argumento recibido: `$ARGUMENTS`

Ejecuta la cadena **en orden**, delegando cada etapa al subagente correspondiente con la herramienta Agent (`subagent_type` = nombre del agente) y pasándole la ruta de la carpeta del episodio y lo que necesita. Entre etapas actualiza el estado con `node scripts/historial.mjs set <slug> <estado>`. Lee siempre `config.json` (modo de voz) y no saltes etapas.

## Reanudar
Si el argumento es el slug de una carpeta existente en `episodios/` (o `node scripts/episodio.mjs estado <slug>` lo reconoce), **no empieces de cero**: mira su estado en `episodios/historial.csv` y continúa desde la etapa siguiente (guion_pendiente → pausa 1; guion_aprobado → voz; voz_lista → arte; etc.).

## Etapas
1. **Ideas** — Agente `investigador-ideas`.
   - Sin tema: que proponga 10 ideas y valide datos; elige la **recomendada** y muéstrale al usuario las otras 9 (solo títulos) en el resumen final de esta etapa.
   - Con tema: que lo valide (APTO / NO APTO) y proponga el gancho. Si es NO APTO (dato falso o repetido), explica y pregunta al usuario qué hacer.
   - Crea la carpeta con `node scripts/episodio.mjs nuevo "<título>"` (devuelve el slug) y guarda ahí `idea.md`.
2. **Guion** — Agente `guionista`: produce `guion.md` y `escenas.json` y valida con `scripts/validar-escenas.mjs`. Estado → `guion_pendiente`.
3. ⏸ **PAUSA 1 — aprobación del guion.** Muestra al usuario el guion completo, el nº de palabras y el gancho. Usa AskUserQuestion: *Aprobar* / *Pedir cambios* (indicando cuáles → vuelve al guionista) / *Descartar* (estado `rechazado`).
   - Estado → `guion_aprobado`.
   - **Voz**: si `voz.modo` es `"grabada"`, indica al usuario que grabe el guion y guarde `episodios/<slug>/voz.mp3`, y **espera** a que confirme (vuelve a comprobar que el archivo existe). Si es `"elevenlabs"`, corre `node scripts/tts.mjs <slug>`. (Solo si el usuario pide una prueba de pipeline: `--placeholder`.) Estado → `voz_lista`.
4. **Arte** — Agente `director-arte`: reutiliza el kit y crea solo lo que falte. Estado → `arte_listo`.
5. **Animación** — Agente `animador`: valida escenas, ajusta `src/`, revisa stills. Estado → `animado`.
6. **Edición** — Agente `editor`: whisper → sincronía → audio → render → `verificar.mjs` → `final.mp4`. Estado → `editado` (con duración).
7. **Revisión** — Agente `revisor`: genera `reporte.md`. Si el veredicto es RECHAZADO, vuelve a la etapa responsable (datos/ortografía → guionista y editor; arte → director-arte) y repite; máximo 2 ciclos antes de consultar al usuario.
8. ⏸ **PAUSA 2 — aprobación de publicación.** Presenta el veredicto, los avisos de `reporte.md` y la ruta de `final.mp4`. Pregunta con AskUserQuestion: *Aprobar para subir como borrador/privado* / *Pedir cambios* / *No publicar*. Estado → `aprobado_publicacion` solo si aprueba.
9. **Publicación** — Agente `publicador`, **solo con aprobación explícita**: prepara `descripcion.txt` y sube como borrador/privado. Estado → `borrador_tiktok`. Avisa al usuario que debe publicarlo a mano en TikTok. **Nunca marques `publicado` tú**: lo hace el usuario.

## Reglas
- Nunca publiques ni subas nada sin la aprobación de la PAUSA 2.
- Todo archivo del episodio vive en `episodios/AAAA-MM-DD-slug/`.
- Si un script falla, diagnostica y corrige antes de seguir; no inventes resultados.
- Al terminar, resume: slug, duración, veredicto, advertencias (p. ej. voz placeholder, timestamps estimados) y siguiente acción del usuario.
