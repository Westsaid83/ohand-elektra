/* Beheer van Ohand Elektra.

   Er is geen eigen server: deze pagina praat rechtstreeks met GitHub, waar de
   website staat. Wie inlogt met een toegangssleutel, mag content/site.json en
   de foto's wijzigen. Na het opslaan bouwt GitHub de website opnieuw
   (.github/workflows/bouw.yml) en staat de wijziging na een paar minuten online.

   De sleutel blijft in deze browser (localStorage) en gaat alleen naar
   api.github.com. */
(function () {
  'use strict';

  var EIGENAAR = 'Westsaid83', REPO = 'ohand-elektra', TAK = 'main';
  var API = 'https://api.github.com/repos/' + EIGENAAR + '/' + REPO;
  var OPSLAG = 'ohand-beheer-sleutel';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = function (tag, attrs, kinderen) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'tekst') e.textContent = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (kinderen || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  };

  var sleutel = null;
  var inhoud = null;          // content/site.json
  var bron = null;            // beheer/teksten.json: oorspronkelijke teksten en fotoplekken
  var nieuweBestanden = {};   // pad -> base64, nog niet opgeslagen
  var voorbeelden = {};       // fotopad (zonder -640.jpg) -> tijdelijke weergave van een nieuwe foto
  var gewijzigd = false;
  var pagina = 0;

  /* ---------- GitHub ---------- */
  function gh(pad, opties) {
    opties = opties || {};
    return fetch(pad.indexOf('http') === 0 ? pad : API + pad, {
      method: opties.method || 'GET',
      headers: { 'Authorization': 'Bearer ' + sleutel, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: opties.body ? JSON.stringify(opties.body) : undefined,
      cache: 'no-store'
    }).then(function (r) {
      if (!r.ok) { var f = new Error('GitHub antwoordde met ' + r.status); f.status = r.status; throw f; }
      return r.status === 204 ? null : r.json();
    });
  }
  var uitBase64 = function (b) { return new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), function (c) { return c.charCodeAt(0); })); };

  /* ---------- Inloggen ---------- */
  function toonInlog(fout) {
    $('#app').hidden = true; $('#balk').hidden = true; $('#uitloggen').hidden = true;
    $('#inlog').hidden = false;
    $('#inlog-fout').hidden = !fout; $('#inlog-fout').textContent = fout || '';
  }
  function start() {
    return gh('').then(function (repo) {
      if (!repo.permissions || !repo.permissions.push) throw Object.assign(new Error('geen schrijfrechten'), { status: 403 });
      return Promise.all([
        gh('/contents/content/site.json?ref=' + TAK),
        fetch('teksten.json', { cache: 'no-store' }).then(function (r) { return r.json(); })
      ]);
    }).then(function (res) {
      inhoud = JSON.parse(uitBase64(res[0].content));
      inhoud.teksten = inhoud.teksten || {}; inhoud.afbeeldingen = inhoud.afbeeldingen || {}; inhoud.projecten = inhoud.projecten || [];
      inhoud.erkenningen = inhoud.erkenningen || [];
      bron = res[1];
      localStorage.setItem(OPSLAG, sleutel);
      $('#inlog').hidden = true; $('#app').hidden = false; $('#balk').hidden = false; $('#uitloggen').hidden = false;
      tekenAlles();
    }).catch(function (f) {
      localStorage.removeItem(OPSLAG);
      toonInlog(f.status === 401 ? 'Deze sleutel is niet geldig of verlopen. Controleer of u hem volledig heeft geplakt.'
        : (f.status === 403 || f.status === 404) ? 'Deze sleutel geeft geen toegang tot de website. Controleer bij het aanmaken de stappen 4 en 5.'
          : 'Inloggen lukte niet. Controleer uw internetverbinding en probeer het opnieuw.');
    });
  }
  $('#inlog-form').addEventListener('submit', function (e) { e.preventDefault(); sleutel = $('#sleutel').value.trim(); $('#sleutel').value = ''; start(); });
  $('#uitloggen').addEventListener('click', function () {
    if (gewijzigd && !confirm('U heeft wijzigingen die nog niet zijn opgeslagen. Toch uitloggen?')) return;
    localStorage.removeItem(OPSLAG); sleutel = null; gewijzigd = false; toonInlog();
  });

  /* ---------- Wijzigingen bijhouden ---------- */
  function markeer() {
    gewijzigd = true;
    $('#opslaan').disabled = false;
    $('#status').className = ''; $('#status').textContent = 'U heeft wijzigingen die nog niet online staan.';
  }
  window.addEventListener('beforeunload', function (e) { if (gewijzigd) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Foto's verkleinen ---------- */
  function laadFoto(bestand) {
    if (window.createImageBitmap) {
      return createImageBitmap(bestand, { imageOrientation: 'from-image' }).catch(function () { return viaImg(bestand); });
    }
    return viaImg(bestand);
  }
  function viaImg(bestand) {
    return new Promise(function (ok, fout) {
      var i = new Image(), u = URL.createObjectURL(bestand);
      i.onload = function () { ok(i); }; i.onerror = function () { URL.revokeObjectURL(u); fout(new Error('onleesbaar')); };
      i.src = u;
    });
  }
  function schaal(bron, breedte) {
    var w = bron.width, h = bron.height, f = Math.min(1, breedte / Math.max(w, h));
    var c = document.createElement('canvas'); c.width = Math.round(w * f); c.height = Math.round(h * f);
    var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bron, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  }
  /* Maakt van een gekozen bestand twee JPEG's (1200 en 640 pixels) en zet ze klaar om op te slaan. */
  function verwerkFoto(bestand, basis) {
    return laadFoto(bestand).then(function (foto) {
      var groot = schaal(foto, 1200), klein = schaal(foto, 640);
      nieuweBestanden[basis + '-1200.jpg'] = groot.split(',')[1];
      nieuweBestanden[basis + '-640.jpg'] = klein.split(',')[1];
      voorbeelden[basis] = klein;
      return basis;
    });
  }
  /* Een logo blijft PNG, zodat een doorzichtige achtergrond behouden blijft. */
  function verwerkLogo(bestand, basis) {
    return laadFoto(bestand).then(function (foto) {
      var f = Math.min(1, 480 / Math.max(foto.width, foto.height));
      var c = document.createElement('canvas'); c.width = Math.round(foto.width * f); c.height = Math.round(foto.height * f);
      c.getContext('2d').drawImage(foto, 0, 0, c.width, c.height);
      var url = c.toDataURL('image/png');
      nieuweBestanden[basis + '.png'] = url.split(',')[1];
      voorbeelden[basis] = url;
      return basis;
    });
  }
  var teller = 0;
  var uniek = function (voor) { teller += 1; return voor + Date.now().toString(36) + teller; };
  var fotoAdres = function (basis) { return voorbeelden[basis] || ('../' + basis + '-640.jpg'); };
  var kanNiet = function () { alert('Deze foto kon niet worden gelezen. Gebruik een JPG- of PNG-bestand.'); };

  /* ---------- Tabbladen ---------- */
  $$('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tabs button').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      $$('[data-paneel]').forEach(function (p) { p.hidden = p.dataset.paneel !== b.dataset.tab; });
    });
  });

  /* ---------- Projecten ---------- */
  function tekenProjecten() {
    var lijst = $('#projecten'); lijst.textContent = '';
    if (!inhoud.projecten.length) lijst.appendChild(el('p', { class: 'uitleg', tekst: 'Er staan nog geen projecten. Voeg hierboven foto\'s toe.' }));
    var soorten = [];
    inhoud.projecten.forEach(function (p) { if (p.soort && soorten.indexOf(p.soort) === -1) soorten.push(p.soort); });
    var dl = el('datalist', { id: 'soorten' }, soorten.map(function (s) { return el('option', { value: s }); }));
    lijst.appendChild(dl);
    inhoud.projecten.forEach(function (p, i) {
      var veld = function (label, sleutelNaam, tag, extra) {
        var id = 'p' + i + sleutelNaam;
        var inp = el(tag, Object.assign({ id: id, type: tag === 'input' ? 'text' : null, rows: tag === 'textarea' ? 2 : null,
          oninput: function () { p[sleutelNaam] = inp.value; markeer(); } }, extra || {}));
        inp.value = p[sleutelNaam] || '';
        return el('div', { class: 'veld' }, [el('label', { for: id, tekst: label }), inp]);
      };
      var kies = el('input', { type: 'file', accept: 'image/*', class: 'verborgen', id: 'pf' + i, onchange: function () {
        if (!kies.files[0]) return;
        verwerkFoto(kies.files[0], uniek('images/projecten/p-')).then(function (basis) { p.foto = basis; delete p.voorbeeld; markeer(); tekenProjecten(); }).catch(kanNiet);
      } });
      var schuif = function (d) { var a = inhoud.projecten; var j = i + d; if (j < 0 || j >= a.length) return; a.splice(j, 0, a.splice(i, 1)[0]); markeer(); tekenProjecten(); };
      lijst.appendChild(el('div', { class: 'kaart project' }, [
        el('div', {}, [
          el('img', { src: fotoAdres(p.foto), alt: '' }),
          el('div', { class: 'rij', style: 'margin-top:10px' }, [el('label', { for: 'pf' + i, class: 'knop knop--rand knop--klein', tekst: 'Andere foto', style: 'margin:0' }), kies])
        ]),
        el('div', {}, [
          p.voorbeeld ? el('span', { class: 'label-voorbeeld', tekst: 'Voorbeeld: vervang de foto door een eigen project' }) : null,
          el('div', { class: 'twee' }, [veld('Titel', 'titel', 'input'), veld('Soort werk', 'soort', 'input', { list: 'soorten', placeholder: 'Bijvoorbeeld Laadpaal' })]),
          veld('Korte omschrijving', 'tekst', 'textarea'),
          el('div', { class: 'rij' }, [
            el('button', { type: 'button', class: 'knop knop--rand knop--klein', tekst: 'Omhoog', disabled: i === 0, onclick: function () { schuif(-1); } }),
            el('button', { type: 'button', class: 'knop knop--rand knop--klein', tekst: 'Omlaag', disabled: i === inhoud.projecten.length - 1, onclick: function () { schuif(1); } }),
            el('button', { type: 'button', class: 'knop knop--rood knop--klein', tekst: 'Verwijderen', onclick: function () {
              if (confirm('Project "' + (p.titel || 'zonder titel') + '" verwijderen?')) { inhoud.projecten.splice(i, 1); markeer(); tekenProjecten(); }
            } })
          ])
        ])
      ]));
    });
  }
  function voegToe(bestanden) {
    var rij = Promise.resolve();
    Array.prototype.forEach.call(bestanden, function (b) {
      if (b.type.indexOf('image/') !== 0) return;
      rij = rij.then(function () {
        return verwerkFoto(b, uniek('images/projecten/p-')).then(function (basis) {
          inhoud.projecten.unshift({ titel: '', soort: '', tekst: '', foto: basis });
        }).catch(kanNiet);
      });
    });
    rij.then(function () { markeer(); tekenProjecten(); });
  }
  $('#nieuw').addEventListener('change', function () { voegToe(this.files); this.value = ''; });
  var drop = $('#drop');
  ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { voegToe(e.dataTransfer.files); });

  /* ---------- Erkenningen ---------- */
  function tekenErkenningen() {
    var lijst = $('#erkenningen'); lijst.textContent = '';
    if (!inhoud.erkenningen.length) lijst.appendChild(el('p', { class: 'uitleg', tekst: 'Er staan nog geen erkenningen. Klik hieronder om er een toe te voegen.' }));
    inhoud.erkenningen.forEach(function (k, i) {
      var veld = function (label, naam, tag, hint, extra) {
        var id = 'e' + i + naam;
        var inp = el(tag, Object.assign({ id: id, type: tag === 'input' ? 'text' : null, rows: tag === 'textarea' ? 2 : null,
          oninput: function () { k[naam] = inp.value; markeer(); } }, extra || {}));
        inp.value = k[naam] || '';
        return el('div', { class: 'veld' }, [el('label', { for: id, tekst: label }), inp, hint ? el('p', { class: 'hint', tekst: hint }) : null]);
      };
      var kies = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/svg+xml,image/webp', class: 'verborgen', id: 'ef' + i, onchange: function () {
        if (!kies.files[0]) return;
        verwerkLogo(kies.files[0], uniek('images/erkenningen/e-')).then(function (basis) { k.logo = basis; markeer(); tekenErkenningen(); }).catch(kanNiet);
      } });
      lijst.appendChild(el('div', { class: 'kaart project' }, [
        el('div', {}, [
          k.logo ? el('img', { class: 'logo', src: voorbeelden[k.logo] || ('../' + k.logo + '.png'), alt: '' }) : el('p', { class: 'uitleg', tekst: 'Nog geen logo gekozen.' }),
          el('div', { class: 'rij', style: 'margin-top:10px' }, [el('label', { for: 'ef' + i, class: 'knop knop--rand knop--klein', tekst: k.logo ? 'Ander logo' : 'Logo kiezen', style: 'margin:0' }), kies])
        ]),
        el('div', {}, [
          veld('Naam van de erkenning', 'naam', 'input', 'Precies zoals op het certificaat, bijvoorbeeld de naam van het keurmerk of de norm.'),
          veld('Korte toelichting', 'tekst', 'textarea', 'Eén zin over wat de erkenning inhoudt. Mag leeg blijven.'),
          veld('Webadres van de instantie', 'link', 'input', 'Mag leeg blijven. Begint met https://', { placeholder: 'https://' }),
          el('div', { class: 'rij' }, [
            el('button', { type: 'button', class: 'knop knop--rood knop--klein', tekst: 'Verwijderen', onclick: function () {
              if (confirm('Erkenning "' + (k.naam || 'zonder naam') + '" verwijderen?')) { inhoud.erkenningen.splice(i, 1); markeer(); tekenErkenningen(); }
            } })
          ])
        ])
      ]));
    });
  }
  $('#erkenning-nieuw').addEventListener('click', function () { inhoud.erkenningen.push({ naam: '', tekst: '', link: '', logo: '' }); markeer(); tekenErkenningen(); });

  /* ---------- Bedrijfsgegevens ---------- */
  var VELDEN = [
    ['naam', 'Bedrijfsnaam', 'text', ''],
    ['telefoon', 'Telefoonnummer', 'text', 'Zoals u het wilt tonen, bijvoorbeeld 06 12 34 56 78. De belknop gebruikt dit nummer.'],
    ['email', 'E-mailadres', 'email', 'Hier komen de aanvragen van de formulieren binnen.'],
    ['straat', 'Straat en huisnummer', 'text', ''],
    ['postcode', 'Postcode', 'text', ''],
    ['plaats', 'Plaats', 'text', ''],
    ['uren', 'Bereikbaar', 'text', 'Bijvoorbeeld: Maandag t/m vrijdag, 08.00 tot 17.00 uur'],
    ['kvk', 'KvK-nummer', 'text', ''],
    ['btw', 'Btw-nummer', 'text', ''],
    ['iban', 'IBAN', 'text', '']
  ];
  function tekenGegevens() {
    var doel = $('#gegevens'); doel.textContent = '';
    var rooster = el('div', { class: 'twee' });
    VELDEN.forEach(function (v) {
      var inp = el('input', { id: 'g-' + v[0], type: v[2], oninput: function () { inhoud.bedrijf[v[0]] = inp.value.trim(); markeer(); } });
      inp.value = inhoud.bedrijf[v[0]] || '';
      rooster.appendChild(el('div', { class: 'veld' }, [el('label', { for: 'g-' + v[0], tekst: v[1] }), inp, v[3] ? el('p', { class: 'hint', tekst: v[3] }) : null]));
    });
    doel.appendChild(rooster);
  }

  /* ---------- Vaste foto's ---------- */
  function tekenPlekken() {
    var doel = $('#plekken'); doel.textContent = '';
    Object.keys(bron.fotoplekken).forEach(function (naam) {
      var eigen = inhoud.afbeeldingen[naam];
      var kies = el('input', { type: 'file', accept: 'image/*', class: 'verborgen', id: 'f-' + naam, onchange: function () {
        if (!kies.files[0]) return;
        verwerkFoto(kies.files[0], uniek('images/upload/' + naam + '-')).then(function (basis) { inhoud.afbeeldingen[naam] = basis; markeer(); tekenPlekken(); }).catch(kanNiet);
      } });
      doel.appendChild(el('div', { class: 'plek' }, [
        el('img', { src: eigen ? fotoAdres(eigen) : '../images/' + naam + '-640.webp', alt: '' }),
        el('h3', { tekst: bron.fotoplekken[naam] }),
        el('div', { class: 'rij' }, [
          el('label', { for: 'f-' + naam, class: 'knop knop--rand knop--klein', tekst: 'Vervang foto', style: 'margin:0' }), kies,
          eigen ? el('button', { type: 'button', class: 'knop knop--rand knop--klein', tekst: 'Terug naar standaard', onclick: function () { delete inhoud.afbeeldingen[naam]; markeer(); tekenPlekken(); } }) : null
        ])
      ]));
    });
  }

  /* ---------- Teksten ---------- */
  function tekenTeksten() {
    var knoppen = $('#paginas'); knoppen.textContent = '';
    bron.paginas.forEach(function (p, i) {
      knoppen.appendChild(el('button', { type: 'button', class: i === pagina ? 'is-on' : '', tekst: p.pagina, onclick: function () { pagina = i; $('#zoek').value = ''; tekenTeksten(); } }));
    });
    var zoek = $('#zoek').value.trim().toLowerCase();
    var doel = $('#teksten'); doel.textContent = '';
    var lijst = [];
    if (zoek) bron.paginas.forEach(function (p) { p.teksten.forEach(function (t) { if ((t + ' ' + (inhoud.teksten[t] || '')).toLowerCase().indexOf(zoek) !== -1) lijst.push(t); }); });
    else lijst = bron.paginas[pagina].teksten;
    if (!lijst.length) doel.appendChild(el('p', { class: 'uitleg', tekst: 'Geen tekst gevonden met dit woord.' }));
    lijst.forEach(function (origineel, i) {
      var id = 't' + i;
      var rij = el('div', { class: 'tekst' + (inhoud.teksten[origineel] ? ' is-gewijzigd' : '') });
      var vak = el('textarea', { id: id, rows: Math.min(6, Math.max(1, Math.ceil(origineel.length / 70))), oninput: function () {
        var v = vak.value.trim();
        if (!v || v === origineel) delete inhoud.teksten[origineel]; else inhoud.teksten[origineel] = v;
        rij.className = 'tekst' + (inhoud.teksten[origineel] ? ' is-gewijzigd' : '');
        markeer();
      }, onblur: function () { if (!vak.value.trim()) vak.value = origineel; } });
      vak.value = inhoud.teksten[origineel] || origineel;
      rij.appendChild(el('label', { for: id, class: 'verborgen', tekst: 'Tekst: ' + origineel.slice(0, 60) }));
      if (inhoud.teksten[origineel]) rij.appendChild(el('small', { tekst: 'Oorspronkelijk: ' + origineel }));
      rij.appendChild(vak);
      doel.appendChild(rij);
    });
  }
  $('#zoek').addEventListener('input', tekenTeksten);

  function tekenAlles() { tekenProjecten(); tekenGegevens(); tekenErkenningen(); tekenPlekken(); tekenTeksten(); }

  /* ---------- Opslaan: alles in één keer, zodat de website één keer opnieuw bouwt ---------- */
  function controleer() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inhoud.bedrijf.email || '')) return 'Het e-mailadres bij Bedrijfsgegevens klopt niet.';
    if ((inhoud.bedrijf.telefoon || '').replace(/\D/g, '').length < 9) return 'Het telefoonnummer bij Bedrijfsgegevens is te kort.';
    var leeg = inhoud.projecten.filter(function (p) { return !p.titel.trim() || !p.soort.trim(); }).length;
    if (leeg) return leeg + ' project(en) hebben nog geen titel of soort werk. Vul die in bij Projecten.';
    var zonderNaam = inhoud.erkenningen.filter(function (k) { return !(k.naam || '').trim(); }).length;
    if (zonderNaam) return zonderNaam + ' erkenning(en) hebben nog geen naam. Vul die in bij Erkenningen of verwijder ze.';
    var foutLink = inhoud.erkenningen.filter(function (k) { return (k.link || '').trim() && (k.link || '').trim().indexOf('https://') !== 0; }).length;
    if (foutLink) return 'Een webadres bij Erkenningen moet beginnen met https://';
    return null;
  }
  $('#opslaan').addEventListener('click', function () {
    var status = $('#status'), knop = $('#opslaan');
    var fout = controleer();
    if (fout) { status.className = 'fout'; status.textContent = fout; return; }
    knop.disabled = true; status.className = ''; status.textContent = 'Bezig met opslaan...';
    // Alleen foto's die nog ergens gebruikt worden gaan mee.
    var inGebruik = inhoud.projecten.map(function (p) { return p.foto; }).concat(Object.keys(inhoud.afbeeldingen).map(function (k) { return inhoud.afbeeldingen[k]; }))
      .concat(inhoud.erkenningen.map(function (k) { return k.logo; }));
    var paden = Object.keys(nieuweBestanden).filter(function (pad) { return inGebruik.indexOf(pad.replace(/(-(1200|640)\.jpg|\.png)$/, '')) !== -1; });
    var hoofd, boom;
    gh('/git/ref/heads/' + TAK).then(function (ref) {
      hoofd = ref.object.sha;
      return gh('/git/commits/' + hoofd);
    }).then(function (commit) {
      boom = commit.tree.sha;
      var rij = Promise.resolve([]);
      paden.forEach(function (pad, n) {
        rij = rij.then(function (klaar) {
          status.textContent = 'Foto ' + (n + 1) + ' van ' + paden.length + ' wordt verstuurd...';
          return gh('/git/blobs', { method: 'POST', body: { content: nieuweBestanden[pad], encoding: 'base64' } }).then(function (blob) {
            klaar.push({ path: pad, mode: '100644', type: 'blob', sha: blob.sha }); return klaar;
          });
        });
      });
      return rij;
    }).then(function (items) {
      status.textContent = 'Wijzigingen worden vastgelegd...';
      items.push({ path: 'content/site.json', mode: '100644', type: 'blob', content: JSON.stringify(inhoud, null, 2) + '\n' });
      return gh('/git/trees', { method: 'POST', body: { base_tree: boom, tree: items } });
    }).then(function (nieuweBoom) {
      return gh('/git/commits', { method: 'POST', body: { message: 'Beheer: inhoud bijgewerkt via de beheerpagina', tree: nieuweBoom.sha, parents: [hoofd] } });
    }).then(function (commit) {
      return gh('/git/refs/heads/' + TAK, { method: 'PATCH', body: { sha: commit.sha } });
    }).then(function () {
      nieuweBestanden = {}; gewijzigd = false;
      status.className = 'goed';
      status.textContent = 'Opgeslagen. De website wordt nu bijgewerkt; over ongeveer drie minuten staat de wijziging online.';
    }).catch(function (f) {
      knop.disabled = false; status.className = 'fout';
      status.textContent = f.status === 401 ? 'Uw sleutel is verlopen. Log uit en log opnieuw in met een nieuwe sleutel. Uw wijzigingen staan nog op dit scherm.'
        : (f.status === 409 || f.status === 422) ? 'Iemand anders heeft tegelijk iets opgeslagen. Klik nog een keer op Opslaan en publiceren.'
          : 'Opslaan lukte niet. Controleer uw internetverbinding en probeer het opnieuw. Uw wijzigingen staan nog op dit scherm.';
    });
  });

  /* ---------- Begin ---------- */
  sleutel = localStorage.getItem(OPSLAG);
  if (sleutel) start(); else toonInlog();
})();
