// dashboard.js — Investor dashboard interactions

const APPLICANTS = [
  { id:1, first:'Jamie', last:'Martinez', company:'GreenLoop', sector:'Climate Tech', stage:'Pre-seed', raising:'$500k–$1M', location:'Austin, TX', status:'New', applied:'Apr 14, 2026', email:'jamie@greenloop.io', linkedin:'linkedin.com/in/jamiemartinez', revenue:'Pre-revenue', committed:'$50,000', description:'GreenLoop builds software that connects businesses to carbon offset markets in real time.', traction:'800 waitlist signups, 3 pilot contracts signed.' },
  { id:2, first:'Anika', last:'Liu', company:'SolarGrid AI', sector:'Climate Tech', stage:'Seed', raising:'$1M–$2M', location:'San Francisco, CA', status:'Reviewed', applied:'Apr 12, 2026', email:'anika@solargrid.ai', linkedin:'linkedin.com/in/anikaliu', revenue:'$10k–$50k', committed:'$400,000', description:'SolarGrid AI optimizes distributed solar panel networks using machine learning.', traction:'$22k MRR, 14 paying customers, YC alumni.' },
  { id:3, first:'Ray', last:'Patel', company:'AgroSense', sector:'AI / ML', stage:'Seed', raising:'$1M–$2M', location:'Denver, CO', status:'Shortlisted', applied:'Apr 11, 2026', email:'ray@agrosense.io', linkedin:'linkedin.com/in/raypatel', revenue:'$50k–$100k', committed:'$650,000', description:'AgroSense uses computer vision to detect crop disease before it spreads.', traction:'$68k MRR, deployed in 3 states, Series A prep.' },
  { id:4, first:'Priya', last:'Nair', company:'HealthBridge', sector:'Health Tech', stage:'Pre-seed', raising:'$250k–$500k', location:'Nashville, TN', status:'New', applied:'Apr 10, 2026', email:'priya@healthbridge.co', linkedin:'linkedin.com/in/priyanair', revenue:'Pre-revenue', committed:'$0', description:'HealthBridge connects rural patients to telehealth specialists via SMS.', traction:'Pilot with 2 rural clinics, 200 patient sessions.' },
  { id:5, first:'Marcus', last:'Chen', company:'PayStack Pro', sector:'Fintech', stage:'Series A', raising:'$5M+', location:'New York, NY', status:'Reviewed', applied:'Apr 9, 2026', email:'marcus@paystackpro.com', linkedin:'linkedin.com/in/marcuschen', revenue:'$100k+', committed:'$2,500,000', description:'PayStack Pro is embedded B2B payments infrastructure for mid-market companies.', traction:'$180k MRR, 3 enterprise contracts, prior seed from a16z.' },
  { id:6, first:'Sofia', last:'Rodriguez', company:'LearnFlow', sector:'B2B SaaS', stage:'Pre-seed', raising:'$500k–$1M', location:'Miami, FL', status:'New', applied:'Apr 9, 2026', email:'sofia@learnflow.io', linkedin:'linkedin.com/in/sofiarodriguez', revenue:'Pre-revenue', committed:'$75,000', description:'LearnFlow is an AI-powered onboarding platform for enterprise software teams.', traction:'12 design partners, 3 LOIs signed, beta launching May 2026.' },
  { id:7, first:'Tariq', last:'Hassan', company:'MediSync', sector:'Health Tech', stage:'Seed', raising:'$1M–$2M', location:'Boston, MA', status:'Shortlisted', applied:'Apr 8, 2026', email:'tariq@medisync.health', linkedin:'linkedin.com/in/tariqhassan', revenue:'$10k–$50k', committed:'$500,000', description:'MediSync automates prior authorization for outpatient clinics, cutting approval time from 5 days to 4 hours.', traction:'$18k MRR, 8 clinics, partnerships with 2 insurance networks.' },
  { id:8, first:'Elena', last:'Kowalski', company:'DataVault', sector:'B2B SaaS', stage:'Pre-seed', raising:'$500k–$1M', location:'Chicago, IL', status:'Passed', applied:'Apr 7, 2026', email:'elena@datavault.io', linkedin:'linkedin.com/in/elenakowalski', revenue:'Pre-revenue', committed:'$20,000', description:'DataVault is a zero-trust data sharing platform for regulated industries.', traction:'MVP complete, no paying customers yet.' },
  { id:9, first:'James', last:'Okafor', company:'NovaDrive', sector:'Deep Tech / Hardware', stage:'Pre-seed', raising:'$250k–$500k', location:'Detroit, MI', status:'New', applied:'Apr 6, 2026', email:'james@novadrive.io', linkedin:'linkedin.com/in/jamesokafor', revenue:'Pre-revenue', committed:'$0', description:'NovaDrive builds modular electric vehicle charging hardware for apartment buildings.', traction:'Patent filed, prototype built, LOI from 2 property managers.' },
  { id:10, first:'Yuki', last:'Tanaka', company:'BrandSense', sector:'AI / ML', stage:'Seed', raising:'$1M–$2M', location:'Los Angeles, CA', status:'Reviewed', applied:'Apr 5, 2026', email:'yuki@brandsense.ai', linkedin:'linkedin.com/in/yukitanaka', revenue:'$10k–$50k', committed:'$300,000', description:'BrandSense uses AI to track and analyze brand sentiment across social and earned media.', traction:'$14k MRR, 20 paying brands, 94% retention.' },
];

