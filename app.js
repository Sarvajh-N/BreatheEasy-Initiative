// =============================================
// BreatheEasy — Mobile App JavaScript
// =============================================
// Handles: Tab Navigation, Eligibility Calculator, PDF Generation,
// Calendar Reminder, Screening Center Locator, Language Toggle, Event Tracking
// =============================================

// ===== TAB NAVIGATION =====
// The app has 4 tabs (Home, Scan Day, Find, More) controlled by the bottom nav.
// Clicking a nav button shows the matching tab and hides the rest.

var navBtns = document.querySelectorAll('.nav-btn');
var tabs = document.querySelectorAll('.tab');

navBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    var targetId = this.getAttribute('data-tab');

    // Hide all tabs, deactivate all nav buttons
    tabs.forEach(function(t) { t.classList.remove('active'); });
    navBtns.forEach(function(b) { b.classList.remove('active'); });

    // Show selected tab, activate its button
    document.getElementById(targetId).classList.add('active');
    this.classList.add('active');

    // Scroll to top of the new tab
    window.scrollTo(0, 0);

    trackEvent('tab_switch', targetId);
  });
});


// ===== ELIGIBILITY CALCULATOR =====

var form = document.getElementById('eligibility-form');
var eligibleCard = document.getElementById('result-eligible');
var ineligibleCard = document.getElementById('result-ineligible');

form.addEventListener('submit', function(e) {
  e.preventDefault();

  var age = parseInt(document.getElementById('age').value);
  var packsPerDay = parseFloat(document.getElementById('packs-per-day').value);
  var yearsSmoked = parseInt(document.getElementById('years-smoked').value);
  var quitYears = parseInt(document.getElementById('quit-years').value);

  // Pack-years = packs/day x years smoked
  var packYears = packsPerDay * yearsSmoked;

  // USPSTF 2021: age 50-80, >= 20 pack-years, quit <= 15 years ago
  var ageOk = age >= 50 && age <= 80;
  var packOk = packYears >= 20;
  var quitOk = quitYears <= 15;
  var eligible = ageOk && packOk && quitOk;

  // Hide both result cards first
  eligibleCard.classList.add('hidden');
  ineligibleCard.classList.add('hidden');

  // Hide the form card to make room for results
  document.getElementById('card-form').classList.add('hidden');

  if (eligible) {
    document.getElementById('res-age').textContent = age;
    document.getElementById('res-pack-years').textContent = packYears.toFixed(1);
    document.getElementById('res-quit').textContent = quitYears === 0 ? 'Active' : quitYears + 'yr';
    eligibleCard.classList.remove('hidden');
    trackEvent('eligibility_check', 'eligible');
  } else {
    document.getElementById('res-age-no').textContent = age;
    document.getElementById('res-pack-years-no').textContent = packYears.toFixed(1);
    document.getElementById('res-quit-no').textContent = quitYears === 0 ? 'Active' : quitYears + 'yr';

    var reasons = [];
    if (!ageOk) reasons.push('Age must be 50–80.');
    if (!packOk) reasons.push('Need 20+ pack-years (yours: ' + packYears.toFixed(1) + ').');
    if (!quitOk) reasons.push('Must have quit within 15 years.');
    document.getElementById('ineligible-reason').textContent = reasons.join(' ');
    ineligibleCard.classList.remove('hidden');
    trackEvent('eligibility_check', 'ineligible');
  }

  // Scroll to results
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


// ===== PDF GENERATION =====

document.getElementById('download-pdf').addEventListener('click', function() {
  var { jsPDF } = window.jspdf;
  var doc = new jsPDF();

  var age = document.getElementById('res-age').textContent;
  var packYears = document.getElementById('res-pack-years').textContent;
  var quitStatus = document.getElementById('res-quit').textContent;
  var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Header
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BreatheEasy', 15, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Lung Cancer Screening — Physician Referral Document', 15, 28);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text('Generated: ' + today, 15, 42);

  // Patient info
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Self-Reported Information', 15, 55);
  doc.setDrawColor(30, 58, 95);
  doc.line(15, 58, 195, 58);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Age: ' + age, 15, 66);
  doc.text('Smoking History: ' + packYears + ' pack-years', 15, 74);
  doc.text('Quit Status: ' + quitStatus, 15, 82);
  doc.text('Screening Criteria: USPSTF 2021 Grade B Recommendation', 15, 90);

  // Billing codes
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Billing & Ordering Codes', 15, 108);
  doc.line(15, 111, 195, 111);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  var codes = [
    ['CPT Code:', '71271', 'Low-dose CT scan for lung cancer screening'],
    ['ICD-10:', 'Z87.891', 'Personal history of nicotine dependence'],
    ['ICD-10:', 'Z12.2', 'Screening for malignant neoplasm of respiratory organs'],
    ['Modifier:', 'None', 'ACA preventive service — $0 patient cost-share'],
  ];

  var y = 120;
  codes.forEach(function(row) {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 55, y);
    doc.setTextColor(100, 100, 100);
    doc.text(row[2], 85, y);
    doc.setTextColor(50, 50, 50);
    y += 10;
  });

  // Why these codes
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Why These Codes Matter', 15, y + 12);
  doc.line(15, y + 15, 195, y + 15);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  var explain = [
    'These codes ensure the screening is billed as a preventive service under the ACA.',
    'Insurance must cover the LDCT scan at $0 — no copay, no deductible.',
    '',
    'Without correct codes, the scan may be billed as diagnostic, causing unexpected costs.'
  ];
  var ey = y + 24;
  explain.forEach(function(l) { doc.text(l, 15, ey); ey += 6; });

  // Note to provider
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Note to Provider', 15, ey + 10);
  doc.line(15, ey + 13, 195, ey + 13);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  var notes = [
    'Patient completed a self-assessment meeting USPSTF 2021 criteria for LDCT screening.',
    '',
    'Please verify smoking history. Shared decision-making conversation recommended per CMS.',
    '',
    'Info: uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening'
  ];
  var ny = ey + 22;
  notes.forEach(function(l) { doc.text(l, 15, ny); ny += 6; });

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('Generated by BreatheEasy. Not a medical document. Provider verification required.', 15, 285);

  doc.save('BreatheEasy_Physician_Referral.pdf');
  document.getElementById('post-download').classList.remove('hidden');
  trackEvent('pdf_download', 'referral');
});


