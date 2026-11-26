# Ohand Elektra — website

Statische site op GitHub Pages (`main`, hoofdmap). Geen framework en geen
npm: HTML wordt gebouwd door één Python-script.

## Bouwen

    python3 tools/build.py

Dat schrijft `index.html`, `laadpaal-installeren/`, `thuisbatterij/`,
`elektra/`, `privacyverklaring/`, `404.html`, `sitemap.xml` en `robots.txt`.
**Bewerk die bestanden nooit met de hand**: wijzig `tools/build.py` en bouw
opnieuw. De gebouwde bestanden worden wél gecommit, want Pages serveert ze
rechtstreeks.

- Bedrijfsgegevens, projecten, vervangen foto's en aangepaste teksten staan
  in `content/site.json`. Dat bestand wordt beheerd via de beheerpagina; zet
  zulke gegevens dus niet meer in `tools/build.py`.
- Adres van de site: `SITE_URL`. Bij een eigen domein alleen die regel
  aanpassen (canonical, sitemap, Open Graph en de 404 volgen vanzelf).
- Stijl: `assets/site.css`. Gedrag: `assets/site.js`.

## Het beheer (`/beheer/`)

Van Said, 26 november 2026: een backend waar een leek tekst, mailadres en
afbeeldingen kan wijzigen, en een plek voor projectfoto's.

De site staat op GitHub Pages en heeft geen server. Het beheer is daarom een
losse pagina (`beheer/index.html` en `beheer/beheer.js`, met de hand
geschreven, niet door `build.py`) die rechtstreeks met de GitHub-API praat:

1. De eigenaar logt in met een fine-grained toegangssleutel (alleen deze
   repository, Contents lezen en schrijven). De sleutel blijft in zijn
   browser; de inlogpagina legt uit hoe hij hem aanmaakt.
2. Opslaan maakt ÉÉN commit op `main` met `content/site.json` en de nieuwe
   foto's (git-data-API: blobs, tree, commit, ref).
3. `.github/workflows/bouw.yml` draait daarop `tools/build.py` en legt de
   gebouwde pagina's vast. Pages levert ze uit.

Wat er te beheren is:

- **Projecten**: titel, soort, omschrijving, foto, volgorde. Foto's worden in
  de browser verkleind tot JPEG van 1200 en 640 pixels
  (`images/projecten/p-...`). JPEG en niet WebP, omdat niet elke browser
  WebP kan maken. De zes eerste projecten zijn sfeerbeelden met
  `"voorbeeld": true`; de site zet er "(voorbeeld)" bij tot de foto is
  vervangen.
- **Bedrijfsgegevens**: het blok `bedrijf`. De bel-link wordt uit het getoonde
  nummer afgeleid (`_telefoon_link`).
- **Vaste foto's**: `FOTO_PLEKKEN` in `build.py`. Een vervangen foto staat in
  `afbeeldingen` en komt in `images/upload/`.
- **Teksten**: `build.py` schrijft alle zichtbare tekststukjes per pagina naar
  `beheer/teksten.json`. Een wijziging wordt opgeslagen als
  `"oorspronkelijke tekst": "nieuwe tekst"` en bij het bouwen vervangen, ook
  in de JSON-LD. Verandert de oorspronkelijke tekst in `build.py`, dan past
  de wijziging niet meer; de bouw meldt dat. Teksten die het script in de
  browser invult (vervolgvragen van het stappenformulier, uitkomsten van de
  configurator) en de titel en beschrijving voor zoekmachines zijn niet via
  het beheer te wijzigen.

Let op bij eigen werk aan de code: de eigenaar en de bouwtaak zetten ook
commits op `main`. Begin dus altijd met `git fetch` en bouw opnieuw vóór een
push. Oude foto's worden niet opgeruimd als een project wordt verwijderd.

Getest met een nagebootste GitHub (Playwright onderschept `api.github.com`),
niet met een echte sleutel.

## De thuisbatterij-configurator

Rekenmodel in `assets/calc.js`, bediening in `assets/site.js`. Alle prijzen en
tarieven staan in `AANNAMES` bovenaan `calc.js`.

