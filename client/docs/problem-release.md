# Zveřejňování úloh

## TL;DR

### Potřebuji zveřejnit zadání

1. Otevřu úlohu
2. Vyberu v panelu _"Zveřejnění textů"_
3. U textů zadání (texty typu _task_) vyberu _"Zveřejnit"_
4. Zkontroluji na webu, že je vše OK (může chvíli trvat, než se propíše).

### Upravilo se zadání úlohy, ale na webu je stále to staré

1. Otevřu úlohu
2. Vyberu v panelu _"Zveřejnění textů"_
3. Vyberu u textu _"Zveřejnit aktuální verzi"_

### Zadání úloh jsou hotové, ale ještě by se neměla zveřejnit

1. Nastavím sérii termín zveřejnění
2. Zveřejním připravené texty
3. Jakmile nastane termín zveřejnění, úlohy se automaticky zobrazí na webu.

## Jak zveřejnit text

**Úloha =** vše, co se vztahuje ke klasickému pojetí úlohy, tedy všechny texty
zadání a řešení, data o názvu úlohy, jejím původu, body za úlohu atd.

**Text =** jeden konkrétní text v TeXu daného typu a jazyku. Pokud úloha
obsahuje zadání a řešení, každé v češtině a angličtině, obsahuje tedy celkem 4
různé texty.

Zveřejnění úlohy znamená, že se vezme aktuální stav zdrojového textu v TeXu a na
pozadí se z něj vytvoří HTML pro weby. Zveřejnění lze vykonat po rozkliknutí
úlohy v záložce _"Zveřejnění textů"_. Na zveřejnění textu je potřeba mít
potřebná práva, je tedy možné, že vám text zveřejnit nepůjde, pokud tato práva
nemáte.

Text je zveřejněný, pokud pro něj existuje vyexportované HTML. To se exportuje
pouze v moment kliknutí na tlačítko zveřejnění, kdy se vezme _text v daném
okamžiku_, vytvoří se HTML a to se uloží. Pokud je poté zdrojový text upraven,
tak se změny **neprojeví** v HTML. Je proto nutné jej aktualizovat pomocí
tlačítka _"Zveřejnit aktuální verzi"_.

## Kdy je úloha a série zveřejněna

Úloha se považuje za zveřejněnou v moment, kdy obsahuje alespoň jeden zveřejněný
text. Pokud úloha není zveřejněna, není obsažena v datech o sérii a tedy se
nikde nezobrazí.

Série je zveřejněna jakmile obsahuje alespoň jednu zveřejněnou úlohu, tedy
alespoň jeden zveřejněný text. Pokud nemá zveřejněnou úlohu, neobjeví se v
seznamu sérií a nelze ji zobrazit.

Za nezveřejněnou se považuje i taková série, u které je termín zveřejnění v
budoucnosti. Před tímto datem se série nezveřejní, i když obsahuje zveřejněné
úlohy. Je tedy možné dopředu zveřejnit texty úloh bez toho, aby se zveřejnila
(= objevila se na webu) celá série dříve, než by měla.

Pokud ale termín zveřejnění není uveden, tak je to bráno, jako kdyby již datum
zveřejnění proběhlo. Jestli má nebo nemá být série vidět pak určuje pouze
existence zveřejněných úloh.

## Jaké texty exportovat

Generátor HTML předpokládá, že se zveřejňují pouze zadání úloh. Teoreticky nic
nebrání tomu vygenerovat HTML i pro řešení, nicméně u nich je vzhledem k
množství použitých TeX příkazů větší pravděpodobnost, že se export z nějakého
důvodu nepovede. Zároveň HTML pro řešení není nikde použito, tedy (minimálně
zatím) nemá smysl jejich zveřejňování řešit. Exportujte tedy pouze zadání.

## Export HTML

Při zveřejňování úlohy se volá generátor, který daný text vezme, projde jej a
dle specifikovaných pravidel z něj vytvoří HTML pro web.

Aby to však fungovalo, je nutné, aby TeX byl správně napsaný a obsahoval jen
standardní příkazy, které generátor umí zpracovat. Ten je totiž specificky
vytvořen pro to, co za TeX se v textech úloh obvykle vyskytuje (protože vytvořit
obecný generátor by znamenalo reimplementaci TeXu). Pokud je použit nestandardní
příkaz, je možné, že se příkaz objeví přímo v HTML, ať už jako příkaz v textu
nebo neplatný příkaz v matematice. Systém ale nezahlásí error, který by říkal,
že se takový příkaz vyskytl, protože např. to může být platný příkaz v
matematice, který se na webu zvládne vykreslit. Vždy proto zkontrolujte, jak
úloha na webu vypadá.

Během zveřejňování je možné, že systém zahlásí chybu. Typicky se může jednat o

- nebyl nalezen obrázek,
- nebyla nalezena reference,
- jiný typ chyby s číslem znaku, kde se chyba vyskytla.

Pokud nebyl nalezen obrázek, je možné, že je ve špatném formátu a špatně se
vyexportoval. Pravděpodobně se tedy neobjeví ani v samotném PDF úlohy. Zkuste
obrázek stáhnout a znovu nahrát, pokud export hlásí chybu, pokuste se obrázek
opravit.

V případě, že nebyla nalezena reference (_"Label not registered in refs"_),
znamená to, že se někde objevilo `\ref`, které ale neodkazuje na žádný obrázek
nebo tabulku.

V případě ostatních chyb je pravděpodobně někde špatně použit nějaký příkaz nebo
je použita TeX magie, se kterou si překladač neporadí. V případě příkazu jej
zkuste najít a opravit. Špatně použitý příkaz nemusí nutně znamenat, že se PDF
nepřeloží, ale třeba je použit příkaz s více povinnými parametry, než by měl.
Pokud se jedná o TeX magii, zamyslete se, jestli je opravdu potřeba, ve většině
případů je odpověď ne. Pokud by se opravdu jednalo o něco, co by měl překladač
zvládat a nezvládá, je na místě danou věc do překladače doimplementovat.
