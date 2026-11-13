/* ============================================================
   SakayCDO — app.js
   Quick-login demo · live transit simulation for Cagayan de Oro
   ============================================================ */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ------------------------------------------------------------
   STATE
   ------------------------------------------------------------ */
const state = {
  user: null,
  tab: 'home',
  filter: 'all',
  dest: null,
  planRoute: null,
};

/* ------------------------------------------------------------
   DATA — CDO places & routes
   ------------------------------------------------------------ */
const PLACES = [
  { n: 'Divisoria',          a: 'Cogon, CDO' },
  { n: 'Cogon Market',       a: 'Cogon, CDO' },
  { n: 'Limketkai Mall',     a: 'Lapasan, CDO' },
  { n: 'Centrio Ayala Mall', a: 'Lapasan, CDO' },
  { n: 'SM City CDO Uptown', a: 'Upper Carmen, CDO' },
  { n: 'Gaisano City',       a: 'Cogon, CDO' },
  { n: 'Carmen Public Market', a: 'Carmen, CDO' },
  { n: 'Agora Market',       a: 'Lapasan, CDO' },
  { n: 'Bulua Terminal',     a: 'Bulua, CDO' },
  { n: 'Lumbia Airport',     a: 'Lumbia, CDO' },
  { n: 'Xavier University',  a: 'Corrales, CDO' },
  { n: 'Capitol University', a: 'Cogon, CDO' },
  { n: 'USTP',               a: 'Lapasan, CDO' },
  { n: 'Kauswagan',          a: 'Kauswagan, CDO' },
  { n: 'Macabalan Wharf',    a: 'Macabalan, CDO' },
  { n: 'Gusa',               a: 'Gusa, CDO' },
  { n: 'Bugo',               a: 'Bugo, CDO' },
  { n: 'Opol',               a: 'Opol, Misamis Oriental' },
  { n: 'Igpit',              a: 'Igpit, Opol' },
  { n: 'Tagoloan',           a: 'Tagoloan, Mis. Or.' },
];

const ROUTES = [
  { id:'J01', code:'J-01', type:'Jeepney', name:'Divisoria – Carmen',      via:'Cogon · Velez · CM Recto', eta:4,  vehicles:14, fare:13, headway:3,  load:'low',  stops:['Divisoria','Cogon Market','Velez St','Carmen'] },
  { id:'J02', code:'J-02', type:'Jeepney', name:'Cogon – Bulua',           via:'Rizal St · Bulua Terminal', eta:7,  vehicles:9,  fare:15, headway:5,  load:'mid',  stops:['Cogon Market','Rizal St','Bulua Terminal'] },
  { id:'J03', code:'J-03', type:'Jeepney', name:'Agora – Lapasan',         via:'JR Borja · Lapasan',        eta:3,  vehicles:16, fare:12, headway:2,  load:'high', stops:['Agora Market','JR Borja','Lapasan'] },
  { id:'J04', code:'J-04', type:'Jeepney', name:'Divisoria – Macabalan',   via:'Puntod · Macabalan',        eta:9,  vehicles:6,  fare:14, headway:6,  load:'low',  stops:['Divisoria','Puntod','Macabalan Wharf'] },
  { id:'J05', code:'J-05', type:'Jeepney', name:'Gusa – Cogon',            via:'CM Recto Ave',              eta:6,  vehicles:11, fare:13, headway:4,  load:'mid',  stops:['Gusa','CM Recto','Cogon Market'] },
  { id:'J06', code:'J-06', type:'Jeepney', name:'Kauswagan – Puntod',      via:'Zone 5 · Puntod',           eta:8,  vehicles:8,  fare:12, headway:5,  load:'high', stops:['Kauswagan','Zone 5','Puntod'] },
  { id:'B01', code:'B-01', type:'Bus',     name:'Bulua – Agora Loop',      via:'Westbound Corridor',        eta:11, vehicles:4,  fare:25, headway:12, load:'low',  stops:['Bulua Terminal','Carmen','Agora Market'] },
  { id:'B02', code:'B-02', type:'Bus',     name:'Lumbia – Divisoria',      via:'Airport Road · CM Recto',   eta:18, vehicles:3,  fare:30, headway:18, load:'mid',  stops:['Lumbia Airport','Airport Rd','Divisoria'] },
  { id:'B03', code:'B-03', type:'Bus',     name:'Tagoloan – Cogon',        via:'National Highway',          eta:23, vehicles:2,  fare:35, headway:25, load:'low',  stops:['Tagoloan','Bugo','Cogon Market'] },
];

