/* Menu, snelle berekening, configurator en contactformulier. Geen afhankelijkheden. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var euro = function (n) { return '€ ' + Math.round(n).toLocaleString('nl-NL'); };
  var getal = function (n, d) { return n.toLocaleString('nl-NL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var kwh = function (n) { return getal(n, n % 1 ? 1 : 0); };
  var jaren = function (n) { return isFinite(n) ? getal(n, 1) + ' jaar' : 'niet'; };

  /* Menu op mobiel */
  var menuBtn = $('.menu-btn'), nav = $('#nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Sluiten' : 'Menu';
    });
  }

  /* Snelle berekening op de homepage */
  var quick = $('#quick');
  if (quick && window.OhandCalc) {
    var qv = $('#q-verbruik'), qp = $('#q-panelen');
    var qUpdate = function () {
      $('#q-verbruik-out').textContent = getal(+qv.value) + ' kWh';
      $('#q-panelen-out').textContent = qp.value + ' panelen';
      var r = OhandCalc.bereken({ verbruik: +qv.value, panelen: +qp.value, thuis: 'deels' });
      $('#q-cap').textContent = r.oordeel === 'geen-zon' ? 'n.v.t.' : kwh(r.advies.capaciteit) + ' kWh';
      $('#q-save').textContent = euro(r.advies.besparing);
      $('#q-link').href = 'thuisbatterij/?verbruik=' + qv.value + '&panelen=' + qp.value + '#configurator';
    };
    qv.addEventListener('input', qUpdate); qp.addEventListener('input', qUpdate); qUpdate();
  }

  /* Volledige configurator */
  var form = $('#cfg-form');
  if (form && window.OhandCalc) {
    var q = new URLSearchParams(location.search);
    if (q.get('verbruik')) form.verbruik.value = q.get('verbruik');
    if (q.get('panelen')) form.panelen.value = q.get('panelen');

    $$('[data-preset]', form).forEach(function (b) {
      b.addEventListener('click', function () { form.verbruik.value = b.dataset.preset; update(); });
    });

    var cells = $('#batt-cells');
    for (var i = 0; i < 8; i++) cells.appendChild(document.createElement('i'));

    var teksten = {
      'gunstig': 'In uw situatie verdient een thuisbatterij zichzelf naar verwachting ruim binnen de levensduur terug.',
      'haalbaar': 'Een thuisbatterij verdient zich in uw situatie naar verwachting terug, maar pas in de tweede helft van de levensduur.',
      'niet-rendabel': 'Eerlijk advies: met deze gegevens verdient een thuisbatterij zich waarschijnlijk niet binnen 15 jaar terug. Meer zonnepanelen, een elektrische auto of een dynamisch contract veranderen dat beeld.',
      'geen-zon': 'Zonder zonnepanelen en zonder dynamisch contract valt er weinig op te slaan. Een thuisbatterij is dan meestal niet zinvol.'
    };

    var num = function (name, fallback) {
      var v = parseFloat(String(form[name].value).replace(',', '.'));
      return isFinite(v) ? v : fallback;
    };

    var laatste = null;
    function update() {
      var A = OhandCalc.AANNAMES;
      var invoer = {
        verbruik: +form.verbruik.value,
        panelen: +form.panelen.value,
        wp: num('wp', 400),
        auto: form.auto.checked,
        warmtepomp: form.warmtepomp.checked,
        thuis: form.thuis.value,
        dynamisch: form.contract.value === 'dynamisch'
      };
      var r = OhandCalc.bereken(invoer, {
        stroomprijs: num('stroomprijs', A.stroomprijs),
        terugleververgoeding: num('teruglever', A.terugleververgoeding),
        prijsVast: num('prijsvast', A.prijsVast),
        prijsPerKwh: num('prijskwh', A.prijsPerKwh)
      });
      var adv = r.advies, geen = r.oordeel === 'geen-zon';
      laatste = { invoer: invoer, r: r };

      $('#verbruik-out').textContent = getal(invoer.verbruik) + ' kWh per jaar';
      $('#panelen-out').textContent = invoer.panelen === 0 ? 'geen' : invoer.panelen + ' panelen, ± ' + getal(r.opwek) + ' kWh per jaar';

      $('#r-cap').innerHTML = geen ? '–' : kwh(adv.capaciteit) + ' <small>kWh</small>';
      var aan = geen ? 0 : Math.max(1, Math.round(adv.capaciteit / 20 * 8));
      $$('i', cells).forEach(function (c, n) { c.className = n < aan ? 'on' : ''; });
      $('#r-verdict').textContent = teksten[r.oordeel];
      $('#r-save').textContent = euro(adv.besparing);
      $('#r-payback').textContent = jaren(adv.terugverdientijd);
      $('#r-profit').textContent = (adv.winst < 0 ? '− ' : '') + euro(Math.abs(adv.winst));
      $('#r-profit-label').textContent = adv.winst < 0 ? 'tekort na 15 jaar' : 'winst na 15 jaar';
      $('#r-cost').textContent = euro(adv.kosten);
      var z0 = Math.round(r.zelfZonder * 100), z1 = Math.round(adv.zelfMet * 100);
      $('#r-self0').style.width = z0 + '%'; $('#r-self0-n').textContent = z0 + '%';
      $('#r-self1').style.width = z1 + '%'; $('#r-self1-n').textContent = z1 + '%';
      $('#r-fase').hidden = !(form.fase.value === '1' && adv.capaciteit >= 10);
      tekenGrafiek(adv, r.aannames.levensduur);
    }

    function tekenGrafiek(adv, jarenN) {
      var W = 520, H = 200, L = 52, R = 12, T = 14, B = 28;
      var eind = adv.besparing * jarenN - adv.kosten;
      var min = -adv.kosten, max = Math.max(eind, adv.kosten * 0.25);
      var x = function (j) { return L + (W - L - R) * j / jarenN; };
      var y = function (v) { return T + (H - T - B) * (max - v) / (max - min); };
      var s = '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#6f8798" stroke-dasharray="4 4"/>';
      s += '<text x="' + (L - 8) + '" y="' + (y(0) + 4) + '" text-anchor="end">€ 0</text>';
      s += '<text x="' + (L - 8) + '" y="' + (y(min) + 4) + '" text-anchor="end">− ' + euro(adv.kosten).replace('€ ', '€') + '</text>';
      for (var j = 0; j <= jarenN; j += 5) s += '<text x="' + x(j) + '" y="' + (H - 8) + '" text-anchor="middle">' + (j === 0 ? 'nu' : j + ' jr') + '</text>';
      s += '<polyline fill="none" stroke="#ffc533" stroke-width="3" stroke-linecap="round" points="' + x(0) + ',' + y(min) + ' ' + x(jarenN) + ',' + y(eind) + '"/>';
      if (adv.terugverdientijd <= jarenN) {
        var bx = x(adv.terugverdientijd);
        s += '<circle cx="' + bx + '" cy="' + y(0) + '" r="6" fill="#9ac31c" stroke="#0f2231" stroke-width="2"/>';
        s += '<text x="' + bx + '" y="' + (y(0) - 12) + '" text-anchor="' + (bx > W - 90 ? 'end' : 'middle') + '" style="fill:#fff;font-weight:600">terugverdiend</text>';
      }
      var svg = $('#r-chart');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML = s;
    }

    form.addEventListener('input', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update();

    /* Berekening meenemen naar het contactformulier */
    $('#r-send').addEventListener('click', function () {
      var i = laatste.invoer, r = laatste.r, a = r.advies;
      var regels = [
        'Mijn berekening van de thuisbatterij-configurator:',
        '- Jaarverbruik: ' + getal(r.verbruik) + ' kWh' + (i.auto ? ' (incl. elektrische auto)' : '') + (i.warmtepomp ? ' (incl. warmtepomp)' : ''),
        '- Zonnepanelen: ' + i.panelen + ' stuks, ± ' + getal(r.opwek) + ' kWh per jaar',
        '- Overdag thuis: ' + i.thuis + ', contract: ' + form.contract.value + ', aansluiting: ' + (form.fase.value === '?' ? 'onbekend' : form.fase.value + '-fase'),
        '- Indicatie: ' + kwh(a.capaciteit) + ' kWh, besparing ' + euro(a.besparing) + ' per jaar, terugverdientijd ' + jaren(a.terugverdientijd),
        '', 'Mijn vraag: '
      ];
      var t = $('#c-bericht'), o = $('#c-onderwerp');
      if (o) o.value = 'Thuisbatterij';
      if (t) { t.value = regels.join('\n'); }
      location.hash = '#contact';
      if (t) t.focus();
    });
  }

  /* Contactformulier: opent het e-mailprogramma met een ingevuld bericht */
  var cf = $('#contact-form');
  if (cf) {
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cf.reportValidity()) return;
      var body = [
        cf.bericht.value, '',
        'Naam: ' + cf.naam.value,
        'Telefoon: ' + cf.telefoon.value,
        'E-mail: ' + cf.email.value,
        'Postcode: ' + cf.postcode.value
      ].join('\n');
      location.href = 'mailto:' + cf.dataset.to + '?subject=' + encodeURIComponent('Aanvraag ' + cf.onderwerp.value + ' via de website') + '&body=' + encodeURIComponent(body);
      $('#c-status').textContent = 'Uw e-mailprogramma is geopend met een ingevuld bericht. Verstuur het daar om uw aanvraag af te ronden.';
    });
  }
})();