- `prijsVast` en `prijsPerKwh` zijn **richtprijzen die niet van Ohand komen**.
  Vervang ze door de eigen prijzen zodra die bekend zijn; ze staan ook als
  standaardwaarde in het formulier in `tools/build.py` (velden `prijsvast` en
  `prijskwh`). Houd die twee plekken gelijk.
- Twee soorten: `vast` (installateur) en `plug` (stekkerbatterij, kleiner en
  op 800 watt begrensd). "Adviseer mij" kiest de soort met de hoogste winst.
  Ook `plugVast` en `plugPerKwh` zijn richtprijzen die niet van Ohand komen.
- Zonder zonnepanelen levert een batterij alleen iets op met een dynamisch
  contract (`prijsverschil` maal `handelCycli`). Dat prijsverschil is een
  aanname, geen gemeten marktgemiddelde.
- De leverancier wordt alleen meegestuurd met de aanvraag. Er staan bewust
  geen tarieven per leverancier in: die verschillen per contract.
- Het model rekent zonder salderen (vanaf 1 januari 2027) en kiest de
  capaciteit met de hoogste winst over 15 jaar. Loont het niet, dan zegt de
  uitkomst dat. Dat is de bedoeling: de site belooft geen vaste besparing.
- De formules voor eigen verbruik zijn een benadering van gemiddelden, geen
  simulatie per uur. Presenteer de uitkomst altijd als indicatie.

## Stijl en opbouw

Drie rondes op 25 november 2026, alle drie van Said. De laatste geldt:

1. Eerste herontwerp: rustig en zakelijk.
2. "Gebruik 3D elementen en laat de website heel erg hip zijn zoals een Apple
   website."
3. "Pas de website weer helemaal aan en gebruik autoladen24.nl als inspiratie
   maar wees origineel." Dat is de stand van nu: licht, praktisch en gericht
   op de aanvraag.

Wat van die derde ronde is overgenomen is de AANPAK, niet de vorm: een
stappenformulier in de hero, alle diensten direct aanklikbaar (uitklapmenu en
raster), vier zekerheden onder de hero en een belknop die op mobiel in beeld
blijft. Kleuren, lettertype, teksten, pictogrammen en indeling zijn eigen.

- **Stappenformulier** (`#wiz` op de homepage, werking in `site.js`): dienst,
  één vervolgvraag per dienst (`VRAGEN`), moment, gegevens. "Iets anders"
  slaat de vervolgvraag over. Versturen gaat via `mailto:`, net als het
  contactformulier.
- **Diensten** staan één keer in `DIENSTEN` in `tools/build.py`; het menu en
  het raster lezen die lijst. Elk adres met een `#` moet op de doelpagina een
  element met dat id hebben.
- **Pictogrammen** zijn eigen lijntekeningen in `ICON_PATHS`.
- **3D** staat alleen nog op de thuisbatterijpagina (kop, configurator en het
  model dat openschuift). `assets/scene.js` tekent het met three.js uit
  `assets/vendor/`; elk `<canvas data-scene="naam">` wordt een model en
  `site.js` stuurt het aan via `window.OhandScenes`. Het aantal modules in de
  configurator volgt de berekende capaciteit (één per 2,5 kWh). Het model is
  een eigen tekening, geen bestaand product.
- Een pagina in de hoofdmap die het model laadt, heeft een importmap met
  `./assets/...` nodig: zonder `./` weigert de browser hem ("blocked by a null
  value"). `build.py` regelt dat.
- Niet overgenomen omdat de gegevens ontbreken: een werkgebied met
  plaatsnamen, projectfoto's, reviews, keurmerken en een WhatsApp-knop. "Ede"
  staat er alleen als vestigingsplaats.

## Regels

- Verzin geen feiten: geen reviews, keurmerken, werkgebied of prijzen die Said
  niet heeft gegeven.
- De foto's zijn sfeerbeelden van Unsplash (`images/CREDITS.md`), geen eigen
  projecten.
- Het contactformulier heeft geen server: het opent een `mailto:`. Er worden
  geen cookies of meetprogramma's gebruikt; de privacypagina zegt dat. Wie een
  van beide verandert, past die pagina aan.
- Ontwerpwerk: volg `.claude/skills/webdesign-westsaid/SKILL.md`.
- Controle vóór een push: bouwen, de pagina's in Chromium openen op 1440 en
  390 pixels breed, console zonder fouten, configurator één keer doorlopen.
