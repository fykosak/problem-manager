# Navrhování úloh

Pokud máme nápad na nějakou úlohu, která by se hodila do semináře nebo soutěže,
tak je potřeba ji _navrhnout_, aby následně mohla být vybrána a použita.

Navrhovat úlohy lze pomocí [formuláře](/create-problem). Na ten se lze dostat z
hlavní stránky po kliknutí na tlačítko _"Navrhnout úlohu"_, nebo pokud máme
vybraný seminář/soutěž, můžeme se sem dostat stejně pojmenovaným tlačítkem.

Při zobrazení formuláře máme můžeme vybrat pouze jeden údaj a to seminář, do
kterého úlohu navrhujeme. Tento údaj je důležitý, aby bylo možné následně
správně doplnit ostatní údaje, proto není zbytek formuláře vidět. Pokud jste
formulář otevřeli ze stránky semináře, je tento údaj již předvyplněný.

Po vyplnění semináře se nám zobrazí zbytek formuláře. Prvním údajem je jazyk
návrhu, ten téměř vždy bude čeština, ale pokud byste chtěli navrhnout úlohu v
angličtině a až následně ji překládat, můžete.

Následují základní údaje o úloze: _Název_, _Původ úlohy_ a _Zadání_. _Název_ je
vypovídající pojmenování, sem uveďte, jak by se úloha měla jmenovat. _Původ
úlohy_ je krátká, obvykle vtipná věta o tom, jak se k návrhu úlohy došlo, která
se následně uvádí pod textem zadání při zveřejnění řešení. Je to také způsob jak
uvést, kdo úlohu navrhl. Příkladem můžou být _"Viktor přemýšlel o tom, jaké to
je být na dně."_ nebo _"Jarda si představoval, jaké by to bylo skočit z okna
koleje."_ V neposlední řadě je do _Zadání_ potřeba napsat samotný návrh úlohy.
Protože se vloží ihned do samotného textu zadání, který lze v rámci systému
TeXat, může obsahovat LaTeX syntaxi.

Dále je potřeba vybrat témata a typ úlohy. Témata, neboli topics, označují,
jakého tématického okruhu se úloha týká. Vyberte rozumné množství takových,
které odpovídají navrhnutému zadání. U FYKOSu, FOLu a FOFu většina témat
obsahuje zkratky, např. _mechHmBodu_ (mechanika hmotného bodu), _statFyz_
(statistická fyzika), _molFyzika_ (molekulární fyzika) atd., u většiny z nich by
však mělo být jasné, o jaké odvětví fyziky se jedná.

Typ úlohy lze vybrat pouze jeden a vyjadřuje, o jakou úlohu se jedná.
FOF má pouze typ `main`, protože má jen jednu hlavní sérii, FOL k tomu ještě
přidává typ `hurry-up` pro úlohy, které na sebe tématicky navazují a jsou vhodné
do hurry-up sérií.

<details>
<summary>FYKOSí typy</summary>

- `easy` -- jednoduché úlohy -- 1.,2. v sérii
- `hard` -- těžké úlohy -- 3.-5.
- `experimental` -- experimentálk
- `open` -- problémovky
- `serial` -- seriálové úlohy

</details>
<details>
<summary>Výfučí typy</summary>

- klasické série
    - `jednička` -- jednoduché úlohy pro 6./7. třídu -- 1. v sérii
    - `matematika` -- 2. v sérii
    - `fyzika` -- klasická fyzika -- 3.-5. v sérii
    - `experiment`
    - `seriál`
- prázdninová série
    - `kvíz` -- návrh na kvízovou otázku, nemusí být nutně celý kvíz
    - `odhadovací`
    - `pr. exp.` -- prázdninový experiment

</details>

Po vyplnění formuláře máte dvě možnosti: uložit a navrhnout další úlohu, nebo
návrh uložit a otevřít ji v editoru. V případě, že dáte navrhnout další úlohu,
je aktuální návrh uložen (vyskočí vám hláška o uložení) a formulář se vyresetuje
pro další úlohu. Ve druhém případě jste automaticky přesměrování do plného
editoru úloh (viz [návod na editor](./editor.md)), ve kterém můžete zkusit zTeXaT
své zadání, dále iterovat či přidávat obrázky k zadání (viz [návod soubory a
obrázky u úloh](./files.md)).
