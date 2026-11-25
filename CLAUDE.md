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

- Bedrijfsgegevens: `BEDRIJF` bovenaan `tools/build.py`. Telefoon, adres,
  KvK, btw-nummer en IBAN zijn door Said aangeleverd op 25 november 2026 en
  staan ook in de JSON-LD. Het e-mailadres blijft `info@ohandelektra.nl`.
- Adres van de site: `SITE_URL`. Bij een eigen domein alleen die regel
  aanpassen (canonical, sitemap, Open Graph en de 404 volgen vanzelf).
- Stijl: `assets/site.css`. Gedrag: `assets/site.js`.

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
