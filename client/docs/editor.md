# Editor úloh

Při otevření úlohy, ať už z návrhů nebo z přehledu sérií, se vykreslí editor.
Ten obsahuje dvě hlavní částí: editor textů a zobrazení PDF.

Každá část má v hlavičce výběr, jaký typ/jazyk textu má zobrazovat. Je tak možné
přepínat mezi zadáním/řešení a češtinou/angličtinou. Každý výběr je separátní
pro jednu "sekce" -> při změně textu se nezmění vybrané PDF. Pokud tedy píšete
text a chcete si jej zobrazit, je nutné si typ textu přepnout v obou částech.
Umožňuje to nicméně libovolně kombinovat obsah editoru a PDF, můžete tedy psát
řešení během toho co v PDF máte zobrazené zadání.

Editor lze přepnout i do jiných layoutů pro různé potřeby. Výběr layoutu se
nachází v levém navigačním panelu.

## Editor textů

Samotný editor textů není jen základním polem na upravení textů, ale obsahuje
i další funkce, jakými jsou zvýraznění syntaxe, našeptávání příkazů nebo
linting chyb. Podpora jazyka je custom implementací systému, tedy pokud vám
budou chybět nějaké příkazy na našeptávání, chtěli byste něco automaticky
kontrolovat nebo objevíte chybu ve zvýraznění, je možné to upravit.

Aby nedocházelo ke konfliktům při editaci stejné úlohy více lidmi, synchronizuje
editor změny v reálném čase a průběžně je ukládá. Umožňuje to tedy real-time
spolupráci s ostatními a při zavření stránky nepřijdete o všechnu práci.

## Zobrazení PDF

Prohlížeč PDF funguje podobně, jako na Overleaf. Při zmáčknutí tlačítka
_Zkompilovat_ se spustí překlad TeXu do PDF a jakmile je překlad dokončen, PDF
se vám zobrazí. Zároveň je zobrazen i status, jestli se překlad povedlo nebo ne,
vyobrazeno ikonkou u tlačítka.

Vedle kompilovacího tlačítka najdete také možnost
na přepnutí se do logu, který LaTeX vygeneroval, můžete tak zjistit, proč
překlad nefunguje a co opravit.

V samotném zobrazení PDF lze měnit velikost dokumentu, ať už tlačítky plus a
mínus nad editorem, nebo, jako to mají prohlížeče, klávesovými
zkratkami `ctrl +` a `ctrl -` nebo `ctrl` a kolečko myši.

Poslední tlačítko v liště umožňuje soubor stáhnout.
