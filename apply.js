const SUPABASE_URL = 'https://fqqyguufldcvckyaqzxw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8LxqtjUExBClidRzt4tH1Q_GIqttXmr';

if (!window.supabase) throw new Error('Supabase CDN not loaded');
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentStep = 1;
const totalSteps = 5;
let selectedDeckFile = null;
let currentGroup = null;

// --- GROUP LOAD ---

async function loadGroup() {
  const slug = new URLSearchParams(window.location.search).get('g');
  if (!slug) {
    document.getElementById('groupName').textContent = 'this group';
    document.getElementById('groupDesc').textContent = 'Invalid apply link — no group specified.';
    document.querySelector('[type="submit"]').disabled = true;
    return;
  }
  const { data, error } = await db.from('groups').select('*').eq('slug', slug).single();
  if (error || !data) {
    document.getElementById('groupName').textContent = 'Unknown Group';
    document.getElementById('groupDesc').textContent = 'This apply link is invalid or expired.';
    document.querySelector('[type="submit"]').disabled = true;
    return;
  }
  currentGroup = data;
  document.getElementById('groupName').textContent = data.name;
  document.getElementById('groupDesc').textContent = data.description;
  document.getElementById('groupPrivacyNote').textContent = `Your data is only visible to ${data.name} investors.`;
  document.getElementById('successGroupName').textContent = data.name;
}

loadGroup();

// --- NAVIGATION ---

function nextStep(step) {
  if (!validateStep(step)) return;
  document.getElementById(`step-${step}`).classList.remove('active');
  document.getElementById(`step-${step + 1}`).classList.add('active');
  updateSteps(step + 1);
  currentStep = step + 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
  document.getElementById(`step-${step}`).classList.remove('active');
  document.getElementById(`step-${step - 1}`).classList.add('active');
  updateSteps(step - 1);
  currentStep = step - 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSteps(active) {
  document.querySelectorAll('.apply-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('apply-step--active', 'apply-step--done');
    if (s === active) el.classList.add('apply-step--active');
    if (s < active) el.classList.add('apply-step--done');
  });
}

function validateStep(step) {
  const stepEl = document.getElementById(`step-${step}`);
  const required = stepEl.querySelectorAll('[required]');
  let valid = true;
  required.forEach(field => {
    field.style.borderColor = '';
    if (field.type === 'checkbox') return; // handled separately
    if (!field.value.trim()) {
      field.style.borderColor = 'rgba(255,80,80,0.6)';
      valid = false;
    }
  });
  // validate checkbox groups on step 3
  if (step === 3) {
    const stageChecked = stepEl.querySelectorAll('#businessStageGroup input:checked');
    if (stageChecked.length === 0) {
      document.getElementById('businessStageGroup').style.outline = '1px solid rgba(255,80,80,0.6)';
      valid = false;
    } else {
      document.getElementById('businessStageGroup').style.outline = '';
    }
  }
  // validate consent on step 5
  if (step === 5) {
    const consent = document.getElementById('consent');
    if (!consent.checked) {
      consent.style.outline = '2px solid rgba(255,80,80,0.6)';
      valid = false;
    } else {
      consent.style.outline = '';
    }
  }
  return valid;
}

function getCheckedValues(groupId) {
  const checked = document.querySelectorAll(`#${groupId} input:checked`);
  return Array.from(checked).map(c => c.value).join(', ');
}

// --- FILE UPLOAD ---

function handleFileSelect(input, zoneId) {
  const zone = document.getElementById(zoneId);
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (zoneId === 'deckZone') selectedDeckFile = file;
    zone.classList.add('has-file');
    zone.querySelector('p').textContent = `✓ ${file.name}`;
    zone.querySelector('span').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  }
}

document.querySelectorAll('.upload-zone').forEach(zone => {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'rgba(180,255,106,0.5)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      if (zone.id === 'deckZone') selectedDeckFile = file;
      zone.classList.add('has-file');
      zone.querySelector('p').textContent = `✓ ${file.name}`;
      zone.querySelector('span').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    }
  });
});

// --- SUBMIT ---

