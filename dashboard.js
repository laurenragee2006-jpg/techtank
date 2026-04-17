const SUPABASE_URL = 'https://fqqyguufldcvckyaqzxw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8LxqtjUExBClidRzt4tH1Q_GIqttXmr';

if (!window.supabase) {
  document.body.innerHTML = '<p style="color:red;padding:2rem">Supabase failed to load. Check your internet connection and try again.</p>';
  throw new Error('Supabase CDN not loaded');
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const AVATAR_COLORS = [
  ['#1a3a1a','#B4FF6A'],['#1a2a3a','#7ab8f5'],['#2a1a3a','#c9a6ff'],
  ['#2a1a1a','#f5a07a'],['#1a2a2a','#80e0d0'],['#2a2a1a','#f0d060'],
  ['#1a1a2a','#a0b0ff'],['#2a1a2a','#ff90c0'],['#1a2a1a','#90e090'],['#2a1a1a','#ffb060'],
];

let allApplicants = [];
let filteredData = [];
let currentApplicant = null;

function initials(first, last) {
  return ((first || '?')[0] + (last || '?')[0]).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- AUTH ---

let userGroup = null;

db.auth.onAuthStateChange((event, session) => {
  if (session) {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('userEmail').textContent = session.user.email;
    setTimeout(() => {
      loadGroup(session.user.email);
      loadApplicants();
    }, 500);
  } else {
    document.getElementById('loginOverlay').style.display = 'flex';
  }
});

async function loadGroup(email) {
  const { data } = await db.from('groups').select('*').eq('owner_email', email).single();
  if (data) {
    userGroup = data;
    document.querySelector('.db-group__avatar').textContent = data.name.slice(0, 2).toUpperCase();
    document.querySelector('.db-group__info strong').textContent = data.name;
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const errEl = document.getElementById('loginError');
  const btn = document.querySelector('.login-card .btn--primary');
  if (!email) return;

  errEl.style.display = 'none';
  btn.textContent = 'Sending...';
  btn.disabled = true;

  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'https://techtank-rho.vercel.app/dashboard.html' }
  });

  if (error) {
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    btn.textContent = 'Send sign-in link →';
    btn.disabled = false;
    return;
  }

  document.querySelector('.login-card').innerHTML = `
    <div class="login-card__logo">deal<span>flow</span></div>
    <h2>Check your email</h2>
    <p style="color:var(--text-muted)">We sent a link to <strong style="color:var(--text)">${email}</strong> — click it to open the dashboard.</p>
  `;
}

async function handleSignOut() {
  await db.auth.signOut();
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  allApplicants = [];
  filteredData = [];
  renderTable([]);
}

// --- DATA ---

async function loadApplicants() {
  const { data, error } = await db
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('loadApplicants error:', JSON.stringify(error)); return; }

  allApplicants = data || [];
  filteredData = [...allApplicants];
  renderTable(filteredData);
  updateStats();
}

