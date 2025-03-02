# Welcome to React Router!

## Auth v keycloaku

Potřeba vytvořit clienta nastavit ho jako public (client authentication off).
Knihovna `oidc-client-ts` automaticky revaliduje `access_token` 1 minutu před
jeho vypršením. Pokud tedy je lifetime nastaven na 1 minutu a méně, zasekne se
v nekonečné smyčce revalidace.
