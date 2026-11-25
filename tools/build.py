#!/usr/bin/env python3
"""Bouwt de statische site van Ohand Elektra.

Draaien vanuit de hoofdmap:  python3 tools/build.py
Kop, voet en contactblok staan hier één keer; elke pagina is een stuk HTML
in PAGES. Bedrijfsgegevens staan bovenaan in BEDRIJF: pas ze daar aan en
bouw opnieuw, dan kloppen ze overal (ook in de gegevens voor Google).
"""
import json
import pathlib
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Het adres waarop de site staat. Verhuist de site naar een eigen domein,
# pas dan alleen deze regel aan.
SITE_URL = "https://westsaid83.github.io/ohand-elektra/"

# TODO Said: telefoon, adres en KvK zijn nog de plaatshouders van de oude site.
BEDRIJF = {
    "naam": "Ohand Elektra",
    "telefoon_tekst": "085 000 00 00",
    "telefoon_link": "+31850000000",
    "email": "info@ohandelektra.nl",
    "adres": "Straatnaam 1, 1234 AB Plaatsnaam",
    "kvk": "00000000",
    "uren": "Maandag t/m vrijdag, 08.00 tot 17.00 uur",
    "gegevens_definitief": False,  # zet op True zodra telefoon/adres/KvK echt zijn
}

LOGO = ('<svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" fill="#0f2231"/>'
        '<path d="M12.6 11.9a9 9 0 1 0 10.8 0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="square"/>'
        '<path d="M18 7.5v10" stroke="#ffc533" stroke-width="2.6" stroke-linecap="square"/></svg>')

NAV = [
    ("laadpaal-installeren/", "Laadpalen"),
    ("thuisbatterij/", "Thuisbatterijen"),
    ("elektra/", "Elektra"),
]


def img(name, alt, sizes="(max-width: 860px) 100vw, 50vw", w=1200, h=900, lazy=True):
    return (f'<img src="{{base}}images/{name}-1200.webp" '
            f'srcset="{{base}}images/{name}-640.webp 640w, {{base}}images/{name}-1200.webp 1200w" '
            f'sizes="{sizes}" width="{w}" height="{h}" alt="{alt}"'
            + (' loading="lazy" decoding="async"' if lazy else ' fetchpriority="high"') + '>')


def faq_html(items):
    return '<div class="faq">' + ''.join(
        f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in items) + '</div>'


def faq_ld(items):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}


def business_ld():
    d = {
        "@type": "Electrician",
        "@id": SITE_URL + "#bedrijf",
        "name": BEDRIJF["naam"],
        "url": SITE_URL,
        "email": BEDRIJF["email"],
        "image": SITE_URL + "images/og.jpg",
        "description": "Elektrotechnisch installatiebedrijf voor laadpalen, thuisbatterijen, groepenkasten en elektra in woning en bedrijf.",
        "knowsAbout": ["Laadpaal installeren", "Thuisbatterij", "Groepenkast vervangen", "Elektrische installatie"],
        "openingHours": "Mo-Fr 08:00-17:00",
    }
    if BEDRIJF["gegevens_definitief"]:
        d["telephone"] = BEDRIJF["telefoon_link"]
        d["address"] = BEDRIJF["adres"]
    return d


def contact_block(onderwerp="Laadpaal"):
    opties = ["Laadpaal", "Thuisbatterij", "Groepenkast", "Elektra bij verbouwing", "Zakelijk project", "Iets anders"]
    opts = ''.join(f'<option{" selected" if o == onderwerp else ""}>{o}</option>' for o in opties)
    b = BEDRIJF
    return f'''
<section class="section section--ink" id="contact">
  <div class="wrap contact">
    <div>
      <span class="wires wires--short"></span>
      <h2>Vraag een offerte aan</h2>
      <p class="lead">Vertel kort wat u wilt laten doen. U hoeft niet te weten wat er technisch nodig is: een foto van uw meterkast zegt ons vaak al genoeg.</p>
      <ul class="contact-list">
        <li><span>Bellen</span><a href="tel:{b["telefoon_link"]}">{b["telefoon_tekst"]}</a></li>
        <li><span>Mailen</span><a href="mailto:{b["email"]}">{b["email"]}</a></li>
        <li><span>Bereikbaar</span><b>{b["uren"]}</b></li>
      </ul>
    </div>
    <form class="contact-form" id="contact-form" data-to="{b["email"]}" novalidate>
      <div class="two">
        <div class="field"><label for="c-naam">Naam</label><input id="c-naam" name="naam" type="text" autocomplete="name" required></div>
        <div class="field"><label for="c-telefoon">Telefoonnummer</label><input id="c-telefoon" name="telefoon" type="tel" autocomplete="tel"></div>
      </div>
      <div class="two">
        <div class="field"><label for="c-email">E-mailadres</label><input id="c-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="c-postcode">Postcode</label><input id="c-postcode" name="postcode" type="text" autocomplete="postal-code"></div>
      </div>
      <div class="field"><label for="c-onderwerp">Waar gaat uw vraag over?</label><select id="c-onderwerp" name="onderwerp">{opts}</select></div>
      <div class="field"><label for="c-bericht">Wat wilt u laten doen?</label><textarea id="c-bericht" name="bericht" required></textarea></div>
      <button class="btn btn--primary" type="submit">Aanvraag opstellen in e-mail</button>
      <p class="fine" id="c-status" role="status">Uw e-mailprogramma opent met een ingevuld bericht aan {b["email"]}. Daar kunt u ook foto's toevoegen.</p>
    </form>
  </div>
</section>'''


