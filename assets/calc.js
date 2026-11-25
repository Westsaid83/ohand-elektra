/* Rekenmodel voor de thuisbatterij-indicatie.
   Alles wat een prijs of een aanname is staat in AANNAMES, zodat het op één
   plek is aan te passen. De uitkomst is een schatting, geen offerte. */
(function (root) {
  'use strict';

  var AANNAMES = {
    stroomprijs: 0.28,        // euro per kWh die u van het net afneemt
    terugleververgoeding: 0.02, // euro per kWh netto (na terugleverkosten; mag negatief zijn)
    prijsVast: 1200,          // euro: omvormer/aansluiting/arbeid, los van de capaciteit  -- RICHTPRIJS
    prijsPerKwh: 450,         // euro per kWh opslagcapaciteit                           -- RICHTPRIJS
    levensduur: 15,           // jaren waarover wordt gerekend
    rendement: 0.9,           // laden en ontladen samen
    bruikbaar: 0.9,           // deel van de capaciteit dat dagelijks wordt gebruikt
    cycliPerJaar: 280,        // hoe vaak de batterij op zonnestroom vol en leeg kan in ons klimaat
    veroudering: 0.9,         // gemiddelde capaciteit over de levensduur
    opbrengstPerWp: 0.85,     // kWh per jaar per Wp zonnepaneel (Nederlands gemiddelde)
    dynamischPerKwh: 12,      // euro per jaar per kWh capaciteit bij een dynamisch contract (voorzichtig)
    verbruikAuto: 2500,       // kWh per jaar thuis laden
    verbruikWarmtepomp: 2500, // kWh per jaar
    maten: [2.5, 5, 7.5, 10, 12.5, 15, 20]
  };

  var THUIS = { ja: 1.15, deels: 1, nee: 0.85 };

  function bereken(invoer, aannames) {
    var a = Object.assign({}, AANNAMES, aannames || {});
    var verbruik = invoer.verbruik + (invoer.auto ? a.verbruikAuto : 0) + (invoer.warmtepomp ? a.verbruikWarmtepomp : 0);
    var opwek = invoer.panelen * (invoer.wp || 400) * a.opbrengstPerWp;
    var p = verbruik > 0 ? opwek / verbruik : 0;

    // Deel van het verbruik dat direct uit de panelen komt, zonder batterij.
    var direct = Math.min(0.42 * (1 - Math.exp(-1.2 * p)) * (THUIS[invoer.thuis] || 1), p, 1);
    // Wat met een ruime batterij haalbaar is: 's winters blijft het net nodig.
    var plafond = Math.max(direct, 0.8 * (1 - Math.exp(-1.6 * p)));
    var directKwh = direct * verbruik;
    var overschot = Math.max(0, opwek - directKwh);

    function voorCapaciteit(cap) {
      var bruikbaar = cap * a.bruikbaar;
      var b = verbruik > 0 ? bruikbaar / (verbruik / 1000) : 0;
      var extra = (plafond - direct) * (1 - Math.exp(-1.5 * b)) * verbruik;
      extra = Math.max(0, Math.min(extra, bruikbaar * a.cycliPerJaar, overschot * a.rendement, verbruik - directKwh));
      var zon = extra * a.stroomprijs - (extra / a.rendement) * a.terugleververgoeding;
      var handel = invoer.dynamisch ? cap * a.dynamischPerKwh : 0;
      var perJaar = Math.max(0, zon + handel) * a.veroudering;
      var kosten = a.prijsVast + a.prijsPerKwh * cap;
      return {
        capaciteit: cap,
        extraKwh: extra,
        besparing: perJaar,
        kosten: kosten,
        terugverdientijd: perJaar > 0 ? kosten / perJaar : Infinity,
        winst: perJaar * a.levensduur - kosten,
        zelfMet: verbruik > 0 ? (directKwh + extra) / verbruik : 0
      };
    }

    var opties = a.maten.map(voorCapaciteit);
    var beste = opties.reduce(function (x, y) { return y.winst > x.winst ? y : x; });

    var oordeel;
    if (opwek === 0 && !invoer.dynamisch) oordeel = 'geen-zon';
    else if (beste.terugverdientijd <= 10) oordeel = 'gunstig';
    else if (beste.terugverdientijd <= a.levensduur) oordeel = 'haalbaar';
    else oordeel = 'niet-rendabel';

    return {
      verbruik: verbruik, opwek: opwek, zelfZonder: direct, overschot: overschot,
      advies: beste, opties: opties, oordeel: oordeel, aannames: a
    };
  }

  var api = { bereken: bereken, AANNAMES: AANNAMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OhandCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