function updateStats() {
  const total = allApplicants.length;
  const shortlisted = allApplicants.filter(a => a.status === 'Shortlisted').length;
  const pending = allApplicants.filter(a => a.status === 'New').length;
  const thisWeek = allApplicants.filter(a => {
    const d = new Date(a.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  const stats = document.querySelectorAll('.db-stat__num');
  if (stats[0]) stats[0].textContent = total;
  if (stats[1]) stats[1].textContent = shortlisted;
  if (stats[2]) stats[2].textContent = pending;
  if (stats[3]) stats[3].textContent = thisWeek;

  document.querySelector('.db-count').textContent = `${total} total`;
}

// --- TABLE ---

function renderTable(data) {
  const tbody = document.getElementById('applicantBody');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-dim)">No applicants found.</td></tr>`;
    return;
  }

  data.forEach((a, i) => {
    const [bg, color] = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const statusClass = {
      'New': 'badge--new', 'Reviewed': 'badge--reviewed',
      'Shortlisted': 'badge--shortlisted', 'Passed': 'badge--passed',
    }[a.status] || 'badge--new';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="db-founder">
          <div class="db-avatar" style="background:${bg};color:${color}">${initials(a.first_name, a.last_name)}</div>
          <span class="db-founder-name">${a.first_name} ${a.last_name}</span>
        </div>
      </td>
      <td style="color:var(--text-muted)">${a.company_name || '—'}</td>
      <td style="color:var(--text-muted)">${a.sector || '—'}</td>
      <td style="color:var(--text-muted)">${a.stage || '—'}</td>
      <td style="color:var(--text-muted)">${a.raising || '—'}</td>
      <td style="color:var(--text-dim)">${a.location || '—'}</td>
      <td><span class="db-badge ${statusClass}">${a.status || 'New'}</span></td>
      <td style="color:var(--text-dim);white-space:nowrap">${formatDate(a.created_at)}</td>
    `;
    tr.addEventListener('click', () => openDrawer(a, bg, color));
    tbody.appendChild(tr);
  });
}

// --- SEARCH & FILTER ---

document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  filteredData = allApplicants.filter(a =>
    `${a.first_name} ${a.last_name} ${a.company_name} ${a.sector} ${a.stage} ${a.location} ${a.status}`.toLowerCase().includes(q)
  );
  renderTable(filteredData);
});

function filterApplicants() {
  const selects = document.querySelectorAll('.db-filters select');
  const [sector, stage, status] = [...selects].map(s => s.value);
  filteredData = allApplicants.filter(a =>
    (!sector || a.sector === sector) &&
    (!stage  || a.stage === stage)   &&
    (!status || a.status === status)
  );
  renderTable(filteredData);
}

function toggleFilters() {
  const bar = document.getElementById('filterBar');
  bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
}

// --- AI PANEL ---

function toggleAI() {
  const panel = document.getElementById('aiPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') document.getElementById('aiInput').focus();
}

function setQuery(q) {
  document.getElementById('aiInput').value = q;
  runAIQuery();
}

function runAIQuery() {
  const q = document.getElementById('aiInput').value.toLowerCase().trim();
  const result = document.getElementById('aiResult');
  if (!q) return;

  result.style.display = 'block';
  result.textContent = 'Thinking...';

  setTimeout(() => {
    const words = q.replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
    const matches = allApplicants.filter(a => {
      const blob = `${a.sector} ${a.stage} ${a.location} ${a.description} ${a.traction} ${a.status}`.toLowerCase();
      return words.some(w => blob.includes(w));
    });

    if (matches.length === 0) {
      result.textContent = 'No applicants matched that query.';
      return;
    }

    result.innerHTML = `
      <strong style="color:var(--accent);font-size:12px;">✦ AI result</strong><br><br>
      Found <strong>${matches.length}</strong> applicant${matches.length !== 1 ? 's' : ''} matching your query:<br><br>
      ${matches.slice(0, 5).map(a => `<span style="color:var(--text)">→ ${a.first_name} ${a.last_name}</span> — ${a.company_name} (${a.sector}, ${a.stage}, ${a.location})`).join('<br>')}
      ${matches.length > 5 ? `<br><span style="color:var(--text-dim)">...and ${matches.length - 5} more</span>` : ''}
    `;
    renderTable(matches);
  }, 600);
}

document.getElementById('aiInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') runAIQuery();
});

// --- DRAWER ---

function openDrawer(a, bg, color) {
  currentApplicant = a;

  document.getElementById('drawerAvatar').style.background = bg;
  document.getElementById('drawerAvatar').style.color = color;
  document.getElementById('drawerAvatar').textContent = initials(a.first_name, a.last_name);
  document.getElementById('drawerName').textContent = `${a.first_name} ${a.last_name}`;
  document.getElementById('drawerCompany').textContent = `${a.company_name || '—'} · ${a.stage || '—'}`;

  const s = a.status || 'New';
  document.getElementById('drawerBody').innerHTML = `
    <div class="drawer-section">
      <div class="drawer-section-title">Status</div>
      <div class="drawer-status-row">
        <button class="status-btn ${s==='New'?'active-green':''}"          onclick="setStatus(this,'New')">New</button>
        <button class="status-btn ${s==='Reviewed'?'active-blue':''}"      onclick="setStatus(this,'Reviewed')">Reviewed</button>
        <button class="status-btn ${s==='Shortlisted'?'active-purple':''}" onclick="setStatus(this,'Shortlisted')">Shortlisted</button>
        <button class="status-btn ${s==='Passed'?'active-gray':''}"        onclick="setStatus(this,'Passed')">Passed</button>
      </div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Company</div>
      <div class="drawer-field"><span class="drawer-field__label">Company</span><span class="drawer-field__value">${a.company_name||'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Website</span><span class="drawer-field__value">${a.website?`<a href="${a.website}" target="_blank" style="color:var(--blue)">${a.website}</a>`:'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Sector</span><span class="drawer-field__value">${a.sector||'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Stage</span><span class="drawer-field__value">${a.stage||'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Location</span><span class="drawer-field__value">${a.location||'—'}</span></div>
      <div class="drawer-field" style="flex-direction:column;gap:6px"><span class="drawer-field__label">Description</span><span class="drawer-field__value" style="text-align:left;line-height:1.6">${a.description||'—'}</span></div>
      <div class="drawer-field" style="flex-direction:column;gap:6px"><span class="drawer-field__label">Problem</span><span class="drawer-field__value" style="text-align:left;line-height:1.6">${a.problem||'—'}</span></div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Fundraising</div>
      <div class="drawer-field"><span class="drawer-field__label">Raising</span><span class="drawer-field__value">${a.raising||'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Committed</span><span class="drawer-field__value">${a.committed||'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Revenue (MRR)</span><span class="drawer-field__value">${a.revenue||'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Prior funding</span><span class="drawer-field__value">${a.prior_funding||'—'}</span></div>
      <div class="drawer-field" style="flex-direction:column;gap:6px"><span class="drawer-field__label">Traction</span><span class="drawer-field__value" style="text-align:left;line-height:1.6">${a.traction||'—'}</span></div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Why us</div>
      <div class="drawer-field" style="flex-direction:column;gap:6px"><span class="drawer-field__value" style="text-align:left;line-height:1.6">${a.why||'—'}</span></div>
    </div>

    ${a.deck_url ? `
    <div class="drawer-section">
      <div class="drawer-section-title">Materials</div>
      <a href="${a.deck_url}" target="_blank" class="btn btn--ghost" style="font-size:13px;padding:8px 16px;display:inline-block">↓ View pitch deck</a>
    </div>` : ''}

    <div class="drawer-section">
      <div class="drawer-section-title">Contact</div>
      <div class="drawer-field"><span class="drawer-field__label">Email</span><span class="drawer-field__value"><a href="mailto:${a.email}" style="color:var(--blue)">${a.email||'—'}</a></span></div>
      <div class="drawer-field"><span class="drawer-field__label">LinkedIn</span><span class="drawer-field__value">${a.linkedin?`<a href="${a.linkedin}" target="_blank" style="color:var(--blue)">${a.linkedin}</a>`:'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Role</span><span class="drawer-field__value">${a.role||'—'}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Applied</span><span class="drawer-field__value">${formatDate(a.created_at)}</span></div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Notes</div>
      <textarea class="drawer-notes" id="drawerNotes" placeholder="Add notes about this applicant...">${a.notes||''}</textarea>
      <button class="btn btn--ghost" style="font-size:12px;padding:7px 16px;margin-top:8px" onclick="saveNotes()">Save notes</button>
    </div>
  `;

  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  currentApplicant = null;
}

async function setStatus(btn, status) {
  btn.closest('.drawer-status-row').querySelectorAll('.status-btn').forEach(b => b.className = 'status-btn');
  const classMap = { 'New':'active-green', 'Reviewed':'active-blue', 'Shortlisted':'active-purple', 'Passed':'active-gray' };
  btn.classList.add(classMap[status]);

  if (!currentApplicant) return;
  currentApplicant.status = status;
  await db.from('applications').update({ status }).eq('id', currentApplicant.id);

  const idx = allApplicants.findIndex(a => a.id === currentApplicant.id);
  if (idx !== -1) allApplicants[idx].status = status;
  filteredData = filteredData.map(a => a.id === currentApplicant.id ? { ...a, status } : a);
  renderTable(filteredData);
  updateStats();
}

async function saveNotes() {
  if (!currentApplicant) return;
  const notes = document.getElementById('drawerNotes').value;
  await db.from('applications').update({ notes }).eq('id', currentApplicant.id);
  const idx = allApplicants.findIndex(a => a.id === currentApplicant.id);
  if (idx !== -1) allApplicants[idx].notes = notes;
  const btn = document.querySelector('#drawerNotes + button');
  if (btn) { btn.textContent = 'Saved ✓'; setTimeout(() => btn.textContent = 'Save notes', 1500); }
}

// --- SIDEBAR NAV ---

document.querySelectorAll('.db-nav__item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const text = item.textContent.trim();

    if (text.includes('AI search')) { toggleAI(); return; }

    document.querySelectorAll('.db-nav__item').forEach(i => i.classList.remove('db-nav__item--active'));
    item.classList.add('db-nav__item--active');

    if (text.includes('All')) {
      filteredData = [...allApplicants];
      document.querySelector('.db-topbar__left h1').textContent = 'All applicants';
    } else if (text.includes('Shortlisted')) {
      filteredData = allApplicants.filter(a => a.status === 'Shortlisted');
      document.querySelector('.db-topbar__left h1').textContent = 'Shortlisted';
    } else if (text.includes('Pending')) {
      filteredData = allApplicants.filter(a => a.status === 'New');
      document.querySelector('.db-topbar__left h1').textContent = 'Pending review';
    }

    document.querySelector('.db-count').textContent = `${filteredData.length} total`;
    renderTable(filteredData);
  });
});
