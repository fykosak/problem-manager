# Soubory a obrázky u úloh

Při otevření úlohy v levém panelu najdete sekci _Soubory_. Zde je možné k úloze
nahrát soubory, jako jsou obrázky nebo grafy, které následně lze používat v
textech.

Při nahrání souboru se automaticky exportují všechny potřebné formáty, nahrávání
proto může trvat o něco déle, než se vše vyexportuje. Během nahrávání lze vybrat
libovolné množství souborů najednou, pozor ale na to, že formulář obsahuje
maximální limit na to, kolik dat je možné najednou nahrát. Pokud tedy nahrajete
moc moc velkých obrázků najednou, je možné, že se upload nezdaří a vypíše se vám
error.

Aby bylo zajištěno, že se při exportu obrázků nebudou přepisovat jiné, je
kontrolována unikátnost názvu souboru. Pokud tedy nahrajete soubor, který se
jmenuje stejně, jen má jinou příponu, vypíše vám systém chybu a musíte soubor
přejmenovat. Jedinou výjimkou je, pokud nahráváte soubor se stejným názvem a
příponou -> v takovém případě to je stejný soubor a bere se to tak, že chcete
nahrát jeho novou verzi. Starý soubor je tedy přepsán a nutné formáty jsou znovu
vyexportovány.

Soubory podporují téměř všechny standardně používané formáty: `mp`, `ipe`,
`svg`, `plt`, `jpg`, `png`. Zároveň je možné (nutné) nahrát i soubory s daty
(`dat`). Pokud je chcete použít v `plt`, je nutné nejdříve nahrát `dat` a až
poté `plt`, jinak dojde k tomu, že Gnuplot nebude mít potřebné zdrojové soubory
k dispozici a neproběhne export.

Soubory nemusí mít žádné speciální jméno. Není tedy třeba uvádět `problemX-Y_`
nebo `.src.`. Zachovejte ale nějakou štábní kulturu v pojmenovávání, ale bylo
možné rozeznat, který obrázek je který. Nejlépe tedy místo `1.svg`, `2.png` a
`3-1-final.mp` používejte `ilu_zadani.png`, `reseni_aparatura.png` nebo
`reseni_schema_zapojeni.mp`.

Pokud byste zjistili, že jste nahráli k úloze špatný soubor nebo je špatně
pojmenován, je možné pomocí tlačítek u každého souboru ho buď smazat, nebo
přejmenovat.