def layout(page):
    base = page["base"]
    path = page["path"]
    canonical = SITE_URL + path
    nav = ''.join(
        f'<a href="{base}{href}"{" aria-current=\"page\"" if href == path else ""}>{label}</a>' for href, label in NAV)
    graph = [business_ld(), {"@type": "WebSite", "@id": SITE_URL + "#site", "url": SITE_URL, "name": BEDRIJF["naam"], "inLanguage": "nl-NL"}]
    if path:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL},
            {"@type": "ListItem", "position": 2, "name": page["crumb"], "item": canonical}]})
    graph += page.get("ld", [])
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
    scripts = ''.join(f'<script src="{base}assets/{s}" defer></script>' for s in page.get("scripts", ["site.js"]))
    b = BEDRIJF
    robots = '<meta name="robots" content="noindex">' if page.get("noindex") else ''
    body = page["body"].replace("{base}", base)
    contact = contact_block(page.get("onderwerp", "Laadpaal")) if page.get("contact", True) else ''
    return f'''<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{page["title"]}</title>
<meta name="description" content="{page["description"]}">
{robots}<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#0f2231">
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_NL">
<meta property="og:site_name" content="{b["naam"]}">
<meta property="og:title" content="{page["title"]}">
<meta property="og:description" content="{page["description"]}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE_URL}images/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{base}icon.svg" type="image/svg+xml">
<link rel="preload" href="{base}assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{base}assets/site.css">
<script type="application/ld+json">{ld}</script>
</head>
<body>
<a class="skip" href="#inhoud">Naar de inhoud</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="{base or "./"}" aria-label="{b["naam"]}, naar de homepage">{LOGO}<span>Ohand<span>Elektra</span></span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Hoofdmenu">
      {nav}
      <a class="nav-tel" href="tel:{b["telefoon_link"]}">{b["telefoon_tekst"]}</a>
      <a class="btn btn--primary" href="{"#contact" if page.get("contact", True) else base + "#contact"}">Offerte aanvragen</a>
    </nav>
  </div>
  <span class="wires" aria-hidden="true"></span>
</header>
<main id="inhoud">
{body}
{contact.replace("{base}", base)}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="{base or "./"}">{LOGO}<span>Ohand<span>Elektra</span></span></a>
        <p>Zelfstandig elektrotechnisch installatiebedrijf voor laadpalen, thuisbatterijen en elektra. Veilig aangelegd, netjes afgewerkt.</p>
      </div>
      <div>
        <h2>Diensten</h2>
        <ul>
          <li><a href="{base}laadpaal-installeren/">Laadpaal installeren</a></li>
          <li><a href="{base}thuisbatterij/">Thuisbatterij en configurator</a></li>
          <li><a href="{base}elektra/#groepenkast">Groepenkast vervangen</a></li>
          <li><a href="{base}elektra/#verbouwing">Elektra bij verbouwing</a></li>
          <li><a href="{base}elektra/#zakelijk">Zakelijke installaties</a></li>
        </ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li><a href="tel:{b["telefoon_link"]}">{b["telefoon_tekst"]}</a></li>
          <li><a href="mailto:{b["email"]}">{b["email"]}</a></li>
          <li>{b["adres"]}</li>
          <li>KvK {b["kvk"]}</li>
        </ul>
      </div>
    </div>
    <div class="foot-base">
      <span>© {date.today().year} {b["naam"]}</span>
      <span><a href="{base}privacyverklaring/">Privacyverklaring</a></span>
      <span>Foto's: Unsplash (sfeerbeelden)</span>
    </div>
  </div>
</footer>
{scripts}
</body>
</html>
'''


# ───────────────────────── Pagina's ─────────────────────────

FAQ_HOME = [
    ("Kan ik een laadpaal laten installeren bij mijn woning?",
     "Meestal wel, als u een eigen oprit of parkeerplaats heeft. Wij bekijken of uw meterkast en aansluiting voldoende ruimte bieden en adviseren zo nodig over een uitbreiding. Parkeert u aan de openbare weg, dan gelden de regels van uw gemeente."),
    ("Is mijn woning geschikt voor een thuisbatterij?",
     "Dat hangt af van uw zonnepanelen, uw omvormer, uw stroomverbruik en de ruimte in en rond uw meterkast. Met de configurator op deze site krijgt u een eerste indicatie. Daarna kijken wij naar uw bestaande installatie en vertellen wij eerlijk of een thuisbatterij voor u zinvol is."),
    ("Wanneer moet mijn groepenkast worden vervangen?",
     "Een groepenkast heeft geen vaste houdbaarheidsdatum. Vervangen is verstandig als de kast nog met stoppen werkt, als er geen aardlekschakelaar in zit, als groepen regelmatig uitvallen of als u extra groepen nodig heeft voor een inductiekookplaat, laadpaal of warmtepomp."),
    ("Kan ik foto's meesturen voor een offerte?",
     "Ja, graag zelfs. Een foto van uw meterkast en van de plek waar het werk moet gebeuren geeft ons snel een goed beeld. Soms is daarnaast een bezoek nodig om een nauwkeurige offerte te maken."),
    ("Wat bepaalt de kosten van elektrotechnisch werk?",
     "De omvang van het werk, de staat van uw bestaande installatie, de gekozen materialen en hoe goed leidingen bereikbaar zijn. U ontvangt vooraf een duidelijke offerte, zodat u weet waar u aan toe bent."),
]