const ALERTS = [
  { level:'warn', icon:'⚠️', title:'Heavy build-up on CM Recto',  text:'Near Velez St. Expect ~8 min delay on J-01 and J-05.', time:'2 min ago' },
  { level:'info', icon:'↻',  title:'Route J-03 rerouted',          text:'Agora – Lapasan detours via JR Borja Ext. due to road works.', time:'14 min ago' },
  { level:'ok',   icon:'✓',  title:'Bulua corridor moving freely', text:'Westbound traffic is normal. B-01 running on schedule.', time:'21 min ago' },
  { level:'info', icon:'☂',  title:'Light rain expected 4 PM',     text:'Jeepney waiting times may increase by 1–2 minutes.', time:'38 min ago' },
  { level:'ok',   icon:'✓',  title:'Additional units deployed',    text:'6 extra jeepneys added on Divisoria – Carmen for rush hour.', time:'1 hr ago' },
];

const WEATHER = [
  { icon:'⛅', label:'Partly cloudy', temp:30, hum:'72% RH', wind:'12 km/h' },
  { icon:'☀️', label:'Sunny',         temp:32, hum:'65% RH', wind:'9 km/h'  },
  { icon:'🌤️', label:'Mostly clear',  temp:31, hum:'68% RH', wind:'11 km/h' },
  { icon:'🌦️', label:'Light showers', temp:28, hum:'84% RH', wind:'16 km/h' },
  { icon:'☁️', label:'Overcast',      temp:29, hum:'78% RH', wind:'14 km/h' },
];

const LOADS = ['low', 'mid', 'high'];

/* ------------------------------------------------------------
   SMALL HELPERS
   ------------------------------------------------------------ */
function toast(msg, ms = 2300) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), ms);
}

function greetingFor(d) {
  const h = d.getHours();
  if (h < 5)  return 'Maayong kadlawon';
  if (h < 12) return 'Maayong buntag';
  if (h < 18) return 'Maayong hapon';
  return 'Maayong gabii';
}

function loadLabel(load) {
  return load === 'low' ? 'Seats free' : load === 'mid' ? 'Standing' : 'Full';
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ------------------------------------------------------------
   MODAL
   ------------------------------------------------------------ */
function openModal({ title, sub = '', body = '', actions = [] }) {
  $('#modalTitle').textContent = title;
  $('#modalSub').textContent = sub;
  $('#modalSub').classList.toggle('hidden', !sub);
  $('#modalBody').innerHTML = body;

  const wrap = $('#modalActions');
  wrap.innerHTML = '';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = a.cls || 'btn-ghost';
    btn.textContent = a.label;
    btn.addEventListener('click', () => {
      if (a.onClick) a.onClick();
      else closeModal();
    });
    wrap.appendChild(btn);
  });

  $('#modalScrim').classList.add('show');
  const firstInput = $('#modalBody input');
  if (firstInput) setTimeout(() => firstInput.focus(), 260);
}

function closeModal() {
  $('#modalScrim').classList.remove('show');
}

/* ------------------------------------------------------------
   LOGIN LOADING SEQUENCE
   ------------------------------------------------------------ */
const LOAD_STEPS = [
  'Connecting to CDO network…',
  'Syncing live jeepney positions…',
  'Fetching weather & routes…',
  'Almost there…',
];

let isLoadingScreen = false;

function showLoadingScreen() {
  return new Promise(resolve => {
    if (isLoadingScreen) return;
    isLoadingScreen = true;

    const screen = $('#loadingScreen');
    const bar    = $('#loadBar');
    const status = $('#loadStatus');

    bar.style.width = '0%';
    status.textContent = LOAD_STEPS[0];
    screen.classList.add('show');

    let pct = 0;
    let step = 0;

    const int = setInterval(() => {
      pct = Math.min(100, pct + Math.random() * 22 + 8);
      bar.style.width = pct + '%';

      const idx = Math.min(LOAD_STEPS.length - 1, Math.floor((pct / 100) * LOAD_STEPS.length));
      if (idx !== step) {
        step = idx;
        status.textContent = LOAD_STEPS[idx];
      }

      if (pct >= 100) {
        clearInterval(int);
        status.textContent = 'Ready!';
        setTimeout(() => {
          screen.classList.remove('show');
          isLoadingScreen = false;
          resolve();
        }, 340);
      }
    }, 260);
  });
}

/* ------------------------------------------------------------
   LOGIN
   ------------------------------------------------------------ */
