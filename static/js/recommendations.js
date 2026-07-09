/* ═══════════════════════════════════════════════════════════════════════════
   CareerCompass AI — recommendations.js
   Career paths, skill gaps, roadmap, and resume tips rendering
═══════════════════════════════════════════════════════════════════════════ */

const DEMO_ASSESSMENT = {
  career_paths: [
    { title: 'Data Scientist',            match_score: 92, description: 'Analyze complex datasets to derive actionable insights and build predictive ML models.',         avg_salary: '$110,000 – $160,000', growth_outlook: 'Very High (+36%)' },
    { title: 'Machine Learning Engineer', match_score: 87, description: 'Design and deploy ML systems at scale, bridging research and production engineering.',           avg_salary: '$120,000 – $175,000', growth_outlook: 'High (+31%)' },
    { title: 'Product Manager (Tech)',    match_score: 74, description: 'Lead cross-functional teams to define, build, and ship successful technology products.',          avg_salary: '$95,000 – $145,000',  growth_outlook: 'High (+27%)' },
    { title: 'Data Analyst',              match_score: 88, description: 'Transform raw data into clear business intelligence using SQL, Python, and visualization tools.', avg_salary: '$65,000 – $100,000',  growth_outlook: 'High (+25%)' },
    { title: 'AI/ML Researcher',          match_score: 68, description: 'Conduct cutting-edge research to advance the state-of-the-art in artificial intelligence.',       avg_salary: '$130,000 – $200,000', growth_outlook: 'Very High (+40%)' },
  ],
  skill_gaps: [
    { skill_name: 'Deep Learning (PyTorch / TensorFlow)', priority: 'High',   learning_time: '3–4 months' },
    { skill_name: 'MLOps & Model Deployment',             priority: 'High',   learning_time: '2–3 months' },
    { skill_name: 'Advanced SQL & Database Design',       priority: 'Medium', learning_time: '4–6 weeks'  },
    { skill_name: 'Cloud Platforms (AWS / GCP)',          priority: 'Medium', learning_time: '2–3 months' },
    { skill_name: 'Statistics & Probability',             priority: 'Medium', learning_time: '6–8 weeks'  },
    { skill_name: 'Communication & Data Storytelling',   priority: 'Low',    learning_time: 'Ongoing'    },
  ],
  strengths:   ['Python Programming', 'Analytical Thinking', 'Problem Solving', 'Data Visualization', 'Mathematics'],
  quick_wins: [
    'Complete the Google Data Analytics Certificate on Coursera (≈6 weeks)',
    'Build a portfolio project on Kaggle or GitHub showcasing an end-to-end ML pipeline',
    'Reach out to 3 data professionals on LinkedIn for informational interviews this week',
  ],
};

// ── ENTRY POINT ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const assessment = JSON.parse(sessionStorage.getItem('cc-assessment') || 'null');
  if (!assessment) {
    document.getElementById('noProfileAlert').classList.remove('d-none');
    document.getElementById('loadDemoBtn').addEventListener('click', () => {
      document.getElementById('noProfileAlert').classList.add('d-none');
      renderAll(DEMO_ASSESSMENT);
      showToast('Demo data loaded — complete the assessment for personalized results!', 'info');
    });
  } else {
    renderAll(assessment);
  }
});

// ── TAB SWITCH ────────────────────────────────────────────────────────────
function showTab(tabId, btn) {
  document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.add('d-none'));
  document.querySelectorAll('.cc-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.remove('d-none');
  btn.classList.add('active');
}

// ── RENDER ALL ────────────────────────────────────────────────────────────
function renderAll(data) {
  renderCareerPaths(data.career_paths || []);
  renderSkillGaps(data.skill_gaps || [], data.strengths || [], data.quick_wins || []);
}

