/* ═══════════════════════════════════════════════════════════════════════════
   CareerCompass AI — assessment.js
   Multi-step form with validation and AI assessment call
═══════════════════════════════════════════════════════════════════════════ */

let currentStep = 1;
const TOTAL_STEPS = 3;
const STEP_LABELS = [
  'Step 1 of 3 — Personal Info',
  'Step 2 of 3 — Skills & Interests',
  'Step 3 of 3 — Career Goals',
];
const STEP_PCTS = ['33%', '66%', '100%'];

const LOADING_MSGS = [
  '🔍 Analyzing your education and experience…',
  '🧠 IBM Granite AI is processing your skills…',
  '📊 Identifying career matches…',
  '🗺️ Building your learning roadmap…',
  '✅ Finalizing personalized recommendations…',
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('assessmentForm').addEventListener('submit', handleSubmit);
});

// ── STEP NAVIGATION ────────────────────────────────────────────────────────
function nextStep(target) {
  if (target > currentStep && !validateStep(currentStep)) return;
  document.getElementById(`step${currentStep}`).classList.add('d-none');
  document.getElementById(`step${target}`).classList.remove('d-none');
  currentStep = target;
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
  const container = document.getElementById(`step${step}`);
  const required  = container.querySelectorAll('[required]');
  let valid = true;
  required.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      valid = false;
      field.addEventListener('input', () => field.classList.remove('is-invalid'), { once: true });
    }
  });
  if (!valid) showToast('Please fill in all required fields.', 'warning');
  return valid;
}

function updateProgress() {
  document.getElementById('progressBar').style.width = STEP_PCTS[currentStep - 1];
  document.getElementById('stepLabel').textContent   = STEP_LABELS[currentStep - 1];
  document.getElementById('stepPct').textContent     = STEP_PCTS[currentStep - 1];
}

// ── FORM SUBMIT ────────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();
  if (!validateStep(3)) return;

  const profile = collectFormData();
  sessionStorage.setItem('cc-profile', JSON.stringify(profile));

  const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
  modal.show();
  startLoadingMessages();

  try {
    const result = await apiPost('/api/assess', profile);
    sessionStorage.setItem('cc-assessment', JSON.stringify(result));
    window.location.href = '/recommendations';
  } catch (err) {
    modal.hide();
    showToast('Assessment failed: ' + err.message, 'error');
    console.error('Assessment error:', err);
  }
}

function collectFormData() {
  const fields = ['name','experience','education','field_of_study','skills',
    'interests','strengths','work_style','salary_expectation','career_goal',
    'industry','timeline','extra_info'];
  const data = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) data[f] = el.value.trim();
  });
  return data;
}

// ── ANIMATED LOADING MESSAGES ──────────────────────────────────────────────
function startLoadingMessages() {
  const el      = document.getElementById('loadingMsg');
  const stepsEl = document.getElementById('loadingSteps');
  let i = 0;
  stepsEl.innerHTML = '';

  function next() {
    if (i < LOADING_MSGS.length) {
      if (el) el.textContent = LOADING_MSGS[i].replace(/^\S+ /, '');
      const dot = document.createElement('div');
      dot.style.cssText = 'font-size:.82rem;color:var(--text-muted);padding:.2rem 0;animation:fadeInUp .3s ease;';
      dot.innerHTML = `<span style="color:var(--cc-success)">✓</span> ${LOADING_MSGS[i]}`;
      stepsEl.appendChild(dot);
      i++;
      setTimeout(next, 1200);
    }
  }
  next();
}