function enterApp(name) {
  state.user = name;
  const handle = '@' + name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._]/g, '') || '@commuter';

  $('#userName').textContent = name;
  $('#meName').textContent = name;
  $('#meHandle').textContent = handle;
  $('#greeting').textContent = greetingFor(new Date());

  $('#viewLogin').classList.remove('is-active');
  $('#viewApp').classList.add('is-active');

  setTab('home');
  renderAll();
}

function logout() {
  $('#viewApp').classList.remove('is-active');
  $('#viewLogin').classList.add('is-active');
  $('#password').value = '';
  $('#username').value = '';
  state.dest = null;
  state.planRoute = null;
  $('#planCard').innerHTML = '';
  $('#searchInput').value = '';
  $('#clearSearch').classList.add('hidden');
  $('#suggestions').classList.remove('show');
  closeModal();
  toast('Signed out. Balik-balik!');
}

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (isLoadingScreen) return;

  const btn  = $('#btnLogin');
  const name = $('#username').value.trim() || 'Commuter';

  btn.classList.add('loading');
  btn.blur();

  await showLoadingScreen();

  btn.classList.remove('loading');
  enterApp(name);
});

$('#togglePw').addEventListener('click', () => {
  const input = $('#password');
  input.type = input.type === 'password' ? 'text' : 'password';
});

$('#btnGuest').addEventListener('click', async () => {
  if (isLoadingScreen) return;
  await showLoadingScreen();
  enterApp('Guest Commuter');
  toast('Browsing as guest — full demo access');
});

$('#btnForgot').addEventListener('click', () => {
  openModal({
    title: 'Reset password',
    sub: 'Enter your email and we’ll send a reset link. (Demo — nothing is actually sent.)',
    body: `<input class="modal-input" type="email" placeholder="you@email.com" />`,
    actions: [
      { label: 'Cancel', cls: 'btn-ghost' },
      {
        label: 'Send link',
        cls: 'btn-primary',
        onClick: () => {
          closeModal();
          toast('Reset link sent — check your inbox ✉️');
        },
      },
    ],
  });
});

$('#btnCreate').addEventListener('click', () => {
  openModal({
    title: 'Create account',
    sub: 'No verification needed in this demo. Just pick a name and go.',
    body: `
      <input class="modal-input" type="text" id="newName" placeholder="Full name" />
      <input class="modal-input" type="email" placeholder="Email address" />
      <input class="modal-input" type="password" placeholder="Password" />
    `,
    actions: [
      { label: 'Cancel', cls: 'btn-ghost' },
      {
        label: 'Create',
        cls: 'btn-primary',
        onClick: () => {
          const name = ($('#newName')?.value || '').trim();
          closeModal();
          if (name) $('#username').value = name;
          toast('Account created — you can sign in now 🎉');
        },
      },
    ],
  });
});

/* ------------------------------------------------------------
   TABS
   ------------------------------------------------------------ */