const AVATAR_COLORS = [
  ['#1a3a1a','#B4FF6A'],['#1a2a3a','#7ab8f5'],['#2a1a3a','#c9a6ff'],
  ['#2a1a1a','#f5a07a'],['#1a2a2a','#80e0d0'],['#2a2a1a','#f0d060'],
  ['#1a1a2a','#a0b0ff'],['#2a1a2a','#ff90c0'],['#1a2a1a','#90e090'],['#2a1a1a','#ffb060'],
];

function initials(first, last) {
  return (first[0] + last[0]).toUpperCase();
}

let filteredData = [...APPLICANTS];

function renderTable(data) {
  const tbody = document.getElementById('applicantBody');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-dim)">No applicants match your search.</td></tr>`;
    return;
  }

  data.forEach((a, i) => {
    const [bg, color] = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const statusClass = {
      'New': 'badge--new',
      'Reviewed': 'badge--reviewed',
      'Shortlisted': 'badge--shortlisted',
      'Passed': 'badge--passed',
    }[a.status] || 'badge--new';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="db-founder">
          <div class="db-avatar" style="background:${bg};color:${color}">${initials(a.first, a.last)}</div>
          <span class="db-founder-name">${a.first} ${a.last}</span>
        </div>
      </td>
      <td style="color:var(--text-muted)">${a.company}</td>
      <td style="color:var(--text-muted)">${a.sector}</td>
      <td style="color:var(--text-muted)">${a.stage}</td>
      <td style="color:var(--text-muted)">${a.raising}</td>
      <td style="color:var(--text-dim)">${a.location}</td>
      <td><span class="db-badge ${statusClass}">${a.status}</span></td>
      <td style="color:var(--text-dim);white-space:nowrap">${a.applied}</td>
    `;
    tr.addEventListener('click', () => openDrawer(a, bg, color));
    tbody.appendChild(tr);
  });
}

// Search
document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  filteredData = APPLICANTS.filter(a =>
    `${a.first} ${a.last} ${a.company} ${a.sector} ${a.stage} ${a.location} ${a.status}`.toLowerCase().includes(q)
  );
  renderTable(filteredData);
});

// Filters
function filterApplicants() {
  const selects = document.querySelectorAll('.db-filters select');
  const [sector, stage, status] = [...selects].map(s => s.value);
  filteredData = APPLICANTS.filter(a => {
    return (!sector || a.sector === sector) &&
           (!stage || a.stage === stage) &&
           (!status || a.status === status);
  });
  renderTable(filteredData);
}

function toggleFilters() {
  const bar = document.getElementById('filterBar');
  bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
}

// AI Panel
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
    let matches = APPLICANTS.filter(a => {
      const blob = `${a.sector} ${a.stage} ${a.location} ${a.description} ${a.traction} ${a.status}`.toLowerCase();
      const words = q.replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
      return words.some(w => blob.includes(w));
    });

    if (matches.length === 0) {
      result.textContent = 'No applicants closely matched that query. Try adjusting your search.';
      return;
    }

    result.innerHTML = `
      <strong style="color:var(--accent);font-size:12px;">✦ AI result</strong><br><br>
      Found <strong>${matches.length}</strong> applicant${matches.length !== 1 ? 's' : ''} matching your query:<br><br>
      ${matches.slice(0, 5).map(a => `<span style="color:var(--text)">→ ${a.first} ${a.last}</span> — ${a.company} (${a.sector}, ${a.stage}, ${a.location})`).join('<br>')}
      ${matches.length > 5 ? `<br><span style="color:var(--text-dim)">...and ${matches.length - 5} more</span>` : ''}
    `;

    renderTable(matches);
  }, 800);
}

document.getElementById('aiInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') runAIQuery();
});

// Drawer
function openDrawer(a, bg, color) {
  const [drawerBg, drawerColor] = [bg, color];

  document.getElementById('drawerAvatar').style.background = drawerBg;
  document.getElementById('drawerAvatar').style.color = drawerColor;
  document.getElementById('drawerAvatar').textContent = initials(a.first, a.last);
  document.getElementById('drawerName').textContent = `${a.first} ${a.last}`;
  document.getElementById('drawerCompany').textContent = `${a.company} · ${a.stage}`;

  const statusMap = {
    'New': ['active-green', 'New'],
    'Reviewed': ['active-blue', 'Reviewed'],
    'Shortlisted': ['active-purple', 'Shortlisted'],
    'Passed': ['active-gray', 'Passed'],
  };

  document.getElementById('drawerBody').innerHTML = `
    <div class="drawer-section">
      <div class="drawer-section-title">Status</div>
      <div class="drawer-status-row">
        <button class="status-btn ${a.status === 'New' ? 'active-green' : ''}" onclick="setStatus(this, 'New')">New</button>
        <button class="status-btn ${a.status === 'Reviewed' ? 'active-blue' : ''}" onclick="setStatus(this, 'Reviewed')">Reviewed</button>
        <button class="status-btn ${a.status === 'Shortlisted' ? 'active-purple' : ''}" onclick="setStatus(this, 'Shortlisted')">Shortlisted</button>
        <button class="status-btn ${a.status === 'Passed' ? 'active-gray' : ''}" onclick="setStatus(this, 'Passed')">Passed</button>
      </div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Company</div>
      <div class="drawer-field"><span class="drawer-field__label">Company</span><span class="drawer-field__value">${a.company}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Sector</span><span class="drawer-field__value">${a.sector}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Stage</span><span class="drawer-field__value">${a.stage}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Location</span><span class="drawer-field__value">${a.location}</span></div>
      <div class="drawer-field" style="flex-direction:column;gap:6px"><span class="drawer-field__label">Description</span><span class="drawer-field__value" style="text-align:left;line-height:1.6">${a.description}</span></div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Fundraising</div>
      <div class="drawer-field"><span class="drawer-field__label">Raising</span><span class="drawer-field__value">${a.raising}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Committed</span><span class="drawer-field__value">${a.committed}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Revenue (MRR)</span><span class="drawer-field__value">${a.revenue}</span></div>
      <div class="drawer-field" style="flex-direction:column;gap:6px"><span class="drawer-field__label">Traction</span><span class="drawer-field__value" style="text-align:left;line-height:1.6">${a.traction}</span></div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Contact</div>
      <div class="drawer-field"><span class="drawer-field__label">Email</span><span class="drawer-field__value" style="color:var(--blue)">${a.email}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">LinkedIn</span><span class="drawer-field__value" style="color:var(--blue)">${a.linkedin}</span></div>
      <div class="drawer-field"><span class="drawer-field__label">Applied</span><span class="drawer-field__value">${a.applied}</span></div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Team notes</div>
      <textarea class="drawer-notes" placeholder="Add notes about this applicant..."></textarea>
    </div>
  `;

  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

function setStatus(btn, status) {
  btn.closest('.drawer-status-row').querySelectorAll('.status-btn').forEach(b => {
    b.className = 'status-btn';
  });
  const classMap = { 'New':'active-green', 'Reviewed':'active-blue', 'Shortlisted':'active-purple', 'Passed':'active-gray' };
  btn.classList.add(classMap[status]);
}

// Init
renderTable(APPLICANTS);