HOME = f'''
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <h1>Elektricien voor laadpalen, thuisbatterijen en elektra</h1>
      <p class="lead">Ohand Elektra sluit uw laadpaal of thuisbatterij veilig aan en zorgt dat uw meterkast erop berekend is. U spreekt met de vakman die het werk ook uitvoert.</p>
      <div class="btn-row">
        <a class="btn btn--primary" href="#contact">Offerte aanvragen</a>
        <a class="btn btn--ghost" href="{{base}}thuisbatterij/#configurator">Bereken uw thuisbatterij</a>
      </div>
      <ul class="hero-facts">
        <li>Eén vast aanspreekpunt</li>
        <li>Heldere offerte vooraf</li>
        <li>Werk volgens de geldende normen</li>
      </ul>
    </div>
    <div class="quick" id="quick">
      <h2>Welke thuisbatterij past bij u?</h2>
      <p class="sub">Schuif naar uw situatie en zie direct een indicatie.</p>
      <div class="field">
        <label for="q-verbruik">Stroomverbruik per jaar <output id="q-verbruik-out" for="q-verbruik"></output></label>
        <input type="range" id="q-verbruik" min="1500" max="10000" step="100" value="3500">
      </div>
      <div class="field">
        <label for="q-panelen">Zonnepanelen <output id="q-panelen-out" for="q-panelen"></output></label>
        <input type="range" id="q-panelen" min="0" max="36" step="1" value="12">
      </div>
      <div class="quick-out" aria-live="polite">
        <div><strong id="q-cap">–</strong><span>passende capaciteit</span></div>
        <div><strong id="q-save">–</strong><span>geschatte besparing per jaar</span></div>
      </div>
      <a class="btn btn--primary" id="q-link" href="{{base}}thuisbatterij/#configurator">Volledige berekening met terugverdientijd</a>
      <p class="fine">Indicatie op basis van gemiddelden. De volledige berekening houdt ook rekening met uw auto, warmtepomp en energiecontract.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Waarmee kunnen wij u helpen?</h2>
    <p class="lead">Drie dingen doen wij het meest. Alle drie beginnen bij dezelfde vraag: kan uw installatie het aan?</p>
    <div class="lanes">
      <article class="lane">
        <a class="lane-img" href="{{base}}laadpaal-installeren/" tabindex="-1" aria-hidden="true">{img("laadpaal-oprit", "", "(max-width: 860px) 100vw, 33vw", 1200, 801)}</a>
        <h3>Laadpaal installeren</h3>
        <ul>
          <li>Controle van meterkast en aansluiting</li>
          <li>Eigen groep met de juiste beveiliging</li>
          <li>Load balancing, zodat de hoofdzekering niet uitvalt</li>
        </ul>
        <a class="more" href="{{base}}laadpaal-installeren/">Alles over laadpalen</a>
      </article>
      <article class="lane">
        <a class="lane-img" href="{{base}}thuisbatterij/" tabindex="-1" aria-hidden="true">{img("thuisbatterij", "", "(max-width: 860px) 100vw, 33vw")}</a>
        <h3>Thuisbatterij plaatsen</h3>
        <ul>
          <li>Advies op basis van uw eigen verbruik en opwek</li>
          <li>Afgestemd op uw zonnepanelen en omvormer</li>
          <li>Eerlijk, ook als het voor u nog niet loont</li>
        </ul>
        <a class="more" href="{{base}}thuisbatterij/">Thuisbatterij berekenen</a>
      </article>
      <article class="lane">
        <a class="lane-img" href="{{base}}elektra/" tabindex="-1" aria-hidden="true">{img("groepenkast-detail", "", "(max-width: 860px) 100vw, 33vw")}</a>
        <h3>Groepenkast en elektra</h3>
        <ul>
          <li>Groepenkast vervangen of uitbreiden</li>
          <li>Bedrading, stopcontacten en verlichting bij verbouwing</li>
          <li>Projecten voor aannemers en vastgoedbeheerders</li>
        </ul>
        <a class="more" href="{{base}}elektra/">Alle elektrawerkzaamheden</a>
      </article>
    </div>
  </div>
</section>

<section class="section section--mist">
  <div class="wrap split">
    <div>
      <h2>Na 2027 loont zelf gebruiken meer dan terugleveren</h2>
      <p>Op 1 januari 2027 stopt de salderingsregeling. Stroom die u teruglevert, mag u dan niet meer wegstrepen tegen wat u afneemt. Wat uw panelen overdag opwekken, wilt u dus zoveel mogelijk zelf gebruiken: in de avond, voor de auto of voor de warmtepomp.</p>
      <p>Een thuisbatterij of een laadpaal die op zonnestroom laadt helpt daarbij. Of het voor u uit kan, hangt af van uw verbruik. Daarom rekenen wij het eerst met u door.</p>
      <div class="btn-row"><a class="btn btn--primary" href="{{base}}thuisbatterij/#configurator">Reken uw situatie door</a></div>
    </div>
    {img("monteur-meterkast", "Monteur werkt aan een meterkast", w=1200, h=675)}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Van uw vraag naar een veilige installatie</h2>
    <ol class="steps">
      <li><h3>U vertelt wat u nodig heeft</h3><p>Bel, mail of vul het formulier in. Een korte omschrijving is genoeg. Foto's van uw meterkast helpen ons op weg.</p></li>
      <li><h3>Wij maken een passend voorstel</h3><p>We bespreken de mogelijkheden, komen zo nodig langs en zetten werk, planning en prijs helder op een rij.</p></li>
      <li><h3>Na akkoord plannen we het werk</h3><p>U weet vooraf wanneer we komen en hoelang het duurt. Na afloop lopen we de installatie samen met u door.</p></li>
    </ol>
  </div>
</section>

<section class="section section--mist">
  <div class="wrap">
    <h2>Zo werkt Ohand Elektra</h2>
    <dl class="facts">
      <div><dt>Persoonlijk contact</dt><dd>Eén aanspreekpunt, van de eerste vraag tot de oplevering. U spreekt met de vakman die het werk uitvoert.</dd></div>
      <div><dt>Duidelijke afspraken</dt><dd>Vooraf een heldere offerte: wat we doen, wanneer we komen en wat het kost.</dd></div>
      <div><dt>Vakkundige installatie</dt><dd>Wij werken volgens de geldende normen en controleren de installatie voordat we deze opleveren.</dd></div>
      <div><dt>Nette afwerking</dt><dd>Strakke bedrading, een overzichtelijke meterkast en een opgeruimde werkplek als we vertrekken.</dd></div>
    </dl>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Veelgestelde vragen</h2>
    {faq_html(FAQ_HOME)}
  </div>
</section>
'''

