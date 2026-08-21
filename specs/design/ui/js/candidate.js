/* candidate-profile.html — profile form, saved jobs, applications tabs. */

let profileSkills = [...CANDIDATE_PROFILE.skills];

function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  const hash = window.location.hash.replace('#', '');
  if (['profile', 'saved', 'applications'].includes(hash)) activateTab(hash);
}
function activateTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b) => {
    const active = b.dataset.tab === name;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('is-active', p.id === 'tab-' + name));
}

function renderSkills() {
  const wrap = document.getElementById('skills-list');
  wrap.innerHTML = profileSkills.map((s, i) => `
    <span class="badge badge-primary">${s}
      <button type="button" data-remove-skill="${i}" aria-label="ลบทักษะ ${s}" style="background:none;border:none;cursor:pointer;color:inherit;display:inline-flex;padding:0;margin-left:2px;">${icon('x', 'icon-sm')}</button>
    </span>`).join('');
  wrap.querySelectorAll('[data-remove-skill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      profileSkills.splice(Number(btn.dataset.removeSkill), 1);
      renderSkills();
    });
  });
}

function renderResume(fileName, uploadedAt) {
  const status = CANDIDATE_PROFILE.resumeStatus === 'ready' ? 'พร้อมใช้งานสำหรับสมัครงาน' : 'กำลังตรวจสอบไฟล์';
  document.getElementById('resume-display').innerHTML = `
    ${icon('fileText')}
    <div style="min-width:0; flex:1;">
      <p class="text-sm" style="font-weight:600;">${fileName}</p>
      <p class="text-xs text-subtle">อัปโหลดเมื่อ ${timeAgo(uploadedAt)} · ${status}</p>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" id="remove-resume-btn">ลบ</button>`;
  const removeBtn = document.getElementById('remove-resume-btn');
  if (removeBtn) removeBtn.addEventListener('click', () => {
    CANDIDATE_PROFILE.resumeStatus = 'missing';
    CANDIDATE_PROFILE.resumeFile = '';
    document.getElementById('resume-display').innerHTML = '<p class="text-sm text-subtle">ยังไม่มีเรซูเม่ — อัปโหลดไฟล์ด้านล่าง</p>';
  });
}

function initProfileForm() {
  document.getElementById('avatar-initials').textContent = CANDIDATE_PROFILE.name.slice(0, 1);
  document.getElementById('profile-name').textContent = CANDIDATE_PROFILE.name;
  document.getElementById('profile-title').textContent = CANDIDATE_PROFILE.title;
  document.getElementById('p-name').value = CANDIDATE_PROFILE.name;
  document.getElementById('p-title').value = CANDIDATE_PROFILE.title;
  document.getElementById('p-email').value = CANDIDATE_PROFILE.email;
  document.getElementById('p-phone').value = CANDIDATE_PROFILE.phone;
  document.getElementById('p-location').value = CANDIDATE_PROFILE.location;
  document.getElementById('p-summary').value = CANDIDATE_PROFILE.summary;
  renderSkills();
  renderResume(CANDIDATE_PROFILE.resumeFile, CANDIDATE_PROFILE.resumeUploadedAt);

  const addSkill = () => {
    const input = document.getElementById('skill-input');
    const val = input.value.trim();
    if (val && !profileSkills.includes(val)) { profileSkills.push(val); renderSkills(); }
    input.value = '';
    input.focus();
  };
  document.getElementById('add-skill-btn').addEventListener('click', addSkill);
  document.getElementById('skill-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
  });

  const dropZone = document.getElementById('upload-drop');
  const fileInput = document.getElementById('resume-upload');
  ['dragenter', 'dragover'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('is-dragover'); }));
  ['dragleave', 'drop'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove('is-dragover'); }));
  dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleResumeFile(file);
  });
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleResumeFile(file);
  });
  function handleResumeFile(file) {
    const okType = /\.(pdf|doc|docx)$/i.test(file.name);
    const okSize = file.size <= 5 * 1024 * 1024;
    if (!okType) { Toast.show('รองรับเฉพาะไฟล์ PDF, DOC, DOCX', 'danger'); return; }
    if (!okSize) { Toast.show('ขนาดไฟล์ต้องไม่เกิน 5MB', 'danger'); return; }
    CANDIDATE_PROFILE.resumeFile = file.name;
    CANDIDATE_PROFILE.resumeUploadedAt = DEMO_TODAY;
    CANDIDATE_PROFILE.resumeStatus = 'scanning';
    renderResume(file.name, DEMO_TODAY);
    Toast.show('อัปโหลดแล้ว กำลังตรวจสอบไฟล์', 'default');
    setTimeout(() => {
      CANDIDATE_PROFILE.resumeStatus = 'ready';
      renderResume(file.name, DEMO_TODAY);
      Toast.show('Resume พร้อมใช้งานสำหรับสมัครงานแล้ว', 'success');
    }, 800);
  }

  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameValid = document.getElementById('p-name').value.trim().length > 0;
    const emailValid = /\S+@\S+\.\S+/.test(document.getElementById('p-email').value);
    showFieldError(document.getElementById('p-name').closest('.form-group'), !nameValid);
    showFieldError(document.getElementById('p-email').closest('.form-group'), !emailValid);
    if (!nameValid || !emailValid) return;

    const btn = document.getElementById('save-profile-btn');
    setButtonLoading(btn, true);
    setTimeout(() => {
      setButtonLoading(btn, false);
      document.getElementById('profile-name').textContent = document.getElementById('p-name').value;
      document.getElementById('profile-title').textContent = document.getElementById('p-title').value;
      Toast.show('บันทึกโปรไฟล์เรียบร้อยแล้ว', 'success');
    }, 700);
  });
}

