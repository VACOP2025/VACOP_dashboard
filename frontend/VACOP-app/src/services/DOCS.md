# `services/` — Documentation

- `authService.ts`
  - `login(username, password)` : actuellement simulé (stocke `user_token = this_is_a_fake_token_for_dev` et retourne `true`).
  - Logique “production” (axios POST vers `/auth/login`) est présente mais commentée.
  - `logout()` : supprime `user_token` et redirige vers `/login`.
  - `getCurrentUserToken()` : retourne le token depuis `localStorage`.
