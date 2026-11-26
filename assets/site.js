/* Menu, binnenkomende inhoud, snelle berekening, opengewerkte batterij,
   configurator en contactformulier. Geen afhankelijkheden; het 3D-model
   (assets/scene.js) meldt zich aan via window.OhandScenes. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var euro = function (n) { return '€ ' + Math.round(n).toLocaleString('nl-NL'); };
  var getal = function (n, d) { return n.toLocaleString('nl-NL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var kwh = function (n) { return getal(n, n % 1 ? 1 : 0); };
  var jaren = function (n) { return isFinite(n) ? getal(n, 1) + ' jaar' : 'niet'; };
  var SOORT = { vast: 'Vaste thuisbatterij', plug: 'Stekkerbatterij (plug & play)' };

  /* Het 3D-model laadt later dan dit script: voer uit zodra het er is. */
  function metScene(naam, fn) {
    if (window.OhandScenes && window.OhandScenes[naam]) return fn(window.OhandScenes[naam]);
    window.addEventListener('ohand:scenes', function () {
      if (window.OhandScenes[naam]) fn(window.OhandScenes[naam]);
    }, { once: true });
  }

  /* Menu op mobiel */
  var menuBtn = $('.menu-btn'), nav = $('#nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Sluiten' : 'Menu';
    });
  }

  /* Uitklapmenu met alle diensten */
  var drop = $('.drop'), dropBtn = $('.drop-btn');
  if (drop && dropBtn) {
    var zet = function (open) { drop.classList.toggle('is-open', open); dropBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    dropBtn.addEventListener('click', function (e) { e.stopPropagation(); zet(!drop.classList.contains('is-open')); });
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) zet(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drop.classList.contains('is-open')) { zet(false); dropBtn.focus(); } });
  }

  /* Stappenformulier op de homepage: dienst, één vervolgvraag, moment, gegevens.
     De vervolgvraag hangt af van de gekozen dienst. Versturen gaat, net als het
     contactformulier, via het e-mailprogramma van de bezoeker. */
  var wiz = $('#wiz');
  if (wiz) {
    var VRAGEN = {
      'Laadpaal': ['Waar komt de laadpaal?', 'Dat bepaalt het kabeltracé en de montage.', ['Op mijn eigen oprit', 'In een garage of carport', 'Bij een bedrijf of VvE', 'Dat weet ik nog niet']],
      'Thuisbatterij': ['Heeft u zonnepanelen?', 'Zonder panelen kan het ook, met een dynamisch contract.', ['Ja, ik heb zonnepanelen', 'Nee, geen zonnepanelen', 'Die komen er binnenkort']],
      'Groepenkast': ['Wat is de aanleiding?', 'Zo weten wij waar wij naar moeten kijken.', ['De kast is verouderd', 'Ik heb extra groepen nodig', 'Ik wil naar een 3-fase aansluiting', 'Groepen vallen regelmatig uit']],
      'Elektra bij verbouwing': ['Wat wordt er verbouwd?', 'Een globale indicatie is genoeg.', ['Keuken', 'Badkamer', 'Uitbouw of zolder', 'De hele woning']],
      'Zakelijk project': ['Wat voor project is het?', 'Wij werken voor aannemers, beheerders en VvE\'s.', ['Woningbouw', 'Utiliteitsbouw', 'Renovatie', 'Beheer en onderhoud']]
    };
    var stap = 1, stappen = $$('.wiz-step', wiz), terug = $('#wiz-terug');
    var heeftVraag = function () { return !!VRAGEN[wiz.dienst.value]; };
    var toon = function (n, focus) {
      stap = n;
      stappen.forEach(function (f) { f.classList.toggle('is-on', +f.dataset.step === n); });
      $('#wiz-stap').textContent = 'Stap ' + n + ' van 4';
      $('#wiz-bar').style.width = (n * 25) + '%';
      terug.hidden = n === 1;
      if (n === 4) {
        var delen = [wiz.dienst.value, (wiz.detail && wiz.detail.value) || '', wiz.wanneer.value].filter(Boolean);
        $('#wiz-samenvatting').textContent = 'Uw aanvraag: ' + delen.join(' / ').toLowerCase() + '.';
      }
      if (focus) { var el = $('.wiz-step.is-on input', wiz); if (el) el.focus({ preventScroll: true }); }
    };
    var bouwVraag = function () {
      var v = VRAGEN[wiz.dienst.value];
      $('#wiz-q2').textContent = v[0]; $('#wiz-q2-sub').textContent = v[1];
      $('#wiz-opties').innerHTML = v[2].map(function (t) {
        return '<label class="opt"><input type="radio" name="detail" value="' + t + '"><span><b>' + t + '</b></span></label>';
      }).join('');
    };
    var verder = function (naam) {
      if (naam === 'dienst') { if (heeftVraag()) { bouwVraag(); toon(2, true); } else { $('#wiz-opties').innerHTML = ''; toon(3, true); } }
      else if (naam === 'detail') toon(3, true);
      else if (naam === 'wanneer') toon(4, true);
    };
    /* Een klik op een antwoord gaat verder, ook als dat antwoord al gekozen was.
       Met het toetsenbord kiest u met de pijltjes en gaat u verder met Enter. */
    wiz.addEventListener('click', function (e) {
      var r = e.target;
      if (r && r.type === 'radio' && +r.closest('.wiz-step').dataset.step === stap) verder(r.name);
    });
    wiz.addEventListener('keydown', function (e) {
      var r = e.target;
      if (e.key === 'Enter' && r && r.type === 'radio') { e.preventDefault(); if (!r.checked) r.checked = true; verder(r.name); }
    });
    terug.addEventListener('click', function () { toon(stap === 3 && !heeftVraag() ? 1 : stap - 1, true); });
    wiz.addEventListener('submit', function (e) {
      e.preventDefault();
      if (stap !== 4) return;
      if (!wiz.reportValidity()) return;
      var regels = ['Aanvraag via het stappenformulier op de website', '',
        'Dienst: ' + wiz.dienst.value,
        (wiz.detail && wiz.detail.value) ? 'Situatie: ' + wiz.detail.value : null,
        'Wanneer: ' + wiz.wanneer.value, '',
        'Naam: ' + wiz.naam.value, 'Telefoon: ' + wiz.telefoon.value, 'Postcode: ' + wiz.postcode.value, '',
        'Toelichting: '].filter(function (x) { return x !== null; });
      location.href = 'mailto:' + wiz.dataset.to + '?subject=' + encodeURIComponent('Aanvraag ' + wiz.dienst.value + ' via de website') + '&body=' + encodeURIComponent(regels.join('\n'));
      $('#wiz-status').textContent = 'Uw e-mailprogramma is geopend met een ingevuld bericht. Verstuur het daar om uw aanvraag af te ronden.';
    });
  }

  /* Projectencarrousel: de foto's zweven in een boog, de middelste staat vooraan.
     Hij draait vanzelf door en pauzeert zodra iemand ermee bezig is (muis erboven,
     toetsenbord, vegen, vergroting open) of op de pauzeknop drukt. Bij de
     instelling 'minder beweging' start hij niet uit zichzelf. */
  var strook = $('.strook');
  if (strook) {
    var WACHT = 5000;
    var dias = $$('.dia', strook), teller = $('.proj-teller'), draad = $('.proj-draad i');
    var pijlen = $$('.proj-pijl'), pauze = $('.proj-pauze'), licht = $('.licht');
    var stilGevraagd = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var actief = 0, speelt = !stilGevraagd, redenen = {}, klok = null;
    var lijst = function () { return dias.filter(function (d) { return !d.hidden; }); };

    var teken = function () {
      var l = lijst(), n = l.length;
      if (!n) return;
      actief = ((actief % n) + n) % n;
      var stap = Math.min(strook.clientWidth * 0.62, 470);
      l.forEach(function (d, i) {
        var af = i - actief;
        if (n > 2) { if (af > n / 2) af -= n; if (af < -n / 2) af += n; }
        var ver = Math.abs(af);
        d.style.transform = 'translateX(' + (af * stap) + 'px) translateZ(' + (-ver * 220) + 'px) rotateY(' + (af * -24) + 'deg)';
        d.style.opacity = ver > 2 ? 0 : ver === 2 ? 0.35 : 1;
        d.style.zIndex = 10 - ver;
        d.style.pointerEvents = ver > 1 ? 'none' : '';
        d.classList.toggle('is-actief', af === 0);
        d.setAttribute('aria-hidden', af === 0 ? 'false' : 'true');
        $('.dia-knop', d).tabIndex = af === 0 ? 0 : -1;
        $('.dia-knop', d).setAttribute('aria-label', (af === 0 ? 'Vergroot foto: ' : 'Toon project: ') + $('img', d).alt);
      });
      teller.textContent = (actief + 1) + ' van ' + n;
      pijlen.forEach(function (p) { p.disabled = n < 2; });
    };

    /* De balk onder de carrousel loopt vol in de tijd tot de volgende foto. */
    var herstart = function () {
      clearTimeout(klok);
      draad.style.transition = 'none'; draad.style.width = '0%';
      var loopt = speelt && !Object.keys(redenen).length && lijst().length > 1;
      strook.classList.toggle('is-stil', !loopt);
      if (!loopt) { draad.style.width = ((actief + 1) / Math.max(1, lijst().length) * 100) + '%'; return; }
      void draad.offsetWidth;
      draad.style.transition = 'width ' + WACHT + 'ms linear'; draad.style.width = '100%';
      klok = setTimeout(function () { ga(1); }, WACHT);
    };
    var ga = function (d) { actief += d; teken(); herstart(); };
    var rem = function (naam, aan) { if (aan) redenen[naam] = 1; else delete redenen[naam]; herstart(); };

    pijlen.forEach(function (p) { p.addEventListener('click', function () { ga(+p.dataset.richting); }); });
    var zetKnop = function () {
      pauze.setAttribute('aria-pressed', speelt ? 'false' : 'true');
      pauze.setAttribute('aria-label', speelt ? 'Pauzeer de carrousel' : 'Laat de carrousel weer draaien');
      pauze.classList.toggle('is-gepauzeerd', !speelt);
    };
    pauze.addEventListener('click', function () { speelt = !speelt; zetKnop(); herstart(); });

    var sectie = strook.closest('.projecten');
    strook.addEventListener('mouseenter', function () { rem('muis', true); });
    strook.addEventListener('mouseleave', function () { rem('muis', false); });
    sectie.addEventListener('focusin', function (e) { if (strook.contains(e.target)) rem('focus', true); });
    sectie.addEventListener('focusout', function () { rem('focus', false); });
    document.addEventListener('visibilitychange', function () { rem('tab', document.hidden); });
    if ('IntersectionObserver' in window) {
      redenen.beeld = 1;
      new IntersectionObserver(function (e) { rem('beeld', !e[0].isIntersecting); }, { threshold: 0.35 }).observe(strook);
    }
    strook.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ga(1); focusActief(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ga(-1); focusActief(); }
    });
    var focusActief = function () { var k = $('.dia.is-actief .dia-knop', strook); if (k) k.focus({ preventScroll: true }); };

    /* Vegen */
    var startX = null, geveegd = false;
    strook.addEventListener('pointerdown', function (e) { startX = e.clientX; geveegd = false; });
    strook.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 40) { geveegd = true; ga(dx < 0 ? 1 : -1); }
    });
    strook.addEventListener('pointercancel', function () { startX = null; });

    /* Klik: een foto opzij komt naar voren, de voorste wordt vergroot. */
    strook.addEventListener('click', function (e) {
      if (geveegd) { geveegd = false; return; }
      var d = e.target.closest ? e.target.closest('.dia') : null; if (!d) return;
      var i = lijst().indexOf(d);
      if (i !== actief) { actief = i; teken(); herstart(); return; }
      if (!(e.target.closest('.dia-knop')) || !licht || !licht.showModal) return;
      var foto = $('img', d);
      $('img', licht).src = foto.currentSrc.replace('-640.jpg', '-1200.jpg');
      $('img', licht).alt = foto.alt; $('p', licht).textContent = foto.alt;
      licht.showModal(); rem('licht', true);
    });
    if (licht) {
      $('.licht-sluit', licht).addEventListener('click', function () { licht.close(); });
      licht.addEventListener('click', function (e) { if (e.target === licht) licht.close(); });
      licht.addEventListener('close', function () { rem('licht', false); });
    }

    $$('.proj-filter button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.proj-filter button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        dias.forEach(function (d) { d.hidden = !!b.dataset.soort && d.dataset.soort !== b.dataset.soort; });
        actief = 0; teken(); herstart();
      });
    });
    window.addEventListener('resize', teken);
    zetKnop(); teken(); herstart();
  }

  /* Inhoud die binnenkomt bij scrollen */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (items) {
      items.forEach(function (it) { if (it.isIntersecting) { it.target.classList.add('is-in'); io.unobserve(it.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Snelle berekening op de homepage */
  var qv = $('#q-verbruik'), qp = $('#q-panelen');
  if (qv && qp && window.OhandCalc) {
    var qUpdate = function () {
      $('#q-verbruik-out').textContent = getal(+qv.value) + ' kWh';
      $('#q-panelen-out').textContent = +qp.value === 0 ? 'geen' : qp.value + ' panelen';
      var r = OhandCalc.bereken({ verbruik: +qv.value, panelen: +qp.value, thuis: 'deels', contract: 'vast', soort: 'advies' });
      var geen = r.oordeel === 'geen-zon';
      $('#q-cap').textContent = geen ? '–' : kwh(r.advies.capaciteit) + ' kWh';
      $('#q-save').textContent = geen ? '–' : euro(r.advies.besparing);
      $('#q-cap').nextElementSibling.textContent = geen ? 'passende capaciteit' : 'passende capaciteit, ' + (r.advies.soort === 'plug' ? 'plug & play' : 'vaste batterij');
      $('#q-note').textContent = geen
        ? 'Zonder zonnepanelen loont een batterij alleen met een dynamisch contract. De volledige berekening rekent dat voor u door.'
        : 'Indicatie op basis van gemiddelden en een vast contract. De volledige berekening kent ook stekkerbatterijen, dynamische contracten en uw eigen tarieven.';
      $('#q-link').href = 'thuisbatterij/?verbruik=' + qv.value + '&panelen=' + qp.value + '#configurator';
    };
    qv.addEventListener('input', qUpdate); qp.addEventListener('input', qUpdate); qUpdate();
  }

  /* Opengewerkte batterij: de scrollstand stuurt het model */
  var ex = $('#opbouw-stappen');
  if (ex) {
    var arts = $$('article', ex), bezig = false;
    var exUpdate = function () {
      bezig = false;
      var r = ex.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / (r.height - vh * 0.3)));
      var actief = 0;
      arts.forEach(function (a, i) { if (a.getBoundingClientRect().top < vh * 0.62) actief = i; });
      arts.forEach(function (a, i) { a.classList.toggle('is-on', i === actief); });
      metScene('opbouw', function (s) {
        s.setExplode(p < 0.12 ? 0 : p > 0.9 ? 0 : Math.sin((p - 0.12) / 0.78 * Math.PI));
        s.setYaw(-0.9 + p * 1.5);
      });
    };
    window.addEventListener('scroll', function () { if (!bezig) { bezig = true; requestAnimationFrame(exUpdate); } }, { passive: true });
    exUpdate();
  }

  /* Volledige configurator */
  var form = $('#cfg-form');
  if (form && window.OhandCalc) {
    var q = new URLSearchParams(location.search);
    if (q.get('verbruik')) form.verbruik.value = q.get('verbruik');
    if (q.get('panelen')) form.panelen.value = q.get('panelen');

    var lijst = $('#leveranciers');
    OhandCalc.LEVERANCIERS.forEach(function (n) { var o = document.createElement('option'); o.value = n; lijst.appendChild(o); });

    $$('[data-preset]', form).forEach(function (b) {
      b.addEventListener('click', function () { form.verbruik.value = b.dataset.preset; update(); });
    });

    form.leverancier.addEventListener('change', function () {
      var dyn = OhandCalc.isDynamischeLeverancier(form.leverancier.value);
      var hint = $('#lev-hint');
      if (dyn) {
        form.contract.value = 'dynamisch';
        hint.textContent = form.leverancier.value.trim() + ' staat bekend om dynamische contracten. Wij hebben dat voor u aangevinkt; pas het aan als u een ander contract heeft.';
        hint.hidden = false;
      } else { hint.hidden = true; }
      update();
    });

    var teksten = {
      'gunstig': 'In uw situatie verdient deze batterij zichzelf naar verwachting ruim binnen de levensduur terug.',
      'haalbaar': 'Deze batterij verdient zich in uw situatie naar verwachting terug, maar pas in de tweede helft van de levensduur.',
      'niet-rendabel': 'Eerlijk advies: met deze gegevens verdient een batterij zich waarschijnlijk niet binnen 15 jaar terug. Meer zonnepanelen, een elektrische auto of een dynamisch contract veranderen dat beeld.',
      'geen-zon': 'Zonder zonnepanelen valt er alleen iets te verdienen aan prijsverschillen per uur, en die heeft u alleen met een dynamisch contract. Met uw huidige contract is een batterij niet zinvol.'
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
        contract: form.contract.value,
        soort: form.soort.value
      };
      var r = OhandCalc.bereken(invoer, {
        stroomprijs: num('stroomprijs', A.stroomprijs),
        terugleververgoeding: num('teruglever', A.terugleververgoeding),
        terugleverkosten: num('terugleverkosten', A.terugleverkosten),
        prijsverschil: num('prijsverschil', A.prijsverschil),
        prijsVast: num('prijsvast', A.prijsVast),
        prijsPerKwh: num('prijskwh', A.prijsPerKwh),
        plugVast: num('plugvast', A.plugVast),
        plugPerKwh: num('plugkwh', A.plugPerKwh)
      });
      var adv = r.advies, geen = r.oordeel === 'geen-zon';
      laatste = { invoer: invoer, r: r };

      $('#verbruik-out').textContent = getal(invoer.verbruik) + ' kWh per jaar';
      $('#panelen-out').textContent = invoer.panelen === 0 ? 'geen zonnepanelen' : invoer.panelen + ' panelen, ± ' + getal(r.opwek) + ' kWh per jaar';
      $('#zon-velden').hidden = invoer.panelen === 0;
      $('#dyn-veld').hidden = !r.dynamisch;

      $('#r-cap').innerHTML = geen ? '–' : kwh(adv.capaciteit) + ' <small>kWh</small>';
      $('#r-soort').textContent = SOORT[adv.soort];
      $('#r-soort').hidden = geen;
      $('#r-verdict').textContent = teksten[r.oordeel];
      $('#r-save').textContent = euro(adv.besparing);
      $('#r-payback').textContent = jaren(adv.terugverdientijd);
      $('#r-profit').textContent = (adv.winst < 0 ? '− ' : '') + euro(Math.abs(adv.winst));
      $('#r-profit-label').textContent = adv.winst < 0 ? 'tekort na 15 jaar' : 'winst na 15 jaar';
      $('#r-cost').textContent = euro(adv.kosten);

      var z0 = Math.round(r.zelfZonder * 100), z1 = Math.round(adv.zelfMet * 100);
      $('#r-zelf').hidden = invoer.panelen === 0;
      $('#r-self0').style.width = z0 + '%'; $('#r-self0-n').textContent = z0 + '%';
      $('#r-self1').style.width = z1 + '%'; $('#r-self1-n').textContent = z1 + '%';

      $('#r-compare').innerHTML = ['vast', 'plug'].map(function (k) {
        var o = r[k];
        return '<tr' + (o === adv ? ' class="is-advies"' : '') + '><th scope="row">' + (k === 'vast' ? 'Vast' : 'Plug & play') + '</th><td>' +
          kwh(o.capaciteit) + ' kWh</td><td>' + euro(o.kosten) + '</td><td>' + euro(o.besparing) + '</td><td>' + jaren(o.terugverdientijd) + '</td></tr>';
      }).join('');

      $('#r-fase').hidden = !(form.fase.value === '1' && adv.soort === 'vast' && adv.capaciteit >= 10);
      $('#r-plug').hidden = adv.soort !== 'plug';
      $('#r-nood').hidden = form.doel.value !== 'noodstroom';
      $('#r-handel').hidden = !(r.dynamisch && adv.besparingHandel > 0);
      $('#r-handel-n').textContent = euro(adv.besparingHandel);
      tekenGrafiek(adv, r.aannames.levensduur);
      metScene('cfg', function (s) { s.setModules(geen ? 1 : Math.max(1, Math.round(adv.capaciteit / 2.5))); s.setLevel(geen ? 0 : 1); });
    }

    function tekenGrafiek(adv, jarenN) {
      var W = 520, H = 190, L = 58, R = 12, T = 22, B = 28;
      var eind = adv.besparing * jarenN - adv.kosten;
      var min = -adv.kosten, max = Math.max(eind, adv.kosten * 0.25);
      var x = function (j) { return L + (W - L - R) * j / jarenN; };
      var y = function (v) { return T + (H - T - B) * (max - v) / (max - min); };
      var s = '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#5b6a78" stroke-dasharray="4 4"/>';
      s += '<text x="' + (L - 8) + '" y="' + (y(0) + 4) + '" text-anchor="end">€ 0</text>';
      s += '<text x="' + (L - 8) + '" y="' + (y(min) + 4) + '" text-anchor="end">− ' + euro(adv.kosten).replace('€ ', '€') + '</text>';
      for (var j = 0; j <= jarenN; j += 5) s += '<text x="' + x(j) + '" y="' + (H - 8) + '" text-anchor="middle">' + (j === 0 ? 'nu' : j + ' jr') + '</text>';
      s += '<polyline fill="none" stroke="#ffc533" stroke-width="3" stroke-linecap="round" points="' + x(0) + ',' + y(min) + ' ' + x(jarenN) + ',' + y(eind) + '"/>';
      if (adv.terugverdientijd <= jarenN) {
        var bx = x(adv.terugverdientijd);
        s += '<circle cx="' + bx + '" cy="' + y(0) + '" r="6" fill="#9ac31c" stroke="#05080c" stroke-width="2"/>';
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
        '- Zonnepanelen: ' + (i.panelen ? i.panelen + ' stuks, ± ' + getal(r.opwek) + ' kWh per jaar' : 'geen'),
        '- Energieleverancier: ' + (form.leverancier.value.trim() || 'niet ingevuld') + ', contract: ' + i.contract,
        '- Aansluiting: ' + (form.fase.value === '?' ? 'onbekend' : form.fase.value + '-fase') + ', doel: ' + form.doel.value,
        '- Indicatie: ' + SOORT[a.soort].toLowerCase() + ' van ' + kwh(a.capaciteit) + ' kWh, besparing ' + euro(a.besparing) + ' per jaar, terugverdientijd ' + jaren(a.terugverdientijd),
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
