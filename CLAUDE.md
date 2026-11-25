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

## Stijl en 3D

Van Said, 25 november 2026: "Gebruik 3D elementen en laat de website heel erg
hip zijn zoals een Apple website." Dat gaat voor de algemene regel in de
webdesign-skill dat een dienstverlener geen 3D krijgt.

- `assets/scene.js` tekent de thuisbatterij (en op de homepage de laadpaal)
  met three.js uit `assets/vendor/`. Elk `<canvas data-scene="naam">` wordt
  een model; `site.js` stuurt het aan via `window.OhandScenes`.
- Het aantal modules in de configurator volgt de berekende capaciteit
  (één module per 2,5 kWh). Het model is een eigen tekening, geen bestaand
  product.
- Op de homepage staat een importmap met `./assets/...`: zonder `./` weigert
  de browser hem ("blocked by a null value") en laadt er geen enkel model.
- Zonder WebGL of met "minder beweging" blijft de pagina volledig bruikbaar.

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