FAQ_LAADPAAL = [
    ("Is mijn meterkast geschikt voor een laadpaal?",
     "Een laadpaal krijgt een eigen groep met een eigen beveiliging. Is daar in uw groepenkast geen ruimte voor, dan breiden wij de kast uit. Wij controleren ook of uw hoofdaansluiting het extra vermogen aankan."),
    ("Hoe snel laadt een laadpaal thuis?",
     "Op een 1-fase aansluiting laadt u met maximaal 3,7 kW (16 ampère) of 7,4 kW (32 ampère). Op een 3-fase aansluiting van 3 x 25 ampère is 11 kW gebruikelijk. Hoe snel het in de praktijk gaat, hangt ook af van wat uw auto aankan."),
    ("Wat is load balancing en heb ik het nodig?",
     "Load balancing meet hoeveel stroom uw huis op dat moment gebruikt en past het laadvermogen daarop aan. Zo valt de hoofdzekering niet uit als u tegelijk kookt en laadt. Bij vrijwel elke thuislaadpaal raden wij het aan."),
    ("Kan ik laden met stroom van mijn eigen zonnepanelen?",
     "Ja. Veel laadpalen kunnen het laden afstemmen op wat uw panelen op dat moment opwekken. Na het einde van de salderingsregeling op 1 januari 2027 wordt dat extra interessant."),
    ("Kan ik een laadpaal krijgen als ik aan de openbare weg parkeer?",
     "Een eigen laadpaal mag alleen op eigen terrein. Parkeert u aan de openbare weg, dan kunt u bij uw gemeente een openbare laadpaal aanvragen. De regels verschillen per gemeente."),
    ("Verzorgen jullie ook laadpalen voor bedrijven?",
     "Ja. Voor bedrijven en verenigingen van eigenaren leggen wij een of meer laadpunten aan, met load balancing over de laadpunten en zo nodig verrekening per gebruiker."),
]

LAADPAAL = f'''
<section class="page-hero">
  <div class="wrap page-hero-grid">
    <div>
      <p class="crumbs"><a href="{{base}}">Home</a> / Laadpalen</p>
      <h1>Laadpaal laten installeren bij uw woning of bedrijf</h1>
      <p class="lead">Wij controleren of uw meterkast er klaar voor is, leggen een eigen groep aan en plaatsen de laadpaal netjes op uw oprit of aan de gevel.</p>
      <div class="btn-row">
        <a class="btn btn--primary" href="#contact">Offerte voor een laadpaal</a>
        <a class="btn btn--ghost" href="#vermogen">Welk laadvermogen past?</a>
      </div>
    </div>
    {img("laadpaal-oprit", "Elektrische auto aan een laadpaal op de oprit", lazy=False, w=1200, h=801)}
  </div>
</section>

<section class="section">
  <div class="wrap split">
    {img("laadpaal-gevel", "Laadpaal met opgerolde kabel aan een houten gevel", w=800, h=1200)}
    <div>
      <h2>Wat wij voor u regelen</h2>
      <p>Een laadpaal is meer dan een kastje aan de muur. Hij vraagt urenlang veel vermogen van uw installatie. Daarom beginnen wij in de meterkast.</p>
      <ul class="ticks">
        <li>Controle van uw groepenkast en hoofdaansluiting</li>
        <li>Een eigen groep met de juiste aardlekbeveiliging</li>
        <li>Kabeltracé van de meterkast naar de laadpaal, binnen en buiten</li>
        <li>Load balancing, zodat laden en koken samen kunnen</li>
        <li>Instellen van de laadpaal, ook voor laden op zonnestroom</li>
        <li>Uitleg bij oplevering en een geteste installatie</li>
      </ul>
    </div>
  </div>
</section>

<section class="section section--mist" id="vermogen">
  <div class="wrap">
    <h2>Welk laadvermogen past bij uw aansluiting?</h2>
    <p class="lead">Uw aansluiting bepaalt hoe snel u thuis kunt laden. Op uw slimme meter of in de meterkast staat welke u heeft. Weet u het niet? Stuur een foto mee.</p>
    <div class="table-scroll">
      <table>
        <thead><tr><th scope="col">Aansluiting</th><th scope="col">Laadvermogen</th><th scope="col">Bereik per uur laden*</th><th scope="col">Geschikt voor</th></tr></thead>
        <tbody>
          <tr><th scope="row">1-fase, 16 A</th><td>3,7 kW</td><td>circa 20 km</td><td>Plug-in hybride, weinig kilometers</td></tr>
          <tr><th scope="row">1-fase, 32 A</th><td>7,4 kW</td><td>circa 40 km</td><td>Volledig elektrisch, 's nachts vol</td></tr>
          <tr><th scope="row">3-fase, 16 A</th><td>11 kW</td><td>circa 60 km</td><td>De meeste elektrische auto's</td></tr>
        </tbody>
      </table>
    </div>
    <p class="lead" style="font-size:.95rem;margin-top:14px">* Bij een verbruik van ongeveer 18 kWh per 100 km. Uw auto bepaalt mee hoe snel hij laadt.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>In drie stappen een werkende laadpaal</h2>
    <ol class="steps">
      <li><h3>Foto's en wensen</h3><p>U stuurt een foto van uw meterkast en van de plek waar de laadpaal moet komen. Wij beoordelen wat er nodig is.</p></li>
      <li><h3>Offerte op maat</h3><p>U krijgt een offerte met het werk in de meterkast, het kabeltracé en de laadpaal. Zonder verrassingen achteraf.</p></li>
      <li><h3>Installatie en uitleg</h3><p>Wij installeren, testen en stellen de laadpaal in. U krijgt uitleg over laden, de app en load balancing.</p></li>
    </ol>
  </div>
</section>

<section class="section section--mist">
  <div class="wrap">
    <h2>Veelgestelde vragen over laadpalen</h2>
    {faq_html(FAQ_LAADPAAL)}
  </div>
</section>
'''