// ===== INTENT BUTTON =====

document.getElementById('intent-btn').addEventListener('click', function() {
  document.getElementById('intent-thanks').classList.remove('hidden');
  this.disabled = true;
  this.style.opacity = '0.5';
  trackEvent('physician_intent', 'confirmed');
});


// ===== CALENDAR REMINDER =====

document.getElementById('calendar-btn').addEventListener('click', function() {
  var now = new Date();
  var reminder = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  reminder.setHours(9, 0, 0, 0);
  var end = new Date(reminder.getTime() + 30 * 60 * 1000);

  function fmt(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

  var ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BreatheEasy//EN',
    'BEGIN:VEVENT',
    'DTSTART:' + fmt(reminder), 'DTEND:' + fmt(end),
    'SUMMARY:Schedule Lung Cancer Screening',
    'DESCRIPTION:Call your doctor to schedule your free LDCT scan. Bring your BreatheEasy referral PDF.',
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY',
    'DESCRIPTION:Schedule your screening today', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');

  var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'BreatheEasy_Reminder.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  document.getElementById('calendar-thanks').classList.remove('hidden');
  this.disabled = true;
  this.style.opacity = '0.5';
  trackEvent('calendar_reminder', 'added');
});


// ===== SCREENING CENTER LOCATOR =====

document.getElementById('locator-form').addEventListener('submit', function(e) {
  e.preventDefault();

  var zip = document.getElementById('zip-code').value.trim();
  var resultsDiv = document.getElementById('locator-results');
  var listDiv = document.getElementById('locator-list');
  var loadingDiv = document.getElementById('locator-loading');
  var mapWrap = document.getElementById('locator-map-wrap');
  var mapFrame = document.getElementById('locator-map');

  if (!/^\d{5}$/.test(zip)) {
    resultsDiv.classList.remove('hidden');
    mapWrap.classList.add('hidden');
    listDiv.innerHTML = '<div class="locator-no-results">' +
      (currentLang === 'es' ? 'Ingrese un código postal válido.' : 'Enter a valid 5-digit zip code.') + '</div>';
    return;
  }

  resultsDiv.classList.remove('hidden');
  loadingDiv.classList.remove('hidden');
  listDiv.innerHTML = '';
  mapWrap.classList.add('hidden');

  var embedUrl = 'https://www.google.com/maps?q=lung+cancer+screening+center+near+' + zip + '&output=embed';

  fetch('https://api.zippopotam.us/us/' + zip)
    .then(function(r) { if (!r.ok) throw new Error('bad zip'); return r.json(); })
    .then(function(data) {
      loadingDiv.classList.add('hidden');
      var city = data.places[0]['place name'];
      var state = data.places[0]['state abbreviation'];

      mapFrame.src = embedUrl;
      mapWrap.classList.remove('hidden');

      var html = '';
      html += '<div class="locator-card">';
      html += '<h4>' + city + ', ' + state + ' ' + zip + '</h4>';
      html += '<p>' + (currentLang === 'es' ? 'Toque los marcadores del mapa para ver detalles.' : 'Tap map pins for details.') + '</p>';
      html += '<a href="https://www.google.com/maps/search/lung+cancer+screening+center/' + zip + '" target="_blank" rel="noopener" class="locator-directions">' +
        (currentLang === 'es' ? 'Abrir en Google Maps' : 'Open in Google Maps') + ' &rarr;</a>';
      html += '</div>';

      html += '<div class="locator-card">';
      html += '<h4>' + (currentLang === 'es' ? 'Qué decir al llamar' : 'What to say when you call') + '</h4>';
      html += '<p><em>"' + (currentLang === 'es'
        ? 'Quiero programar una tomografía de baja dosis para detección de cáncer de pulmón. Tengo un documento con códigos de facturación.'
        : "I'd like to schedule a low-dose CT for lung cancer screening. I have a referral with billing codes.") + '"</em></p>';
      html += '</div>';

      listDiv.innerHTML = html;
      trackEvent('locator_search', zip);
    })
    .catch(function() {
      loadingDiv.classList.add('hidden');
      mapWrap.classList.add('hidden');
      listDiv.innerHTML = '<div class="locator-no-results">' +
        (currentLang === 'es' ? 'Código postal no encontrado.' : 'Zip code not found. Try again.') + '</div>';
    });
});


// ===== LANGUAGE TOGGLE =====

var currentLang = 'en';

var translations = {
  // Hero
  tagline_a: {
    en: '$0 lung cancer screening. Check if you qualify.',
    es: 'Detección de cáncer de pulmón a $0. Verifique si califica.'
  },
  tagline_b: {
    en: 'One scan. 60 seconds. Take control.',
    es: 'Una prueba. 60 segundos. Tome control.'
  },

  // Nav
  nav_home: { en: 'Home', es: 'Inicio' },
  nav_scan: { en: 'Scan Day', es: 'El día' },
  nav_find: { en: 'Find', es: 'Buscar' },
  nav_more: { en: 'More', es: 'Más' },

  // Calculator
  calc_title: { en: 'Am I Eligible?', es: '¿Soy elegible?' },
  label_age: { en: 'Your Age', es: 'Su edad' },
  label_packs: { en: 'Packs Per Day', es: 'Paquetes por día' },
  hint_pack: { en: '1 pack = 20 cigarettes', es: '1 paquete = 20 cigarrillos' },
  label_years: { en: 'Years Smoked', es: 'Años fumando' },
  label_quit: { en: 'Years Since Quitting', es: 'Años desde que dejó' },
  hint_quit: { en: 'Enter 0 if you still smoke', es: 'Ingrese 0 si aún fuma' },
  cta_check: { en: 'Check Eligibility', es: 'Verificar elegibilidad' },

  // Results
  eligible_title: { en: 'You May Be Eligible!', es: '¡Puede ser elegible!' },
  eligible_msg: { en: 'You meet USPSTF criteria for a <strong>free annual LDCT screening</strong>.', es: 'Cumple con los criterios para una <strong>tomografía anual gratuita</strong>.' },
  cta_pdf: { en: 'Download Referral PDF', es: 'Descargar PDF de referencia' },
  intent_btn: { en: "I'll take this to my doctor", es: 'Lo llevaré a mi médico' },
  calendar_btn: { en: 'Add Calendar Reminder', es: 'Agregar recordatorio' },
  intent_thanks: { en: 'Thank you! Early detection saves lives.', es: '¡Gracias! La detección temprana salva vidas.' },
  calendar_thanks: { en: 'Reminder added!', es: '¡Recordatorio agregado!' },
  ineligible_title: { en: 'Not Currently Eligible', es: 'No elegible actualmente' },
  ineligible_advice: { en: 'Talk to your doctor if you have concerns.', es: 'Hable con su médico si tiene preocupaciones.' },

  // Privacy
  privacy_badge: {
    en: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Zero data stored. All calculations happen on your device.',
    es: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Sin datos almacenados. Todo ocurre en su dispositivo.'
  },

  // Scan Day
  expect_title: { en: 'Scan Day', es: 'Día de la prueba' },
  expect_subtitle: { en: 'Quick, painless, nothing to fear.', es: 'Rápido, indoloro, nada que temer.' },
  expect_step1_title: { en: 'Check In', es: 'Registro' },
  expect_step1_desc: {
    en: 'No fasting, no prep, no needles. Wear comfy clothes without metal — you may change into a gown.',
    es: 'Sin ayuno, sin preparación, sin agujas. Ropa cómoda sin metal — pueden darle una bata.'
  },
  expect_step2_title: { en: 'The Scan (~60 sec)', es: 'La prueba (~60 seg)' },
  expect_step2_desc: {
    en: "Lie on a table that slides into an open ring — not a closed tube. Hold your breath 10 seconds and you're done.",
    es: 'Acuéstese en una mesa que entra en un anillo abierto — no un tubo cerrado. Contenga la respiración 10 segundos y listo.'
  },
  expect_step3_title: { en: 'Results', es: 'Resultados' },
  expect_step3_desc: {
    en: 'Your doctor contacts you within a week. Most scans are clear — if something is found, early detection means better outcomes.',
    es: 'Su médico le contacta en una semana. La mayoría salen bien — si algo se encuentra, la detección temprana mejora los resultados.'
  },
  expect_step4_title: { en: 'Annual', es: 'Anual' },
  expect_step4_desc: {
    en: 'Screen once a year at no cost. It becomes part of your routine preventive care.',
    es: 'Una prueba al año sin costo. Se vuelve parte de su cuidado preventivo.'
  },
  why_pdf_title: { en: 'Why the Referral PDF?', es: '¿Por qué el PDF?' },
  why_pdf_desc: {
    en: "Insurance billing is confusing. This PDF gives your doctor the exact codes (CPT 71271 & ICD-10) to order your scan and ensure it's covered at $0. You don't need to understand them — your doctor does.",
    es: 'La facturación médica es confusa. Este PDF le da a su médico los códigos exactos (CPT 71271 e ICD-10) para ordenar su prueba y asegurar cobertura a $0. Usted no necesita entenderlos — su médico sí.'
  },

  // Find
  find_title: { en: 'Find Centers', es: 'Buscar centros' },
  find_text_short: { en: 'Search by zip code.', es: 'Busque por código postal.' },
  label_zip: { en: 'Zip Code', es: 'Código postal' },
  find_btn: { en: 'Search', es: 'Buscar' },
  find_loading: { en: 'Searching...', es: 'Buscando...' },

  // More
  faq_title: { en: 'More Info', es: 'Más información' },
  privacy_title: { en: 'Privacy', es: 'Privacidad' },
  privacy_desc: {
    en: '<strong>Zero-data architecture.</strong> Everything runs in your browser. No health info is collected, stored, or sent anywhere. Close the page and your answers disappear.',
    es: '<strong>Arquitectura sin datos.</strong> Todo funciona en su navegador. No se recopila ni envía información de salud. Cierre la página y sus respuestas desaparecen.'
  },
  stories_title: { en: 'Voices of Early Detection', es: 'Voces de detección temprana' },
  footer_disclaimer: { en: 'BreatheEasy is a public health initiative.', es: 'BreatheEasy es una iniciativa de salud pública.' },
};

function switchLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (translations[key] && translations[key][lang]) {
      el.innerHTML = translations[key][lang];
    }
  });
  document.getElementById('lang-en').classList.toggle('lang-active', lang === 'en');
  document.getElementById('lang-es').classList.toggle('lang-active', lang === 'es');
  trackEvent('language_switch', lang);
}

document.getElementById('lang-en').addEventListener('click', function() { switchLanguage('en'); });
document.getElementById('lang-es').addEventListener('click', function() { switchLanguage('es'); });


// ===== SERVICE WORKER REGISTRATION =====
// Registers the service worker for offline support and "Add to Home Screen"
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function() {});
}


// ===== EVENT TRACKING =====

function trackEvent(action, label) {
  if (typeof gtag === 'function') {
    gtag('event', action, { event_category: 'breatheasy', event_label: label });
  }
  var version = window.location.pathname.includes('/b/') ? 'B' : 'A';
  console.log('[BreatheEasy]', action, label, 'v' + version);
}