// ── CAREER PATHS ──────────────────────────────────────────────────────────
function renderCareerPaths(paths) {
  const grid = document.getElementById('careerPathsGrid');
  if (!paths.length) { grid.innerHTML = '<p class="text-muted">No career paths returned.</p>'; return; }

  grid.innerHTML = paths.map((p, i) => {
    const score = p.match_score || 0;
    const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
    return `
      <div class="col-md-6 col-lg-4 animate-slideUp delay-${(i % 3) + 1}">
        <div class="career-path-card h-100">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="mb-0 fw-bold" style="font-size:1rem">${escHtml(p.title)}</h6>
            <svg class="match-score-ring" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" stroke-width="3"/>
              <circle cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="3"
                stroke-dasharray="${(score / 100) * 113} 113" stroke-linecap="round"
                transform="rotate(-90 22 22)"/>
              <text x="22" y="27" text-anchor="middle" font-size="9" font-weight="700" fill="${color}">${score}%</text>
            </svg>
          </div>
          <p class="text-muted mb-3" style="font-size:.85rem;line-height:1.6">${escHtml(p.description)}</p>
          <div class="d-flex flex-wrap gap-2 mt-auto">
            <span class="salary-badge"><i class="bi bi-currency-dollar me-1"></i>${escHtml(p.avg_salary)}</span>
            <span class="growth-badge"><i class="bi bi-graph-up me-1"></i>${escHtml(p.growth_outlook)}</span>
          </div>
          <div class="mt-3 d-flex gap-2">
            <button class="btn cc-btn-primary btn-sm flex-fill"
              onclick="document.getElementById('roadmapCareer').value='${escHtml(p.title)}'; showTab('roadmap', document.querySelector('[data-tab=roadmap]'))">
              <i class="bi bi-map me-1"></i>Roadmap
            </button>
            <button class="btn cc-btn-outline btn-sm flex-fill"
              onclick="document.getElementById('resumeRole').value='${escHtml(p.title)}'; showTab('resume', document.querySelector('[data-tab=resume]'))">
              <i class="bi bi-file-earmark-person me-1"></i>Resume Tips
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── SKILL GAPS ────────────────────────────────────────────────────────────
function renderSkillGaps(gaps, strengths, quickWins) {
  document.getElementById('strengthsList').innerHTML = strengths.length
    ? strengths.map(s => `<span class="badge rounded-pill" style="background:rgba(5,150,105,.12);color:#059669;font-size:.82rem;padding:.4rem .75rem">${escHtml(s)}</span>`).join('')
    : '<span class="text-muted small">Complete the assessment for your strengths.</span>';

  document.getElementById('gapCount').textContent = `${gaps.length} gap${gaps.length !== 1 ? 's' : ''} identified`;
  document.getElementById('skillGapsTable').innerHTML = gaps.map(g => {
    const p = (g.priority || 'low').toLowerCase();
    return `
      <div class="skill-gap-item priority-${p}">
        <div class="flex-fill">
          <div class="fw-semibold" style="font-size:.9rem">${escHtml(g.skill_name)}</div>
          <div class="text-muted small"><i class="bi bi-clock me-1"></i>${escHtml(g.learning_time)}</div>
        </div>
        <span class="priority-badge badge-${p}">${escHtml(g.priority)}</span>
      </div>`;
  }).join('') || '<p class="text-muted small">No skill gaps identified.</p>';

  document.getElementById('quickWinsList').innerHTML = quickWins.map((w, i) => `
    <div class="quick-win-item">
      <div class="quick-win-num">${i + 1}</div>
      <div style="font-size:.9rem">${escHtml(w)}</div>
    </div>`).join('') || '<p class="text-muted small">No quick wins available.</p>';
}

// ── ROADMAP ───────────────────────────────────────────────────────────────
async function generateRoadmap() {
  const career  = document.getElementById('roadmapCareer').value.trim();
  if (!career) { showToast('Please enter a career path.', 'warning'); return; }

  const btn     = document.getElementById('generateRoadmapBtn');
  const content = document.getElementById('roadmapContent');
  setLoading(btn, true, '<i class="bi bi-hourglass-split me-2"></i>Generating…');
  content.innerHTML = '<div class="text-center py-5"><div class="ai-loader mx-auto mb-3"></div><p class="text-muted">Building your roadmap with IBM Granite AI…</p></div>';

  try {
    const profile = JSON.parse(sessionStorage.getItem('cc-profile') || '{}');
    const data    = await apiPost('/api/roadmap', { career_path: career, profile });
    content.innerHTML = renderRoadmapHTML(data.phases || [], career);
  } catch (err) {
    content.innerHTML = `<div class="alert cc-alert-warning">Failed to generate roadmap: ${escHtml(err.message)}</div>`;
  } finally {
    setLoading(btn, false, '<i class="bi bi-map me-2"></i>Generate');
  }
}

function renderRoadmapHTML(phases, career) {
  if (!phases.length) return '<p class="text-muted">Could not parse roadmap. Please try again.</p>';
  return `
    <div class="cc-card mb-4">
      <h5 class="fw-bold mb-4"><i class="bi bi-map-fill me-2 text-primary"></i>Learning Roadmap: ${escHtml(career)}</h5>
      ${phases.map(ph => `
        <div class="roadmap-phase">
          <div class="phase-num">${ph.phase_number || '?'}</div>
          <div class="phase-card">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div class="phase-title">${escHtml(ph.phase_name || '')}</div>
              <span class="badge" style="background:var(--cc-primary-light);color:var(--cc-primary);font-size:.75rem">
                <i class="bi bi-clock me-1"></i>${escHtml(ph.duration || '')}
              </span>
            </div>
            ${ph.objectives && ph.objectives.length ? `
              <ul style="margin:.75rem 0 .5rem;padding-left:1.2rem">
                ${ph.objectives.map(o => `<li style="font-size:.87rem;color:var(--text-muted);margin-bottom:.25rem">${escHtml(o)}</li>`).join('')}
              </ul>` : ''}
            ${ph.resources && ph.resources.length ? `
              <div style="margin-top:.6rem">
                <span style="font-size:.75rem;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.08em">Resources</span><br>
                ${ph.resources.map(r => `<span class="resource-pill">${escHtml(r.name || r)}${r.platform ? ' · ' + escHtml(r.platform) : ''}</span>`).join('')}
              </div>` : ''}
            ${ph.milestone ? `<div class="milestone-badge">🏆 ${escHtml(ph.milestone)}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>`;
}

// ── RESUME TIPS ───────────────────────────────────────────────────────────
async function getResumeTips() {
  const role    = document.getElementById('resumeRole').value.trim();
  if (!role) { showToast('Please enter a target role.', 'warning'); return; }

  const btn     = document.getElementById('getResumeTipsBtn');
  const content = document.getElementById('resumeTipsContent');
  setLoading(btn, true, '<i class="bi bi-hourglass-split me-2"></i>Analyzing…');
  content.innerHTML = '<div class="text-center py-5"><div class="ai-loader mx-auto mb-3"></div><p class="text-muted">IBM Granite AI is crafting your resume tips…</p></div>';

  try {
    const profile = JSON.parse(sessionStorage.getItem('cc-profile') || '{}');
    const data    = await apiPost('/api/resume-tips', { target_role: role, profile });
    content.innerHTML = renderResumeTipsHTML(data, role);
  } catch (err) {
    content.innerHTML = `<div class="alert cc-alert-warning">Failed to get resume tips: ${escHtml(err.message)}</div>`;
  } finally {
    setLoading(btn, false, '<i class="bi bi-magic me-2"></i>Get Tips');
  }
}

function renderResumeTipsHTML(d, role) {
  const section = (title, html) => `<div class="resume-section"><div class="resume-section-title">${title}</div>${html}</div>`;
  const list    = (items) => items && items.length ? `<ul class="resume-list">${items.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>` : '<p class="text-muted small">N/A</p>';
  const chips   = (items, cls) => items && items.length ? items.map(i => `<span class="${cls}">${escHtml(i)}</span>`).join('') : '<span class="text-muted small">N/A</span>';

  return `
    <div class="cc-card">
      <h5 class="fw-bold mb-4"><i class="bi bi-file-earmark-person-fill me-2 text-danger"></i>Resume Tips for: ${escHtml(role)}</h5>
      <div class="row g-4">
        <div class="col-md-12">${section('📝 Professional Summary Tip', `<p style="font-size:.9rem;color:var(--text-muted)">${escHtml(d.summary_tip || '')}</p>`)}</div>
        <div class="col-md-6">${section('💼 Skills Section Must-Haves', list(d.skills_section))}</div>
        <div class="col-md-6">${section('⚠️ Common Mistakes to Avoid', list(d.common_mistakes))}</div>
        <div class="col-md-12">${section('✅ Strong Experience Bullet Examples', list(d.experience_bullets))}</div>
        <div class="col-md-6">${section('🔑 ATS Keywords', `<div>${chips(d.keywords, 'keyword-chip')}</div>`)}</div>
        <div class="col-md-6">${section('⚡ Power Words', `<div>${chips(d.power_words, 'power-word')}</div>`)}</div>
      </div>
    </div>`;
}

// ── UTILITIES ─────────────────────────────────────────────────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setLoading(btn, loading, label) {
  btn.disabled  = loading;
  btn.innerHTML = label;
}