FAQ_BATTERIJ = [
    ("Hoe groot moet een thuisbatterij zijn?",
     "Dat hangt af van uw stroomverbruik in de avond en nacht en van wat uw zonnepanelen overdag overhouden. Voor veel huishoudens met zonnepanelen komt de berekening uit tussen 5 en 10 kWh. Een grotere batterij slaat meer op, maar staat in de winter vaker leeg en verdient zich daardoor langzamer terug."),
    ("Wat is de terugverdientijd van een thuisbatterij?",
     "Die verschilt sterk per woning. Ze hangt af van uw verbruik, het aantal zonnepanelen, uw stroomprijs, de vergoeding voor terugleveren en de aanschafprijs. De configurator op deze pagina rekent het door met uw eigen gegevens en laat de aannames zien."),
    ("Waarom wordt een thuisbatterij interessanter na 2027?",
     "Op 1 januari 2027 stopt de salderingsregeling. Teruggeleverde stroom wordt dan niet meer weggestreept tegen wat u afneemt. U krijgt er een lagere vergoeding voor, en sommige leveranciers rekenen terugleverkosten. Zelf gebruiken van uw eigen stroom levert dan meer op."),
    ("Kan een thuisbatterij bij mijn bestaande zonnepanelen?",
     "Meestal wel. Een batterij kan naast uw bestaande omvormer worden geplaatst (AC-gekoppeld), of samen met een hybride omvormer. Wij kijken naar uw omvormer, de ruimte bij uw meterkast en uw aansluiting."),
    ("Heb ik een 3-fase aansluiting nodig?",
     "Niet altijd. Kleinere batterijen werken op een 1-fase aansluiting. Bij grotere vermogens, of als u ook een laadpaal of warmtepomp heeft, is 3-fase vaak beter. Wij adviseren hierover bij de offerte."),
    ("Waar komt de thuisbatterij te staan?",
     "Bij voorkeur in een droge, vorstvrije ruimte dicht bij de meterkast, zoals een garage, berging of technische ruimte. Wij letten daarbij op ventilatie en brandveiligheid volgens de voorschriften van de fabrikant."),
]

