# Welcome to React Router!

## Auth v keycloaku

Potřeba vytvořit clienta nastavit ho jako public (client authentication off).
Knihovna `oidc-client-ts` automaticky revaliduje `access_token` 1 minutu před
jeho vypršením. Pokud tedy je lifetime nastaven na 1 minutu a méně, zasekne se
v nekonečné smyčce revalidace.

Pro nalezení uživatele je použito `personId`, které musí Keycloak exportovat.
Na to je potřeba v problem-manager klientovi v záložce client scopes vybrat
`problem-manager-dedicated` a přidat custom mapper, který bude exportovat
user attribute `fksdb-id` jako `person_id` (token claim name). Aby se to
projevilo bez custom scopes, je potřeba zatrhnout i `Add to lightweight access
token`.
