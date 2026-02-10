# `hooks/` — Documentation

## Gamepad

- `useGamepadStatus.ts`
  - Utilise l’API Gamepad (`navigator.getGamepads()`).
  - Expose `{ isConnected, activeGamepad }`.
  - Écoute `gamepadconnected` / `gamepaddisconnected` + resync périodique (500ms).

- `useGamepadDebug.ts`
  - Poll l’état de la manette à `pollHz` (défaut 20Hz).
  - Log en console uniquement si l’input change (axes arrondis + boutons pressés).

- `useGamepadTransmit.ts`
  - Envoie l’état de la manette vers un endpoint HTTP `endpointUrl`.
  - Poll à `pollHz` (défaut 20Hz).
  - Envoi uniquement si l’état change (hash JSON du gamepad).
  - Payload : `{ ts, gamepad: { id, index, mapping, axes[], buttons[] } }`.

## Robot position

- `useRobotPosition.ts`
  - Récupère une position initiale via REST (`GET /api/telemetry/latest`).
  - Se connecte ensuite via Socket.IO et écoute `robot:position`.
  - Appelle `onPosition({lat, lng})` à chaque update.
