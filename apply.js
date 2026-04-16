// apply.js — Multi-step form logic

let currentStep = 1;
const totalSteps = 4;

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
    zone.classList.add('has-file');
    zone.querySelector('p').textContent = `✓ ${file.name}`;
    zone.querySelector('span').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  }
}

// Form submission
document.getElementById('applyForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateStep(4)) return;

  // Show success
  document.getElementById('step-4').style.display = 'none';
  document.getElementById('formSuccess').style.display = 'block';

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Drag and drop for upload zones
document.querySelectorAll('.upload-zone').forEach(zone => {
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.style.borderColor = 'rgba(180,255,106,0.5)';
  });
  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = '';
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      zone.classList.add('has-file');
      zone.querySelector('p').textContent = `✓ ${file.name}`;
      zone.querySelector('span').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    }
  });
});