BATTERIJ = f'''
<section class="page-hero">
  <div class="wrap page-hero-grid">
    <div>
      <p class="crumbs"><a href="{{base}}">Home</a> / Thuisbatterijen</p>
      <h1>Thuisbatterij: bereken welke capaciteit bij u past</h1>
      <p class="lead">Vul uw verbruik en zonnepanelen in. U ziet direct hoeveel kWh opslag past, wat het ongeveer oplevert en wanneer u de investering terugverdient.</p>
      <div class="btn-row">
        <a class="btn btn--primary" href="#configurator">Start de berekening</a>
        <a class="btn btn--ghost" href="#contact">Vraag advies aan</a>
      </div>
    </div>
    {img("thuisbatterij", "Thuisbatterij met omvormer aan de wand", lazy=False)}
  </div>
</section>

<section class="section section--mist" id="configurator">
  <div class="wrap">
    <h2>Thuisbatterij-configurator</h2>
    <p class="lead">Zes vragen over uw woning. De uitkomst rechts rekent bij elke wijziging mee.</p>
    <div class="cfg">
      <form class="cfg-form" id="cfg-form">
        <p class="cfg-step">Uw stroomverbruik</p>
        <div class="field">
          <label for="f-verbruik">Hoeveel stroom verbruikt u? <output id="verbruik-out" for="f-verbruik"></output></label>
          <input type="range" id="f-verbruik" name="verbruik" min="1000" max="12000" step="100" value="3500">
          <p class="hint">Staat op uw jaarafrekening. Weet u het niet? Kies een huishouden:</p>
          <div class="chips" style="margin-top:8px">
            <button type="button" class="btn btn--ghost" style="min-height:44px;padding:6px 14px" data-preset="1800">1 persoon</button>
            <button type="button" class="btn btn--ghost" style="min-height:44px;padding:6px 14px" data-preset="2800">2 personen</button>
            <button type="button" class="btn btn--ghost" style="min-height:44px;padding:6px 14px" data-preset="4000">Gezin</button>
            <button type="button" class="btn btn--ghost" style="min-height:44px;padding:6px 14px" data-preset="5500">Groot gezin</button>
          </div>
        </div>
        <label class="check"><input type="checkbox" name="auto"><span>Ik laad thuis een elektrische auto<small>Telt 2.500 kWh per jaar bij uw verbruik op. Laat uit als dit al in uw jaarverbruik zit.</small></span></label>
        <label class="check"><input type="checkbox" name="warmtepomp"><span>Ik heb een warmtepomp<small>Telt 2.500 kWh per jaar bij uw verbruik op. Laat uit als dit al in uw jaarverbruik zit.</small></span></label>
        <hr>
        <p class="cfg-step">Uw zonnepanelen</p>
        <div class="field">
          <label for="f-panelen">Hoeveel zonnepanelen heeft u? <output id="panelen-out" for="f-panelen"></output></label>
          <input type="range" id="f-panelen" name="panelen" min="0" max="40" step="1" value="12">
        </div>
        <fieldset class="field">
          <legend>Is er overdag meestal iemand thuis?</legend>
          <div class="chips">
            <label><input type="radio" name="thuis" value="ja"><span>Ja</span></label>
            <label><input type="radio" name="thuis" value="deels" checked><span>Deels</span></label>
            <label><input type="radio" name="thuis" value="nee"><span>Nee</span></label>
          </div>
        </fieldset>
        <hr>
        <p class="cfg-step">Uw contract en aansluiting</p>
        <fieldset class="field">
          <legend>Welk energiecontract heeft u?</legend>
          <div class="chips">
            <label><input type="radio" name="contract" value="vast of variabel" checked><span>Vast of variabel</span></label>
            <label><input type="radio" name="contract" value="dynamisch"><span>Dynamisch (uurprijzen)</span></label>
          </div>
        </fieldset>
        <fieldset class="field">
          <legend>Welke aansluiting heeft u?</legend>
          <div class="chips">
            <label><input type="radio" name="fase" value="1"><span>1-fase</span></label>
            <label><input type="radio" name="fase" value="3"><span>3-fase</span></label>
            <label><input type="radio" name="fase" value="?" checked><span>Weet ik niet</span></label>
          </div>
        </fieldset>
        <details class="adv">
          <summary>Aannames aanpassen (prijzen en tarieven)</summary>
          <div class="adv-grid">
            <div class="field"><label for="f-stroomprijs">Stroomprijs, € per kWh</label><input id="f-stroomprijs" name="stroomprijs" type="number" step="0.01" min="0" value="0.28" inputmode="decimal"></div>
            <div class="field"><label for="f-teruglever">Terugleververgoeding netto, € per kWh</label><input id="f-teruglever" name="teruglever" type="number" step="0.01" value="0.02" inputmode="decimal"></div>
            <div class="field"><label for="f-prijsvast">Richtprijs installatie, vast deel in €</label><input id="f-prijsvast" name="prijsvast" type="number" step="50" min="0" value="1200" inputmode="numeric"></div>
            <div class="field"><label for="f-prijskwh">Richtprijs per kWh opslag in €</label><input id="f-prijskwh" name="prijskwh" type="number" step="10" min="0" value="450" inputmode="numeric"></div>
            <div class="field"><label for="f-wp">Vermogen per paneel in Wp</label><input id="f-wp" name="wp" type="number" step="5" min="100" value="400" inputmode="numeric"></div>
          </div>
          <p class="hint" style="margin-bottom:16px">Terugleververgoeding netto: wat u per kWh overhoudt na terugleverkosten. Dat kan ook negatief zijn.</p>
        </details>
      </form>

      <div class="cfg-result" aria-live="polite">
        <h3>Passende capaciteit voor uw situatie</h3>
        <div class="batt">
          <div class="batt-num" id="r-cap">–</div>
          <div class="batt-cells" id="batt-cells" aria-hidden="true"></div>
        </div>
        <p class="verdict" id="r-verdict"></p>
        <div class="kpis">
          <div><strong id="r-save">–</strong><span>besparing per jaar</span></div>
          <div><strong id="r-payback">–</strong><span>terugverdientijd</span></div>
          <div><strong id="r-profit">–</strong><span id="r-profit-label">winst na 15 jaar</span></div>
        </div>
        <div class="self">
          <h3>Aandeel van uw verbruik uit eigen zonnestroom</h3>
          <div class="self-row"><span>Zonder batterij</span><div class="self-bar"><i id="r-self0"></i></div><b id="r-self0-n"></b></div>
          <div class="self-row"><span>Met batterij</span><div class="self-bar"><i class="with" id="r-self1"></i></div><b id="r-self1-n"></b></div>
        </div>
        <div class="chart">
          <h3>Saldo van uw investering over 15 jaar</h3>
          <svg id="r-chart" role="img" aria-label="Grafiek: het saldo begint op min de investering en stijgt elk jaar met de besparing"></svg>
        </div>
        <ul class="cfg-notes">
          <li>Richtprijs inclusief installatie en btw: <span id="r-cost"></span>. De werkelijke prijs volgt uit onze offerte.</li>
          <li id="r-fase" hidden>Bij deze capaciteit is een 3-fase aansluiting vaak nodig. Wij kijken dit voor u na.</li>
          <li>Schatting op basis van gemiddelden, geen garantie. Gerekend zonder salderen (situatie vanaf 2027).</li>
        </ul>
        <button class="btn btn--primary" type="button" id="r-send">Vraag advies aan met deze berekening</button>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split split--flip">
    <div>
      <h2>Zo rekent de configurator</h2>
      <p>Zonnepanelen leveren het meest als u het minst verbruikt: midden op de dag. Zonder batterij gebruikt een gemiddeld huishouden daardoor ongeveer een derde van de eigen opwek direct. De rest gaat het net op.</p>
      <p>Een batterij schuift dat overschot door naar de avond en nacht. De configurator schat hoeveel kWh u daarmee extra zelf gebruikt en zet die tegen uw stroomprijs. Daarvan gaat af wat u anders voor terugleveren had gekregen.</p>
      <ul class="ticks">
        <li>Gerekend met de situatie zonder salderen, vanaf 2027</li>
        <li>Laad- en ontlaadverlies van 10 procent meegenomen</li>
        <li>Rekening gehouden met veroudering van de batterij</li>
        <li>Alle prijzen en tarieven kunt u zelf aanpassen</li>
      </ul>
      <p style="margin-top:20px">Wat een thuisbatterij oplevert, verschilt per woning. Wij beloven daarom geen vaste besparing: de configurator geeft een indicatie, de offerte volgt na een blik op uw installatie.</p>
    </div>
    {img("groepenkast", "Groepenkast met automaten en nette bedrading")}
  </div>
</section>

<section class="section section--mist">
  <div class="wrap">
    <h2>Van berekening naar werkende batterij</h2>
    <ol class="steps">
      <li><h3>Indicatie</h3><p>U rekent uw situatie door en stuurt de uitkomst mee met uw aanvraag.</p></li>
      <li><h3>Controle van uw installatie</h3><p>Wij kijken naar uw zonnepanelen, omvormer, meterkast en de plek voor de batterij.</p></li>
      <li><h3>Plaatsing en uitleg</h3><p>Dezelfde vakman installeert de batterij, stelt hem in en legt uit hoe u de opbrengst volgt.</p></li>
    </ol>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Veelgestelde vragen over thuisbatterijen</h2>
    {faq_html(FAQ_BATTERIJ)}
  </div>
</section>
'''