function setTab(tab) {
  state.tab = tab;
  $$('.tab-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === tab));
  $$('.tab-btn').forEach(b => b.classList.toggle('is-on', b.dataset.tab === tab));
  $('#appBody').scrollTop = 0;

  if (tab === 'routes') renderAllRoutes();
  if (tab === 'alerts') renderAlerts();
}

/* ------------------------------------------------------------
   CLOCK
   ------------------------------------------------------------ */
function tickClock() {
  const d = new Date();

  let h24 = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const hh = String(h12).padStart(2, '0');

  $('#statusTime').textContent = `${hh}:${m}`;
  $('#clockChip').textContent = `${h12}:${m} ${ap}`;
  $('#bigTime').textContent = `${h12}:${m}`;
  $('#bigAmPm').textContent = ap;

  $('#dateText').textContent = d.toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  if (state.user) $('#greeting').textContent = greetingFor(d);
}

/* ------------------------------------------------------------
   WEATHER
   ------------------------------------------------------------ */
function renderWeather(w) {
  $('#weatherIcon').textContent = w.icon;
  $('#weatherTemp').textContent = w.temp;
  $('#weatherLabel').textContent = w.label;
  $('#weatherHumidity').textContent = w.hum;
  $('#weatherWind').textContent = w.wind;
  $('#weatherChip').textContent = `${w.icon} ${w.temp}°C`;
}

/* ------------------------------------------------------------
   ROUTE RENDERING
   ------------------------------------------------------------ */
function routeItemHTML(r) {
  const isBus = r.type === 'Bus';
  return `
    <button type="button" class="route-item glass" data-action="route" data-id="${r.id}">
      <span class="route-icon ${isBus ? 'bus' : 'jeep'}">${isBus ? 'B' : 'J'}</span>
      <span class="route-main">
        <span class="route-name">${r.name}</span>
        <span class="route-meta">${r.vehicles} ${isBus ? 'buses' : 'jeepneys'} · every ${r.headway} min · ₱${r.fare}</span>
      </span>
      <span class="route-right">
        <span class="route-eta">${r.eta} min</span>
        <span class="route-load ${r.load}">${loadLabel(r.load)}</span>
      </span>
    </button>`;
}

function renderHomeRoutes() {
  const near = [...ROUTES].sort((a, b) => a.eta - b.eta).slice(0, 4);
  $('#homeRoutes').innerHTML = near.map(routeItemHTML).join('');
}

function renderAllRoutes() {
  const list = state.filter === 'all'
    ? ROUTES
    : ROUTES.filter(r => r.type === state.filter);

  $('#routeCount').textContent = `${list.length} route${list.length === 1 ? '' : 's'}`;
  $('#allRoutes').innerHTML = list.length
    ? list.map(routeItemHTML).join('')
    : `<p class="muted" style="text-align:center;padding:24px 0">No routes match this filter.</p>`;
}

function renderAlerts() {
  $('#alertsList').innerHTML = ALERTS.map(a => `
    <div class="alert-item glass">
      <span class="alert-icon ${a.level}">${a.icon}</span>
      <div class="alert-body">
        <p class="alert-title">${a.title}</p>
        <p class="alert-text">${a.text}</p>
        <p class="alert-time">${a.time}</p>
      </div>
    </div>`).join('');
}

function renderAll() {
  renderHomeRoutes();
  renderAllRoutes();
  renderAlerts();
}

/* ------------------------------------------------------------
   SEARCH
   ------------------------------------------------------------ */
function renderSuggestions(q) {
  const box = $('#suggestions');
  const query = q.trim().toLowerCase();

  if (!query) {
    box.classList.remove('show');
    box.innerHTML = '';
    return;
  }

  const matches = PLACES
    .filter(p => p.n.toLowerCase().includes(query) || p.a.toLowerCase().includes(query))
    .slice(0, 6);

  if (!matches.length) {
    box.classList.remove('show');
    box.innerHTML = '';
    return;
  }

  box.innerHTML = matches.map(p => `
    <button type="button" class="sug-item" data-action="dest" data-name="${p.n}">
      <svg class="pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/>
        <circle cx="12" cy="10" r="2.6"/>
      </svg>
      <span>${p.n}</span>
      <small>${p.a}</small>
    </button>`).join('');

  box.classList.add('show');
}

$('#searchInput').addEventListener('input', e => {
  const v = e.target.value;
  $('#clearSearch').classList.toggle('hidden', !v);
  renderSuggestions(v);
});

$('#clearSearch').addEventListener('click', () => {
  $('#searchInput').value = '';
  $('#clearSearch').classList.add('hidden');
  $('#suggestions').classList.remove('show');
  $('#searchInput').focus();
});

/* ------------------------------------------------------------
   PLAN CARD
   ------------------------------------------------------------ */
function pickRoute(place) {
  return ROUTES[hashStr(place) % ROUTES.length];
}

function renderPlan(place) {
  const r = pickRoute(place);
  state.dest = place;
  state.planRoute = r;

  const walkMin = 1 + (hashStr(place) % 4);
  const walkM = 90 + (hashStr(place) % 260);
  const transfers = r.vehicles > 8 ? 'Direct ride' : '1 short stop';

  $('#planCard').innerHTML = `
    <div class="card plan glass">
      <div class="card-head">
        <div>
          <p class="plan-eyebrow">Best route to</p>
          <h3 class="plan-dest">${place}</h3>
        </div>
        <span class="pill live"><i class="dot"></i>Live</span>
      </div>

      <div class="plan-legs">
        <div class="leg">
          <span class="leg-dot walk"></span>
          <div>
            <p class="leg-title">Walk to nearest loading bay</p>
            <p class="leg-sub">${walkMin} min · ${walkM} m</p>
          </div>
        </div>
        <div class="leg">
          <span class="leg-dot"></span>
          <div>
            <p class="leg-title">${r.type} ${r.code} — ${r.name}</p>
            <p class="leg-sub">${r.vehicles} units en route · ${transfers} · ₱${r.fare}</p>
          </div>
        </div>
        <div class="leg">
          <span class="leg-dot"></span>
          <div>
            <p class="leg-title">Arrive at ${place}</p>
            <p class="leg-sub" id="planArrive">Approx. ${walkMin + r.eta} min from now</p>
          </div>
        </div>
      </div>

      <div class="plan-stats">
        <div><b id="planEta">${r.eta}</b><span>min ETA</span></div>
        <div><b id="planVeh">${r.vehicles}</b><span>vehicles</span></div>
        <div><b id="planFare">₱${r.fare}</b><span>fare</span></div>
      </div>

      <button type="button" class="btn-primary sm" data-action="startTrip">Start trip</button>
    </div>`;

  $('#searchInput').value = place;
  $('#clearSearch').classList.remove('hidden');
  $('#suggestions').classList.remove('show');

  toast(`Route found to ${place} — ${r.eta} min away`);
}

function updatePlanLive() {
  const r = state.planRoute;
  if (!r || !$('#planEta')) return;
  $('#planEta').textContent = r.eta;
  $('#planVeh').textContent = r.vehicles;
  const arrive = $('#planArrive');
  if (arrive) {
    const walkMin = 1 + (hashStr(state.dest || '') % 4);
    arrive.textContent = `Approx. ${walkMin + r.eta} min from now`;
  }
}

/* ------------------------------------------------------------
   ROUTE DETAIL MODAL
   ------------------------------------------------------------ */
function showRouteDetail(id) {
  const r = ROUTES.find(x => x.id === id);
  if (!r) return;

  const timeline = r.stops.map(s => `
    <div class="tl-row"><span class="tl-dot"></span><span>${s}</span></div>
  `).join('');

  openModal({
    title: r.name,
    sub: `${r.type} ${r.code} · via ${r.via}`,
    body: `
      <div class="modal-stats">
        <div><b>${r.eta}</b><span>min away</span></div>
        <div><b>${r.vehicles}</b><span>units</span></div>
        <div><b>₱${r.fare}</b><span>fare</span></div>
      </div>
      <div class="tl">${timeline}</div>
    `,
    actions: [
      { label: 'Close', cls: 'btn-ghost' },
      {
        label: 'Start trip',
        cls: 'btn-primary',
        onClick: () => {
          closeModal();
          toast(`Trip started — tracking ${r.name}`);
        },
      },
    ],
  });
}

/* ------------------------------------------------------------
   EVENT DELEGATION
   ------------------------------------------------------------ */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) {
    if (!e.target.closest('.search-wrap')) $('#suggestions').classList.remove('show');
    return;
  }

  const action = el.dataset.action;

  if (action === 'tab') {
    setTab(el.dataset.tab);
    return;
  }

  if (action === 'filter') {
    state.filter = el.dataset.filter;
    $$('#filterChips .chip-btn').forEach(b =>
      b.classList.toggle('is-on', b.dataset.filter === state.filter)
    );
    renderAllRoutes();
    return;
  }

  if (action === 'dest') {
    renderPlan(el.dataset.name);
    return;
  }

  if (action === 'route') {
    showRouteDetail(el.dataset.id);
    return;
  }

  if (action === 'startTrip') {
    const dest = state.dest || 'your destination';
    toast(`Trip started to ${dest} — we'll ping you at each stop 🚏`);
    return;
  }

  if (action === 'logout') {
    logout();
    return;
  }

  if (action === 'soon') {
    toast('Coming soon in this demo ✨');
    return;
  }
});

