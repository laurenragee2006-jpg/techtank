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

// Check for error in URL hash (e.g. expired reset link)
(function() {
  const hash = window.location.hash;
  if (hash.includes('error=access_denied') || hash.includes('error_code=otp_expired')) {
    const errEl = document.getElementById('loginError');
    if (errEl) {
      errEl.textContent = 'That link has expired. Please request a new password reset.';
      errEl.style.display = 'block';
    }
    history.replaceState(null, '', window.location.pathname);
  }
})();

db.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    // Show set-password form instead of dashboard
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('setPasswordOverlay').style.display = 'flex';
    return;
  }
  if (session) {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('setPasswordOverlay').style.display = 'none';
    document.getElementById('userEmail').textContent = session.user.email;
    setTimeout(() => {
      loadGroup(session.user.email);
      loadApplicants();
    }, 500);
  } else {
    document.getElementById('loginOverlay').style.display = 'flex';
  }
});

async function handleSetPassword() {
  const pass = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const errEl = document.getElementById('setPasswordError');
  const btn = document.getElementById('setPasswordBtn');

  if (!pass || pass.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block'; return;
  }
  if (pass !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block'; return;
  }

  btn.textContent = 'Saving...';
  btn.disabled = true;
  errEl.style.display = 'none';

  const { error } = await db.auth.updateUser({ password: pass });
  if (error) {
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    btn.textContent = 'Set password →';
    btn.disabled = false;
    return;
  }

  // Password set — reload to enter dashboard normally
  window.location.href = 'dashboard.html';
}

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
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.querySelector('.login-card .btn--primary');
  if (!email || !password) return;

  errEl.style.display = 'none';
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    errEl.textContent = 'Invalid email or password.';
    errEl.style.display = 'block';
    btn.textContent = 'Sign in →';
    btn.disabled = false;
    return;
  }
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
    const isFiltered = allApplicants.length > 0;
    tbody.innerHTML = `<tr><td colspan="8">
      <div style="text-align:center;padding:4rem 2rem;color:var(--text-dim)">
        <div style="font-size:24px;margin-bottom:0.75rem">${isFiltered ? '🔍' : '📭'}</div>
        <div style="font-size:14px;font-weight:500;color:var(--text-muted);margin-bottom:0.4rem">${isFiltered ? 'No applicants match this filter' : 'No applications yet'}</div>
        <div style="font-size:12px">${isFiltered ? 'Try a different filter or search term' : 'Share your apply link to start receiving applications'}</div>
      </div>
    </td></tr>`;
    return;
  }

  data.forEach((a, i) => {
    const [bg, color] = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const statusClass = {
      'New': 'badge--new', 'Reviewed': 'badge--reviewed',
      'Shortlisted': 'badge--shortlisted', 'Passed': 'badge--passed',
      'Denied': 'badge--denied',
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
    const words = q.replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 1);
    const matches = allApplicants.filter(a => {
      const blob = [
        a.first_name, a.last_name, a.company_name, a.company_legal_name,
        a.ceo_name, a.email, a.role, a.location, a.city_town, a.state_region, a.country,
        a.industry, a.sector, a.stage, a.business_stage, a.status,
        a.value_proposition, a.description, a.target_market, a.business_model_detail,
        a.customers, a.competitors, a.competitive_advantage,
        a.capital_raise_target, a.raising, a.funding_type,
        a.lead_investor, a.previous_investors, a.prior_funding,
        a.traction, a.trailing_revenue, a.revenue,
        a.exit_strategy, a.risks, a.referred_by, a.notes
      ].filter(Boolean).join(' ').toLowerCase();
      return words.some(w => blob.includes(w));
    });

    if (matches.length === 0) {
      result.textContent = 'No applicants matched that query.';
      return;
    }

    result.innerHTML = `
      <strong style="color:var(--accent);font-size:12px;">✦ AI result</strong><br><br>
      Found <strong>${matches.length}</strong> applicant${matches.length !== 1 ? 's' : ''} matching your query:<br><br>
      ${matches.slice(0, 5).map(a => `<span style="color:var(--text)">→ ${a.first_name} ${a.last_name}</span> — ${a.company_name || a.company_legal_name || '—'} · ${a.industry || a.sector || '—'} · ${a.business_stage || a.stage || '—'} · ${a.location || a.city_town || '—'}`).join('<br>')}
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
        <button class="status-btn ${s==='Denied'?'active-red':''}"         onclick="setStatus(this,'Denied')">Denied</button>
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
      <div class="drawer-section-title">Diligence</div>
      <button class="btn btn--primary" style="font-size:13px;padding:9px 18px;width:100%" onclick="generateReport(currentApplicant)">✦ Generate diligence report</button>
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
  const classMap = { 'New':'active-green', 'Reviewed':'active-blue', 'Shortlisted':'active-purple', 'Passed':'active-gray', 'Denied':'active-red' };
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

// --- ANALYTICS ---

let chartInstances = {};

function showAnalytics() {
  document.getElementById('analyticsPanel').style.display = 'flex';
  document.querySelector('.db-table-wrap').style.display = 'none';
  document.querySelector('.db-stats').style.display = 'none';
  document.querySelector('.db-topbar').style.display = 'none';
  renderAnalytics();
}

function hideAnalytics() {
  document.getElementById('analyticsPanel').style.display = 'none';
  document.querySelector('.db-table-wrap').style.display = '';
  document.querySelector('.db-stats').style.display = '';
  document.querySelector('.db-topbar').style.display = '';
}

function destroyCharts() {
  Object.values(chartInstances).forEach(c => c.destroy());
  chartInstances = {};
}

function renderAnalytics() {
  destroyCharts();
  const data = allApplicants;
  const n = data.length;

  // KPI cards
  const shortlisted = data.filter(a => a.status === 'Shortlisted').length;
  const reviewed = data.filter(a => a.status !== 'New').length;
  const conversion = n > 0 ? Math.round((shortlisted / n) * 100) : 0;

  const nowMs = Date.now();
  const newApps = data.filter(a => a.status === 'New');
  const avgDays = newApps.length > 0
    ? Math.round(newApps.reduce((sum, a) => sum + (nowMs - new Date(a.created_at)) / 86400000, 0) / newApps.length)
    : 0;

  document.getElementById('an-total').textContent = n;
  document.getElementById('an-shortlisted').textContent = shortlisted;
  document.getElementById('an-conversion').textContent = conversion + '%';
  document.getElementById('an-avgdays').textContent = avgDays + 'd';

  const chartDefaults = {
    color: 'rgba(232,228,220,0.5)',
    font: { family: "'DM Sans', sans-serif", size: 11 }
  };
  Chart.defaults.color = 'rgba(232,228,220,0.4)';
  Chart.defaults.font.family = "'DM Sans', sans-serif";
  Chart.defaults.font.size = 11;

  const gridColor = 'rgba(255,255,255,0.06)';

  // --- FUNNEL ---
  const funnelStages = ['Applied', 'Reviewed', 'Shortlisted', 'Passed'];
  const funnelCounts = [
    n,
    data.filter(a => ['Reviewed','Shortlisted','Passed'].includes(a.status)).length,
    data.filter(a => a.status === 'Shortlisted').length,
    data.filter(a => a.status === 'Passed').length,
  ];
  chartInstances.funnel = new Chart(document.getElementById('chartFunnel'), {
    type: 'bar',
    data: {
      labels: funnelStages,
      datasets: [{
        data: funnelCounts,
        backgroundColor: ['rgba(180,255,106,0.7)','rgba(122,184,245,0.7)','rgba(201,166,255,0.7)','rgba(255,180,100,0.7)'],
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      }
    }
  });

  // --- APPLICATIONS OVER TIME ---
  const weekMap = {};
  data.forEach(a => {
    const d = new Date(a.created_at);
    const week = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() - d.getDay() + 6) / 7)).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}`;
    weekMap[week] = (weekMap[week] || 0) + 1;
  });
  const timeLabels = Object.keys(weekMap).sort().slice(-12);
  const timeCounts = timeLabels.map(k => weekMap[k]);
  chartInstances.time = new Chart(document.getElementById('chartTime'), {
    type: 'line',
    data: {
      labels: timeLabels.map(l => l.split('-').slice(1).join(' ')),
      datasets: [{
        data: timeCounts,
        borderColor: 'rgba(180,255,106,0.8)',
        backgroundColor: 'rgba(180,255,106,0.08)',
        fill: true, tension: 0.4, pointRadius: 3,
        pointBackgroundColor: 'rgba(180,255,106,0.9)',
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor } },
        y: { grid: { color: gridColor }, ticks: { precision: 0 } }
      }
    }
  });

  // --- STAGE BREAKDOWN ---
  const stageCounts = {};
  data.forEach(a => { const s = a.stage || 'Unknown'; stageCounts[s] = (stageCounts[s] || 0) + 1; });
  const stageColors = ['rgba(180,255,106,0.8)','rgba(122,184,245,0.8)','rgba(201,166,255,0.8)','rgba(255,180,100,0.8)','rgba(80,220,200,0.8)','rgba(255,120,120,0.8)'];
  chartInstances.stage = new Chart(document.getElementById('chartStage'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(stageCounts),
      datasets: [{ data: Object.values(stageCounts), backgroundColor: stageColors, borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 12 } } },
      cutout: '65%'
    }
  });

  // --- SECTOR/INDUSTRY ---
  const sectorCounts = {};
  data.forEach(a => { const s = a.industry || a.sector || 'Other'; sectorCounts[s] = (sectorCounts[s] || 0) + 1; });
  const topSectors = Object.entries(sectorCounts).sort((a,b) => b[1]-a[1]).slice(0, 8);
  chartInstances.sector = new Chart(document.getElementById('chartSector'), {
    type: 'bar',
    data: {
      labels: topSectors.map(s => s[0]),
      datasets: [{ data: topSectors.map(s => s[1]), backgroundColor: 'rgba(122,184,245,0.7)', borderRadius: 4, borderSkipped: false }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 30, minRotation: 20 } },
        y: { grid: { color: gridColor }, ticks: { precision: 0 } }
      }
    }
  });

  // --- RAISE DISTRIBUTION ---
  const raiseOrder = ['Under $250k','$250k – $500k','$500k – $1M','$1M – $2M','$2M – $5M','$5M+'];
  const raiseCounts = {};
  raiseOrder.forEach(r => raiseCounts[r] = 0);
  data.forEach(a => {
    const r = a.capital_raise_target || a.raising || '';
    if (r.includes('under-250k') || r.includes('Under')) raiseCounts['Under $250k']++;
    else if (r.includes('250k-500k') || r.includes('250k')) raiseCounts['$250k – $500k']++;
    else if (r.includes('500k-1m') || r.includes('500k')) raiseCounts['$500k – $1M']++;
    else if (r.includes('1m-2m') || r.includes('1M')) raiseCounts['$1M – $2M']++;
    else if (r.includes('2m-5m') || r.includes('2M')) raiseCounts['$2M – $5M']++;
    else if (r.includes('5m+') || r.includes('5M')) raiseCounts['$5M+']++;
  });
  chartInstances.raise = new Chart(document.getElementById('chartRaise'), {
    type: 'bar',
    data: {
      labels: raiseOrder,
      datasets: [{ data: raiseOrder.map(r => raiseCounts[r]), backgroundColor: 'rgba(201,166,255,0.7)', borderRadius: 4, borderSkipped: false }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 20 } },
        y: { grid: { color: gridColor }, ticks: { precision: 0 } }
      }
    }
  });

  // --- TOP LOCATIONS ---
  const locCounts = {};
  data.forEach(a => { const l = a.location || a.city_town; if (l) locCounts[l] = (locCounts[l]||0)+1; });
  const topLocs = Object.entries(locCounts).sort((a,b) => b[1]-a[1]).slice(0, 8);
  chartInstances.locs = new Chart(document.getElementById('chartLocations'), {
    type: 'bar',
    data: {
      labels: topLocs.map(l => l[0]),
      datasets: [{ data: topLocs.map(l => l[1]), backgroundColor: 'rgba(255,180,100,0.7)', borderRadius: 4, borderSkipped: false }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      }
    }
  });
}