FAQ_ELEKTRA = [
    FAQ_HOME[2],
    ("Hoelang duurt het vervangen van een groepenkast?",
     "Een groepenkast in een woning vervangen wij meestal binnen één werkdag. In die tijd is de stroom tijdelijk uitgeschakeld. Vooraf hoort u hoelang dat ongeveer duurt."),
    ("Heb ik een 3-fase aansluiting nodig?",
     "Voor een inductiekookplaat, laadpaal van 11 kW of warmtepomp is een 3-fase aansluiting vaak nodig of verstandig. De verzwaring zelf vraagt u aan bij uw netbeheerder. Wij maken uw groepenkast erop klaar en adviseren u bij de aanvraag."),
    FAQ_HOME[3],
    FAQ_HOME[4],
]

ELEKTRA = f'''
<section class="page-hero">
  <div class="wrap page-hero-grid">
    <div>
      <p class="crumbs"><a href="{{base}}">Home</a> / Elektra</p>
      <h1>Groepenkast, bedrading en elektra bij verbouwing</h1>
      <p class="lead">Van een extra groep voor uw kookplaat tot de complete installatie van een verbouwde woning. Veilig aangelegd en netjes afgewerkt.</p>
      <div class="btn-row">
        <a class="btn btn--primary" href="#contact">Offerte aanvragen</a>
      </div>
    </div>
    {img("groepenkast-detail", "Groepenkast met aardlekschakelaars", lazy=False)}
  </div>
</section>

<section class="section" id="groepenkast">
  <div class="wrap split">
    <div>
      <h2>Groepenkast vervangen of uitbreiden</h2>
      <p>Is uw groepenkast verouderd, of heeft u extra groepen nodig voor een inductiekookplaat, laadpaal, warmtepomp of thuisbatterij? Wij zorgen voor een passende en veilige kast.</p>
      <ul class="ticks">
        <li>Vervangen van kasten met stoppen of zonder aardlekschakelaar</li>
        <li>Extra groepen en krachtgroepen</li>
        <li>Voorbereid op 3-fase, laadpaal en thuisbatterij</li>
        <li>Overzichtelijk gecodeerd en gemeten opgeleverd</li>
      </ul>
    </div>
    {img("groepenkast", "Nieuwe groepenkast met automaten")}
  </div>
</section>

<section class="section section--mist" id="verbouwing">
  <div class="wrap split split--flip">
    <div>
      <h2>Elektra bij verbouwing en renovatie</h2>
      <p>Gaat u verbouwen? Wij leggen bedrading, stopcontacten, schakelaars en verlichting aan, afgestemd op uw plannen en op de planning van uw aannemer.</p>
      <ul class="ticks">
        <li>Nieuwe leidingen en wandcontactdozen</li>
        <li>Verlichtingsplan en schakelmateriaal</li>
        <li>Aansluiten van keuken, badkamer en uitbouw</li>
        <li>Vervangen van verouderde bedrading</li>
      </ul>
    </div>
    {img("bedrading-verbouwing", "Bedrading in een inbouwdoos tijdens een verbouwing")}
  </div>
</section>

<section class="section" id="zakelijk">
  <div class="wrap split">
    <div>
      <h2>Zakelijke installaties</h2>
      <p>Voor aannemers, installatiebedrijven en vastgoedbeheerders verzorgen wij elektrotechnische projecten in woningbouw en utiliteit. Met een heldere planning en één vast aanspreekpunt.</p>
      <ul class="ticks">
        <li>Woningbouw en utiliteitsbouw</li>
        <li>Renovatie en transformatie</li>
        <li>Beheer en onderhoud</li>
        <li>Laadpunten voor personeel en bezoekers</li>
      </ul>
      <div class="btn-row"><a class="btn btn--ghost" href="#contact">Bespreek uw project</a></div>
    </div>
    {img("zakelijk-schakelkast", "Schakelkast in een bedrijfspand", w=1200, h=800)}
  </div>
</section>

<section class="section section--mist">
  <div class="wrap">
    <h2>Veelgestelde vragen over elektra</h2>
    {faq_html(FAQ_ELEKTRA)}
  </div>
</section>
'''