$('#modalScrim').addEventListener('click', e => {
  if (e.target === $('#modalScrim')) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    $('#suggestions').classList.remove('show');
  }
});

/* ------------------------------------------------------------
   LIVE SIMULATION TICK
   ------------------------------------------------------------ */
function tickLive() {
  ROUTES.forEach(r => {
    if (Math.random() < 0.5) {
      r.eta = Math.max(1, Math.min(28, r.eta + (Math.random() < 0.5 ? -1 : 1)));
    }
    if (Math.random() < 0.35) {
      r.vehicles = Math.max(1, Math.min(20, r.vehicles + (Math.random() < 0.5 ? -1 : 1)));
    }
    if (Math.random() < 0.25) {
      r.load = LOADS[Math.floor(Math.random() * LOADS.length)];
    }
  });

  renderHomeRoutes();
  if (state.tab === 'routes') renderAllRoutes();
  updatePlanLive();
}

/* ------------------------------------------------------------
   BOOT
   ------------------------------------------------------------ */
(function init() {
  tickClock();
  setInterval(tickClock, 1000);

  renderWeather(WEATHER[0]);
  let wi = 0;
  setInterval(() => {
    wi = (wi + 1) % WEATHER.length;
    renderWeather(WEATHER[wi]);
  }, 24000);

  renderAll();
  setInterval(tickLive, 2600);

  setTimeout(() => {
    if (!state.user) toast('Tip: any username & password works in this demo', 2800);
  }, 1400);
})();