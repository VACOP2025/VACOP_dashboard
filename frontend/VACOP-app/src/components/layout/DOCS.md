# `components/layout/` — Layout & routing

- `Header.tsx`
  - Wrapper de layout pour les en-têtes (`<header className="app-header">`).
  - Utilise `children` pour laisser les pages composer leur header.
- `Header.css`
  - Styles du header.

- `PrivateRoute.tsx`
  - Guard React Router.
  - Autorise l’accès si `authService.getCurrentUserToken()` est truthy.
  - Sinon redirige vers `/login`.