document.getElementById('applyForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateStep(5)) return;
  if (!currentGroup) { alert('Group not loaded — please refresh and try again.'); return; }

  const submitBtn = document.querySelector('[type="submit"]');
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  // Upload pitch deck
  let deck_url = null;
  if (selectedDeckFile) {
    const path = `${Date.now()}_${selectedDeckFile.name.replace(/\s+/g, '_')}`;
    const { data: uploadData, error: uploadError } = await db.storage.from('pitch-decks').upload(path, selectedDeckFile);
    if (!uploadError) {
      const { data: urlData } = db.storage.from('pitch-decks').getPublicUrl(path);
      deck_url = urlData.publicUrl;
    }
  }

  const { error } = await db.from('applications').insert({
    // Contact
    first_name:            document.getElementById('firstName').value.trim(),
    last_name:             document.getElementById('lastName').value.trim(),
    email:                 document.getElementById('email').value.trim(),
    phone:                 document.getElementById('phone').value.trim(),
    role:                  document.getElementById('role').value,
    location:              document.getElementById('location').value.trim(),
    linkedin:              document.getElementById('linkedin').value.trim(),
    referred_by:           document.getElementById('referredBy').value.trim(),
    // Company
    company_name:          document.getElementById('companyLegalName').value.trim(),
    company_legal_name:    document.getElementById('companyLegalName').value.trim(),
    ceo_name:              document.getElementById('ceoName').value.trim(),
    year_founded:          document.getElementById('yearFounded').value.trim(),
    num_employees:         document.getElementById('numEmployees').value.trim(),
    industry:              document.getElementById('industry').value,
    sector:                document.getElementById('industry').value,
    website:               document.getElementById('website').value.trim(),
    street_address:        document.getElementById('streetAddress').value.trim(),
    city_town:             document.getElementById('cityTown').value.trim(),
    state_region:          document.getElementById('stateRegion').value.trim(),
    zip_code:              document.getElementById('zipCode').value.trim(),
    country:               document.getElementById('country').value,
    // Business
    business_stage:        getCheckedValues('businessStageGroup'),
    stage:                 getCheckedValues('businessStageGroup'),
    value_proposition:     document.getElementById('valueProposition').value.trim(),
    description:           document.getElementById('productDescription').value.trim(),
    target_market:         document.getElementById('targetMarket').value.trim(),
    business_model_detail: document.getElementById('businessModelDetail').value.trim(),
    customers:             document.getElementById('customers').value.trim(),
    sales_marketing:       document.getElementById('salesMarketing').value.trim(),
    intellectual_property: document.getElementById('intellectualProperty').value.trim(),
    competitors:           document.getElementById('competitors').value.trim(),
    competitive_advantage: document.getElementById('competitiveAdvantage').value.trim(),
    exit_strategy:         document.getElementById('exitStrategy').value.trim(),
    risks:                 document.getElementById('risks').value.trim(),
    // Financing
    capital_raise_target:  document.getElementById('capitalRaiseTarget').value.trim(),
    raising:               document.getElementById('capitalRaiseTarget').value.trim(),
    pre_money_valuation:   document.getElementById('preMoneyValuation').value.trim(),
    funding_type:          document.getElementById('fundingType').value,
    target_closing_date:   document.getElementById('targetClosingDate').value.trim(),
    capital_raised_to_date:document.getElementById('capitalRaisedToDate').value.trim(),
    committed:             document.getElementById('capitalRaisedToDate').value.trim(),
    trailing_revenue:      document.getElementById('trailingRevenue').value.trim(),
    revenue:               document.getElementById('trailingRevenue').value.trim(),
    lead_investor:         document.getElementById('leadInvestor').value.trim(),
    previous_investors:    document.getElementById('previousInvestors').value.trim(),
    prior_funding:         document.getElementById('previousInvestors').value.trim(),
    terms_conditions:      document.getElementById('termsConditions').value.trim(),
    use_of_proceeds:       document.getElementById('useOfProceeds').value.trim(),
    // Documents
    required_documents:    getCheckedValues('requiredDocsGroup'),
    supporting_docs_url:   document.getElementById('supportingDocsUrl').value.trim(),
    management_linkedin:   document.getElementById('managementLinkedin').value.trim(),
    anything_else:         document.getElementById('anythingElse').value.trim(),
    deck_url,
    group_id: currentGroup.id,
  });

  if (error) {
    submitBtn.textContent = 'Submit application →';
    submitBtn.disabled = false;
    alert('Something went wrong. Please try again.');
    console.error(error);
    return;
  }

  // Confirmation email
  fetch('/api/confirm-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: document.getElementById('email').value.trim(),
      founderName: document.getElementById('firstName').value.trim(),
      groupName: currentGroup.name
    })
  }).catch(() => {});

  document.getElementById('step-5').style.display = 'none';
  document.getElementById('formSuccess').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