// --- DILIGENCE REPORT ---

function generateReport(a) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Diligence Report — ${a.company_name || a.first_name + ' ' + a.last_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: #fff; color: #1a1a1a; padding: 48px; max-width: 820px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
    .report-header { border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 32px; }
    .report-header__top { display: flex; justify-content: space-between; align-items: flex-start; }
    .report-brand { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #666; }
    .report-confidential { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #999; border: 1px solid #ccc; padding: 3px 10px; border-radius: 4px; }
    .report-title { margin-top: 16px; }
    .report-title h1 { font-size: 28px; letter-spacing: -0.5px; margin-bottom: 4px; }
    .report-title p { font-size: 12px; color: #666; }
    .section { margin-bottom: 28px; page-break-inside: avoid; }
    .section__title { font-family: sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #666; border-bottom: 0.5px solid #ddd; padding-bottom: 6px; margin-bottom: 14px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .field { margin-bottom: 10px; }
    .field__label { font-family: sans-serif; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 2px; }
    .field__value { font-size: 13px; color: #1a1a1a; }
    .field__value--long { font-size: 13px; color: #333; line-height: 1.65; white-space: pre-wrap; }
    .badge { display: inline-block; font-family: sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 10px; border-radius: 100px; background: #f0f0f0; color: #444; margin: 2px; }
    .highlight-box { background: #f8f8f8; border-left: 3px solid #1a1a1a; padding: 14px 18px; border-radius: 0 4px 4px 0; }
    .report-footer { margin-top: 40px; padding-top: 16px; border-top: 0.5px solid #ddd; font-family: sans-serif; font-size: 11px; color: #999; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 24px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <div class="report-header">
    <div class="report-header__top">
      <div class="report-brand">DealFlow — Investment Diligence Report</div>
      <div class="report-confidential">Confidential</div>
    </div>
    <div class="report-title">
      <h1>${a.company_name || (a.first_name + ' ' + a.last_name)}</h1>
      <p>Generated ${date} · Reviewed by ${userGroup ? userGroup.name : 'Investment Team'}</p>
    </div>
  </div>

  <div class="section">
    <div class="section__title">Executive Summary</div>
    <div class="highlight-box">
      <div class="field__value--long">${a.value_proposition || a.description || '—'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section__title">Deal Overview</div>
    <div class="grid-3">
      <div class="field"><div class="field__label">Raise Target</div><div class="field__value">${a.capital_raise_target || a.raising || '—'}</div></div>
      <div class="field"><div class="field__label">Pre-Money Val.</div><div class="field__value">${a.pre_money_valuation || '—'}</div></div>
      <div class="field"><div class="field__label">Funding Type</div><div class="field__value">${a.funding_type || '—'}</div></div>
      <div class="field"><div class="field__label">Raised to Date</div><div class="field__value">${a.capital_raised_to_date || a.committed || '—'}</div></div>
      <div class="field"><div class="field__label">Trailing Revenue</div><div class="field__value">${a.trailing_revenue || a.revenue || '—'}</div></div>
      <div class="field"><div class="field__label">Target Close</div><div class="field__value">${a.target_closing_date || '—'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section__title">Company Information</div>
    <div class="grid-2">
      <div class="field"><div class="field__label">Legal Name</div><div class="field__value">${a.company_legal_name || a.company_name || '—'}</div></div>
      <div class="field"><div class="field__label">CEO</div><div class="field__value">${a.ceo_name || '—'}</div></div>
      <div class="field"><div class="field__label">Year Founded</div><div class="field__value">${a.year_founded || '—'}</div></div>
      <div class="field"><div class="field__label">Employees</div><div class="field__value">${a.num_employees || '—'}</div></div>
      <div class="field"><div class="field__label">Industry</div><div class="field__value">${a.industry || a.sector || '—'}</div></div>
      <div class="field"><div class="field__label">Website</div><div class="field__value">${a.website ? '<a href="'+a.website+'" style="color:#1a1a1a">'+a.website+'</a>' : '—'}</div></div>
      <div class="field"><div class="field__label">Location</div><div class="field__value">${[a.city_town, a.state_region, a.country].filter(Boolean).join(', ') || a.location || '—'}</div></div>
      <div class="field"><div class="field__label">Stage</div><div class="field__value">${a.business_stage || a.stage || '—'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section__title">Product & Technology</div>
    <div class="field"><div class="field__label">Product / Service</div><div class="field__value--long">${a.description || '—'}</div></div>
    <div class="field" style="margin-top:12px"><div class="field__label">Intellectual Property</div><div class="field__value--long">${a.intellectual_property || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section__title">Market Opportunity</div>
    <div class="field"><div class="field__label">Target Market</div><div class="field__value--long">${a.target_market || '—'}</div></div>
    <div class="field" style="margin-top:12px"><div class="field__label">Customers</div><div class="field__value--long">${a.customers || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section__title">Business Model & Go-to-Market</div>
    <div class="field"><div class="field__label">Business Model</div><div class="field__value--long">${a.business_model_detail || '—'}</div></div>
    <div class="field" style="margin-top:12px"><div class="field__label">Sales & Marketing Strategy</div><div class="field__value--long">${a.sales_marketing || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section__title">Competitive Landscape</div>
    <div class="grid-2">
      <div class="field"><div class="field__label">Competitors</div><div class="field__value--long">${a.competitors || '—'}</div></div>
      <div class="field"><div class="field__label">Competitive Advantage</div><div class="field__value--long">${a.competitive_advantage || '—'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section__title">Financing Details</div>
    <div class="field"><div class="field__label">Lead Investor</div><div class="field__value">${a.lead_investor || '—'}</div></div>
    <div class="field" style="margin-top:8px"><div class="field__label">Previous Investors</div><div class="field__value--long">${a.previous_investors || a.prior_funding || '—'}</div></div>
    <div class="field" style="margin-top:8px"><div class="field__label">Terms / Conditions</div><div class="field__value--long">${a.terms_conditions || '—'}</div></div>
    <div class="field" style="margin-top:8px"><div class="field__label">Use of Proceeds</div><div class="field__value--long">${a.use_of_proceeds || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section__title">Risk Factors & Exit</div>
    <div class="grid-2">
      <div class="field"><div class="field__label">Key Risks</div><div class="field__value--long">${a.risks || '—'}</div></div>
      <div class="field"><div class="field__label">Exit Strategy</div><div class="field__value--long">${a.exit_strategy || '—'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section__title">Team</div>
    <div class="grid-2">
      <div class="field"><div class="field__label">Primary Contact</div><div class="field__value">${a.first_name} ${a.last_name} · ${a.role || '—'}</div></div>
      <div class="field"><div class="field__label">Email</div><div class="field__value">${a.email || '—'}</div></div>
      <div class="field"><div class="field__label">Phone</div><div class="field__value">${a.phone || '—'}</div></div>
      <div class="field"><div class="field__label">LinkedIn</div><div class="field__value">${a.linkedin || '—'}</div></div>
    </div>
    ${a.management_linkedin ? '<div class="field" style="margin-top:8px"><div class="field__label">Management LinkedIn</div><div class="field__value--long">'+a.management_linkedin+'</div></div>' : ''}
    ${a.referred_by ? '<div class="field" style="margin-top:8px"><div class="field__label">Referred By</div><div class="field__value">'+a.referred_by+'</div></div>' : ''}
  </div>

  <div class="section">
    <div class="section__title">Materials</div>
    <div class="grid-2">
      <div class="field"><div class="field__label">Documents Provided</div><div class="field__value">${a.required_documents || '—'}</div></div>
      <div class="field"><div class="field__label">Supporting Docs</div><div class="field__value">${a.supporting_docs_url ? '<a href="'+a.supporting_docs_url+'" style="color:#1a1a1a">View documents →</a>' : '—'}</div></div>
    </div>
    ${a.deck_url ? '<div class="field" style="margin-top:8px"><div class="field__label">Pitch Deck</div><div class="field__value"><a href="'+a.deck_url+'" style="color:#1a1a1a">View pitch deck →</a></div></div>' : ''}
  </div>

  ${a.notes ? `<div class="section">
    <div class="section__title">Investor Notes</div>
    <div class="highlight-box"><div class="field__value--long">${a.notes}</div></div>
  </div>` : ''}

  <div class="report-footer">
    <span>DealFlow — Confidential Investment Diligence Report</span>
    <span>Applied ${formatDate(a.created_at)} · Status: ${a.status || 'New'}</span>
  </div>

  <div class="no-print" style="margin-top:32px;text-align:center">
    <button onclick="window.print()" style="font-family:sans-serif;font-size:13px;padding:10px 24px;background:#1a1a1a;color:#fff;border:none;border-radius:6px;cursor:pointer">Print / Save as PDF</button>
  </div>

</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

// --- SIDEBAR NAV ---

document.querySelectorAll('.db-nav__item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const text = item.textContent.trim();

    if (text.includes('AI search')) { toggleAI(); return; }

    document.querySelectorAll('.db-nav__item').forEach(i => i.classList.remove('db-nav__item--active'));
    item.classList.add('db-nav__item--active');

    if (text.includes('Analytics')) {
      showAnalytics(); return;
    }

    hideAnalytics();

    if (text.includes('All')) {
      filteredData = [...allApplicants];
      document.querySelector('.db-topbar__left h1').textContent = 'All applicants';
    } else if (text.includes('Shortlisted')) {
      filteredData = allApplicants.filter(a => a.status === 'Shortlisted');
      document.querySelector('.db-topbar__left h1').textContent = 'Shortlisted';
    } else if (text.includes('Pending')) {
      filteredData = allApplicants.filter(a => a.status === 'New');
      document.querySelector('.db-topbar__left h1').textContent = 'Pending review';
    } else if (text.includes('Denied')) {
      filteredData = allApplicants.filter(a => a.status === 'Denied');
      document.querySelector('.db-topbar__left h1').textContent = 'Denied';
    }

    document.querySelector('.db-count').textContent = `${filteredData.length} total`;
    renderTable(filteredData);
  });
});
