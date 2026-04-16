const SUPABASE_URL = 'https://fqqyguufldcvckyaqzxw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8LxqtjUExBClidRzt4tH1Q_GIqttXmr';

if (!window.supabase) throw new Error('Supabase CDN not loaded');

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentStep = 1;
const totalSteps = 4;
let selectedDeckFile = null;
let currentGroup = null;

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
}

loadGroup();

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
    if (!field.value.trim()) {
      field.style.borderColor = 'rgba(255,80,80,0.6)';
      valid = false;
    }
  });
  if (!valid) {
    const first = stepEl.querySelector('[required]:invalid, [required][style*="rgb(255"]');
    if (first) first.focus();
  }
  return valid;
}

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

document.getElementById('applyForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateStep(4)) return;

  const submitBtn = document.querySelector('[type="submit"]');
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  // Upload pitch deck if provided
  let deck_url = null;
  console.log('Deck file selected:', selectedDeckFile ? selectedDeckFile.name : 'none');
  if (selectedDeckFile) {
    const path = `${Date.now()}_${selectedDeckFile.name.replace(/\s+/g, '_')}`;
    console.log('Uploading to path:', path);
    const { data: uploadData, error: uploadError } = await db.storage
      .from('pitch-decks')
      .upload(path, selectedDeckFile);
    console.log('Upload result:', uploadData, uploadError);
    if (uploadError) {
      console.error('Upload error:', uploadError);
      submitBtn.textContent = 'Submit application →';
      submitBtn.disabled = false;
      alert('File upload failed: ' + uploadError.message + '\n\nYou can still submit without a file.');
      deck_url = null;
    } else {
      const { data: urlData } = db.storage.from('pitch-decks').getPublicUrl(path);
      deck_url = urlData.publicUrl;
      console.log('Public URL:', deck_url);
    }
  }

  const { error } = await db.from('applications').insert({
    first_name:    document.getElementById('firstName').value.trim(),
    last_name:     document.getElementById('lastName').value.trim(),
    email:         document.getElementById('email').value.trim(),
    linkedin:      document.getElementById('linkedin').value.trim(),
    role:          document.getElementById('role').value,
    location:      document.getElementById('location').value.trim(),
    company_name:  document.getElementById('companyName').value.trim(),
    website:       document.getElementById('website').value.trim(),
    sector:        document.getElementById('sector').value,
    stage:         document.getElementById('stage').value,
    description:   document.getElementById('description').value.trim(),
    problem:       document.getElementById('problem').value.trim(),
    raising:       document.getElementById('raising').value,
    committed:     document.getElementById('committed').value.trim(),
    revenue:       document.getElementById('revenue').value,
    traction:      document.getElementById('traction').value.trim(),
    prior_funding: document.getElementById('prior').value.trim(),
    why:           document.getElementById('why').value.trim(),
    anything_else: document.getElementById('anythingElse').value.trim(),
    deck_url,
    group_id: currentGroup ? currentGroup.id : null,
  });

  if (error) {
    submitBtn.textContent = 'Submit application →';
    submitBtn.disabled = false;
    alert('Something went wrong. Please try again.');
    console.error(error);
    return;
  }

  document.getElementById('step-4').style.display = 'none';
  document.getElementById('formSuccess').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelectorAll('.upload-zone').forEach(zone => {
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.style.borderColor = 'rgba(180,255,106,0.5)';
  });
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