PRIVACY = '''
<section class="section">
  <div class="wrap prose">
    <h1>Privacyverklaring</h1>
    <p>De privacyverklaring van Ohand Elektra wordt op deze pagina gepubliceerd zodra de website in gebruik wordt genomen.</p>
    <h2>Wat deze website nu doet</h2>
    <p>Deze website plaatst geen cookies en gebruikt geen meetprogramma's. Lettertypen en afbeeldingen worden vanaf de website zelf geladen, niet vanaf servers van derden.</p>
    <p>De thuisbatterij-configurator rekent in uw eigen browser. Wat u daar invult, wordt niet verzonden of opgeslagen.</p>
    <p>Het contactformulier opent uw eigen e-mailprogramma. Pas als u die e-mail verstuurt, ontvangen wij uw gegevens.</p>
    <p><a href="{base}">Terug naar de homepage</a></p>
  </div>
</section>
'''

NOTFOUND = '''
<section class="section">
  <div class="wrap prose">
    <h1>Deze pagina bestaat niet</h1>
    <p>De pagina is verplaatst of het adres klopt niet. Kies hieronder waar u naartoe wilt.</p>
    <ul>
      <li><a href="{base}laadpaal-installeren/">Laadpaal installeren</a></li>
      <li><a href="{base}thuisbatterij/">Thuisbatterij en configurator</a></li>
      <li><a href="{base}elektra/">Groepenkast en elektra</a></li>
      <li><a href="{base}">Homepage</a></li>
    </ul>
  </div>
</section>
'''

CALC = ["calc.js", "site.js"]

PAGES = [
    dict(path="", base="", crumb="Home", scripts=CALC,
         title="Ohand Elektra | Laadpaal, thuisbatterij en elektra laten installeren",
         description="Elektricien voor laadpalen, thuisbatterijen, groepenkasten en elektra. Bereken welke thuisbatterij bij u past en vraag een heldere offerte aan.",
         body=HOME, ld=[faq_ld(FAQ_HOME)]),
    dict(path="laadpaal-installeren/", base="../", crumb="Laadpaal installeren", onderwerp="Laadpaal",
         title="Laadpaal laten installeren | Ohand Elektra",
         description="Laadpaal thuis of op de zaak laten installeren. Controle van uw meterkast, eigen groep, load balancing en laden op zonnestroom. Vraag een offerte aan.",
         body=LAADPAAL, ld=[faq_ld(FAQ_LAADPAAL), {"@type": "Service", "name": "Laadpaal installeren", "serviceType": "Installatie van laadpalen voor elektrische auto's", "provider": {"@id": SITE_URL + "#bedrijf"}}]),
    dict(path="thuisbatterij/", base="../", crumb="Thuisbatterij", onderwerp="Thuisbatterij", scripts=CALC,
         title="Thuisbatterij berekenen: capaciteit en terugverdientijd | Ohand Elektra",
         description="Bereken met de thuisbatterij-configurator hoeveel kWh opslag bij uw woning past, wat het oplevert en wat de terugverdientijd is. Gerekend zonder salderen.",
         body=BATTERIJ, ld=[faq_ld(FAQ_BATTERIJ), {"@type": "Service", "name": "Thuisbatterij plaatsen", "serviceType": "Advies en installatie van thuisbatterijen", "provider": {"@id": SITE_URL + "#bedrijf"}},
                            {"@type": "WebApplication", "name": "Thuisbatterij-configurator", "url": SITE_URL + "thuisbatterij/#configurator", "applicationCategory": "UtilitiesApplication", "operatingSystem": "Alle", "inLanguage": "nl-NL", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}}]),
    dict(path="elektra/", base="../", crumb="Elektra", onderwerp="Groepenkast",
         title="Groepenkast vervangen en elektra bij verbouwing | Ohand Elektra",
         description="Groepenkast vervangen of uitbreiden, bedrading en stopcontacten bij verbouwing en zakelijke installaties. Veilig aangelegd, netjes afgewerkt.",
         body=ELEKTRA, ld=[faq_ld(FAQ_ELEKTRA)]),
    dict(path="privacyverklaring/", base="../", crumb="Privacyverklaring", contact=False,
         title="Privacyverklaring | Ohand Elektra",
         description="Hoe Ohand Elektra omgaat met uw gegevens op deze website.", body=PRIVACY),
]


def main():
    for p in PAGES:
        out = ROOT / p["path"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(layout(p), encoding="utf-8")
    # 404 staat op de hoofdmap en wordt vanaf elk pad getoond: daarom absolute verwijzingen.
    from urllib.parse import urlparse
    base = urlparse(SITE_URL).path
    (ROOT / "404.html").write_text(layout(dict(
        path="404.html", base=base, crumb="Niet gevonden", contact=False, noindex=True,
        title="Pagina niet gevonden | Ohand Elektra", description="Deze pagina bestaat niet.", body=NOTFOUND)), encoding="utf-8")
    today = date.today().isoformat()
    urls = ''.join(f'<url><loc>{SITE_URL}{p["path"]}</loc><lastmod>{today}</lastmod></url>' for p in PAGES)
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n', encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}sitemap.xml\n", encoding="utf-8")
    print(f"{len(PAGES) + 1} pagina's gebouwd")


if __name__ == "__main__":
    main()
