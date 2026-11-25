---
name: webdesign-westsaid
description: Saids eigen werkwijze voor het ontwerpen of herontwerpen van websites en landingspagina's. Gebruik dit bij elke opdracht om een site, pagina of component te ontwerpen, moderner te maken of te beoordelen. Samengevat uit vijf openbare design-skills.
---

# Webdesign: de werkwijze

Samenvatting van wat bruikbaar is uit vijf skills, bestudeerd op 25 november 2026.
Onderaan staat waar de volledige versies staan. Dit bestand is de korte versie die
altijd geladen kan worden; de bronnen zijn groot (samen ruim 100 MB) en horen niet
in een projectrepo.

## 1. Eerst het onderwerp, dan het ontwerp

- Schrijf op: wat wordt er verkocht, aan wie, en wat is de ene hoofdactie
  (offerte aanvragen, kaart kopen, tafel boeken).
- Haal kleur, beeld en vorm uit de wereld van het onderwerp. Bij een elektricien:
  aderkleuren, meterkast, kWh. Niet uit wat op elke site past.
- Soort bedrijf bepaalt de middelen: een dienst of een zaak krijgt foto's, vlakke
  kleur en typografie. Shaders, 3D en grote scroll-scènes alleen bij tech, games
  en software.

## 2. Plan in vier regels vóór de code

- Kleur: 4 tot 6 benoemde hex-waarden.
- Type: één familie of twee die duidelijk verschillen, met hun rol.
- Layout: één zin plus een ASCII-schets; links of gecentreerd uitlijnen.
- Principe: wat maakt deze pagina van deze klant.

Leg het plan naast de opdracht. Lijkt een onderdeel op wat je voor elke
vergelijkbare pagina zou maken, pas dat onderdeel aan.

## 3. Herken de standaard en kies er bewust voor of tegen

Deze kenmerken verraden een gegenereerde pagina:

- crème achtergrond met serif en terracotta accent;
- bijna-zwart met één fel groen of rood accent;
- krantenlayout met haarlijnen en nul afronding;
- alles in identieke afgeronde kaarten met dezelfde grijze schaduw;
- een label in hoofdletters boven elke kop, 01/02/03 bij dingen die geen
  volgorde zijn, puntjes tussen woorden, een pijl achter elke link;
- één woord in de kop in een andere kleur of cursief;
- paars of lavendel als accent;
- een fade-in op elke sectie en een hover op elke kaart.

Nummer alleen wat echt een volgorde is. Structuur (lijnen, labels, nummers)
moet iets betekenen.

## 4. Opbouw van de pagina

- Het eerste scherm zegt wat er verkocht wordt, voor wie, met één hard feit, en
  bevat de hoofdknop. Open met het meest kenmerkende van het onderwerp: dat mag
  een werkend hulpmiddel zijn in plaats van een foto.
- Eén idee per sectie, linker- en rechterrand overal gelijk, geen sectie die
  half leeg is.
- Laat het echte ding zien: echte foto's, het echte product, de echte interface.
  Stockfoto's zijn sfeerbeelden en worden zo benoemd. Geen onderschrift dat een
  foto uitlegt; de bronvermelding staat één keer in de voet.
- Eén knopstijl-paar, één kaartstijl, één afrondingsschaal, één linkstijl.
- Geef het gewaagde één plek. De rest blijft rustig. Haal vóór oplevering één
  versiering weg.

## 5. Tekst

- Koppen noemen dingen. Knoppen zijn een werkwoord plus waar het over gaat
  ("Offerte aanvragen", niet "Verstuur").
- Schrijf vanuit de bezoeker, in gewone woorden, actieve vorm, zonder
  reclametaal. Eén feit, één formulering.
- Verzin niets: geen reviews, klantnamen, cijfers of keurmerken die niet zijn
  aangeleverd. Ontbrekende gegevens blijven een zichtbare plaatshouder en komen
  in het rapport.
- Foutmeldingen zeggen wat er misging en hoe het op te lossen is, onder het
  veld waar het om gaat.

## 6. Beweging

- Beweging die antwoord geeft op een handeling (openen, schuiven, bevestigen) is
  goed. Beweging uit zichzelf: hoogstens één moment per pagina.
- Geen scroll-jacking, geen parallax op tekst, geen kantelende kaarten.
- `prefers-reduced-motion` wordt gerespecteerd en verbergt geen inhoud.

## 7. Ondergrens voor kwaliteit

- Contrast tekst minstens 4,5:1. Zichtbare focusring. Alles met het toetsenbord
  bereikbaar. Zichtbare labels bij velden, geen placeholder als label.
- Aanraakdoelen minstens 44 bij 44 pixels met 8 pixels ertussen.
- Basistekst 16 pixels of groter, regels korter dan 80 tekens.
- Mobiel eerst, geen horizontaal scrollen op 320 tot 390 pixels breed.
- Afbeeldingen in WebP of AVIF, met breedte en hoogte, lui geladen onder de
  vouw. Lettertypen zelf hosten (snelheid en AVG).
- Eén `h1`, koppen zonder niveaus over te slaan, `lang`, titel, beschrijving,
  canonical, Open Graph en gestructureerde gegevens (JSON-LD).

## 8. Controleren in een echte browser

- Schermfoto's op 1440, 768 en 390 pixels en die werkelijk bekijken.
- Console zonder fouten, geen 404 op bestanden, geen overflow.
- Elke knop en elk formulier één keer echt bedienen.
- Rapporteer wat gemeten is, wat is aangenomen en wat de klant nog moet
  aanleveren.

## Bronnen

| Skill | Wat eruit is overgenomen | Licentie |
| --- | --- | --- |
| anthropics/skills, `skills/frontend-design` | plan in tokens, standaardkenmerken herkennen, typografie, tekst als ontwerp | zie LICENSE.txt in de bron |
| leonxlnx/taste-skill | soort bedrijf bepaalt de middelen, eerste scherm, één systeem, nooit-lijst, controle in de browser | MIT |
| nextlevelbuilder/ui-ux-pro-max-skill | prioriteiten: toegankelijkheid, aanraakdoelen, prestaties, formulieren | MIT |
| xiaopu-ai/web-design | eerst een ontwerpspecificatie (DESIGN.md), dan code; drie niveaus van interactie | MIT |
| freshtechbro/claudedesignskills | prestaties eerst, valkuilen (te veel animatie, scroll-kaping), bibliotheken voor 3D en animatie als een opdracht daar echt om vraagt | MIT |

Niet overgenomen: de Stop-hook van taste-skill (die draait na elke beurt een
script van een derde), de 3D- en WebGL-skills en de datasets met kant-en-klare
paletten. Wie de volledige versies wil: installeer ze uit de bron in
`~/.claude/skills/`.