function renderSavedJobs() {
  const jobs = Store.getSavedJobs();
  document.getElementById('saved-count').textContent = jobs.length;
  const grid = document.getElementById('saved-jobs-grid');
  grid.innerHTML = jobs.map(jobCardHTML).join('');
  document.getElementById('saved-empty').hidden = jobs.length > 0;
  bindJobCardSaveButtons(grid);
}

function applicationCardHTML(app) {
  const company = Store.getCompany(app.job.companyId);
  const idx = APP_STATUS_ORDER.indexOf(app.status);
  const timeline = app.status === 'withdrawn' || app.status === 'rejected'
    ? `<span class="badge badge-${APP_STATUS_TONE[app.status]}">${APP_STATUS_LABEL[app.status]}</span>`
    : `<div class="timeline" style="flex-direction:row; align-items:center;">${APP_STATUS_ORDER.map((s, i) => `
        <div class="row" style="align-items:center;">
          <span class="badge ${i <= idx ? 'badge-success' : 'badge-neutral'}" style="padding:4px 10px;">${i < idx ? icon('check', 'icon-sm') : ''}${APP_STATUS_LABEL[s]}</span>
          ${i < APP_STATUS_ORDER.length - 1 ? `<span style="width:16px;height:2px;background:${i < idx ? 'var(--color-success)' : 'var(--color-border)'};margin:0 4px;"></span>` : ''}
        </div>`).join('')}</div>`;

  return `
  <div class="card card-pad">
    <div class="row-between wrap gap-3" style="margin-bottom:12px;">
      <div class="row gap-3">
        <div class="job-card__logo" aria-hidden="true">${company.initials}</div>
        <div>
          <a href="job-detail.html?id=${app.job.id}" class="job-card__title">${app.job.title}</a>
          <p class="job-card__company">${company.name}</p>
        </div>
      </div>
      <div class="stack" style="align-items:flex-end; gap:4px;">
        <span class="text-xs text-subtle">สมัครเมื่อ ${timeAgo(app.appliedAt)}</span>
        ${app.status !== 'withdrawn' && app.status !== 'rejected' ? `<button class="btn btn-ghost btn-sm" data-withdraw="${app.id}">ถอนใบสมัคร</button>` : ''}
      </div>
    </div>
    <div style="overflow-x:auto; padding-bottom:4px;">${timeline}</div>
    ${app.note ? `<p class="text-sm text-muted" style="margin-top:12px; padding-top:12px; border-top:1px solid var(--color-border);"><strong>หมายเหตุจากผู้ประกอบการ:</strong> ${app.note}</p>` : ''}
  </div>`;
}

function renderApplications() {
  const apps = Store.getMyApplications();
  document.getElementById('app-count').textContent = apps.length;
  const list = document.getElementById('applications-list');
  list.innerHTML = apps.map(applicationCardHTML).join('');
  document.getElementById('applications-empty').hidden = apps.length > 0;

  list.querySelectorAll('[data-withdraw]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('withdraw-modal');
      modal.dataset.appId = btn.dataset.withdraw;
      ModalCtl.open('withdraw-modal');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initProfileForm();
  renderSavedJobs();
  renderApplications();

  document.getElementById('confirm-withdraw-btn').addEventListener('click', () => {
    const modal = document.getElementById('withdraw-modal');
    Store.withdrawApplication(modal.dataset.appId);
    ModalCtl.close('withdraw-modal');
    renderApplications();
    Toast.show('ถอนใบสมัครเรียบร้อยแล้ว', 'success');
  });
});
