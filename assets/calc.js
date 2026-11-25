/* Rekenmodel voor de thuisbatterij-indicatie.
   Alles wat een prijs of een aanname is staat in AANNAMES, zodat het op één
   plek is aan te passen. De uitkomst is een schatting, geen offerte.

   Twee soorten batterij:
   - 'vast': door een installateur geplaatst, eigen groep, grotere capaciteit;
   - 'plug': stekkerbatterij (plug & play) op een stopcontact, kleiner en met
     een begrensd vermogen. Werkt ook zonder zonnepanelen, maar levert dan
     alleen iets op met een dynamisch contract. */
(function (root) {
  'use strict';

  var AANNAMES = {
    stroomprijs: 0.28,          // euro per kWh die u van het net afneemt
    terugleververgoeding: 0.05, // euro per kWh die de leverancier betaalt
    terugleverkosten: 0.03,     // euro per kWh die de leverancier rekent
    prijsVast: 1200,            // vaste batterij: omvormer/aansluiting/arbeid    -- RICHTPRIJS
    prijsPerKwh: 450,           // vaste batterij: euro per kWh                   -- RICHTPRIJS
    plugVast: 200,              // stekkerbatterij: meter/toebehoren              -- RICHTPRIJS
    plugPerKwh: 380,            // stekkerbatterij: euro per kWh                  -- RICHTPRIJS
    plugVermogen: 0.8,          // deel van het verbruik dat 800 watt kan dekken
    levensduur: 15,             // jaren waarover wordt gerekend
    rendement: 0.9,             // laden en ontladen samen
    bruikbaar: 0.9,             // deel van de capaciteit dat dagelijks wordt gebruikt
    cycliPerJaar: 280,          // volle cycli per jaar op zonnestroom in ons klimaat
    veroudering: 0.9,           // gemiddelde capaciteit over de levensduur
    opbrengstPerWp: 0.85,       // kWh per jaar per Wp zonnepaneel
    prijsverschil: 0.12,        // dynamisch contract: gemiddeld verschil tussen dal en piek, euro per kWh
    handelCycli: 300,           // dynamisch, zonder zonnepanelen: cycli per jaar op uurprijzen
    handelCycliMetZon: 120,     // dynamisch, met zonnepanelen: cycli die overblijven naast de zon
    verbruikAuto: 2500,         // kWh per jaar thuis laden
    verbruikWarmtepomp: 2500,   // kWh per jaar
    maten: [5, 7.5, 10, 12.5, 15, 20],
    plugMaten: [1.5, 2.5, 5]
  };

  var THUIS = { ja: 1.15, deels: 1, nee: 0.85 };

  /* Leveranciers die vooral dynamische contracten aanbieden. Tarieven staan
     hier bewust NIET: die verschillen per contract en veranderen te vaak. */
  var LEVERANCIERS = ['ANWB Energie', 'Budget Energie', 'Coolblue Energie', 'DELTA Energie', 'easyEnergy',
    'Eneco', 'Energiedirect', 'Engie', 'Essent', 'Frank Energie', 'Greenchoice', 'Innova Energie',
    'NextEnergy', 'Oxxio', 'Pure Energie', 'Tibber', 'UnitedConsumers', 'Vandebron', 'Vattenfall', 'Zonneplan'];
  var DYNAMISCH = ['anwb energie', 'easyenergy', 'frank energie', 'nextenergy', 'tibber', 'zonneplan'];
  function isDynamischeLeverancier(naam) {
    return DYNAMISCH.indexOf(String(naam || '').trim().toLowerCase()) !== -1;
  }

  function bereken(invoer, aannames) {
    var a = Object.assign({}, AANNAMES, aannames || {});
    var dynamisch = invoer.contract === 'dynamisch' || invoer.dynamisch === true;
    var verbruik = invoer.verbruik + (invoer.auto ? a.verbruikAuto : 0) + (invoer.warmtepomp ? a.verbruikWarmtepomp : 0);
    var opwek = invoer.panelen * (invoer.wp || 400) * a.opbrengstPerWp;
    var p = verbruik > 0 ? opwek / verbruik : 0;
    var nettoTeruglever = a.terugleververgoeding - a.terugleverkosten;

    // Deel van het verbruik dat direct uit de panelen komt, zonder batterij.
    var direct = Math.min(0.42 * (1 - Math.exp(-1.2 * p)) * (THUIS[invoer.thuis] || 1), p, 1);
    // Wat met een ruime batterij haalbaar is: 's winters blijft het net nodig.
    var plafond = Math.max(direct, 0.8 * (1 - Math.exp(-1.6 * p)));
    var directKwh = direct * verbruik;
    var overschot = Math.max(0, opwek - directKwh);

    function voorCapaciteit(cap, soort) {
      var plug = soort === 'plug';
      var bruikbaar = cap * a.bruikbaar;
      var b = verbruik > 0 ? bruikbaar / (verbruik / 1000) : 0;
      var extra = (plafond - direct) * (1 - Math.exp(-1.5 * b)) * verbruik * (plug ? a.plugVermogen : 1);
      extra = Math.max(0, Math.min(extra, bruikbaar * a.cycliPerJaar, overschot * a.rendement, verbruik - directKwh));
      var zon = extra * a.stroomprijs - (extra / a.rendement) * nettoTeruglever;
      var cycli = opwek > 0 ? a.handelCycliMetZon : a.handelCycli;
      var handel = dynamisch ? bruikbaar * cycli * a.prijsverschil * a.rendement : 0;
      var perJaar = Math.max(0, zon + handel) * a.veroudering;
      var kosten = plug ? a.plugVast + a.plugPerKwh * cap : a.prijsVast + a.prijsPerKwh * cap;
      return {
        soort: soort, capaciteit: cap, extraKwh: extra,
        besparingZon: Math.max(0, zon) * a.veroudering, besparingHandel: handel * a.veroudering,
        besparing: perJaar, kosten: kosten,
        terugverdientijd: perJaar > 0 ? kosten / perJaar : Infinity,
        winst: perJaar * a.levensduur - kosten,
        zelfMet: verbruik > 0 ? (directKwh + extra) / verbruik : 0
      };
    }

    function beste(maten, soort) {
      return maten.map(function (c) { return voorCapaciteit(c, soort); })
        .reduce(function (x, y) { return y.winst > x.winst ? y : x; });
    }
    var vast = beste(a.maten, 'vast'), plug = beste(a.plugMaten, 'plug');
    var advies = invoer.soort === 'vast' ? vast : invoer.soort === 'plug' ? plug : (plug.winst > vast.winst ? plug : vast);

    var oordeel;
    if (opwek === 0 && !dynamisch) oordeel = 'geen-zon';
    else if (advies.terugverdientijd <= 10) oordeel = 'gunstig';
    else if (advies.terugverdientijd <= a.levensduur) oordeel = 'haalbaar';
    else oordeel = 'niet-rendabel';

    return {
      verbruik: verbruik, opwek: opwek, zelfZonder: direct, overschot: overschot, dynamisch: dynamisch,
      advies: advies, vast: vast, plug: plug, oordeel: oordeel, aannames: a
    };
  }

  var api = { bereken: bereken, AANNAMES: AANNAMES, LEVERANCIERS: LEVERANCIERS, isDynamischeLeverancier: isDynamischeLeverancier };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OhandCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
