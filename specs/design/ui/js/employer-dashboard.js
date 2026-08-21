/* employer-dashboard.html — company job list, stats, status changes. */

const EMPLOYER_COMPANY_ID = 'c1';
const STATUS_FILTERS = ['ทั้งหมด', 'published', 'pending_review', 'draft', 'paused', 'closed', 'expired'];

let dashState = { status: 'ทั้งหมด' };

function renderStats() {
  const jobs = Store.getEmployerJobs(EMPLOYER_COMPANY_ID);
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicants, 0);
  const published = jobs.filter((j) => j.status === 'published').length;
  const pending = jobs.filter((j) => j.status === 'pending_review').length;

  const stats = [
    { label: 'ประกาศงานทั้งหมด', value: jobs.length, icon: 'briefcase' },
    { label: 'กำลังเผยแพร่', value: published, icon: 'checkCircle' },
    { label: 'รอตรวจสอบ', value: pending, icon: 'clock' },
    { label: 'ผู้สมัครรวม', value: totalApplicants, icon: 'users' },
  ];
  document.getElementById('stat-grid').innerHTML = stats.map((s) => `
    <div class="card stat-card">
      <div class="row gap-2 text-subtle text-sm">${icon(s.icon, 'icon-sm')}${s.label}</div>
      <span class="stat-card__value">${s.value.toLocaleString('th-TH')}</span>
    </div>`).join('');
}

function renderStatusFilter() {
  const wrap = document.getElementById('status-filter');
  wrap.innerHTML = STATUS_FILTERS.map((s) => `<button type="button" class="pill-filter${s === dashState.status ? ' is-active' : ''}" data-status="${s}" aria-pressed="${s === dashState.status}">${s === 'ทั้งหมด' ? s : JOB_STATUS_LABEL[s]}</button>`).join('');
  wrap.querySelectorAll('[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dashState.status = btn.dataset.status;
      renderStatusFilter();
      renderTable();
    });
  });
}

function jobRowActions(job) {
  const actions = [];
  actions.push(`<a href="employer-applicants.html?id=${job.id}" class="btn btn-ghost btn-sm">ผู้สมัคร</a>`);
  actions.push(`<a href="employer-post-job.html?id=${job.id}" class="btn btn-ghost btn-sm">แก้ไข</a>`);
  if (job.status === 'draft') actions.push(`<button class="btn btn-secondary btn-sm" data-action="submit" data-job="${job.id}">ส่งตรวจสอบ</button>`);
  if (job.status === 'published') actions.push(`<button class="btn btn-ghost btn-sm" data-action="pause" data-job="${job.id}">พักประกาศ</button>`);
  if (job.status === 'paused') actions.push(`<button class="btn btn-secondary btn-sm" data-action="resume" data-job="${job.id}">เผยแพร่ต่อ</button>`);
  if (['published', 'paused'].includes(job.status)) actions.push(`<button class="btn btn-danger btn-sm" data-action="close" data-job="${job.id}">ปิดรับสมัคร</button>`);
  return actions.join(' ');
}

function renderTable() {
  const jobs = Store.getEmployerJobs(EMPLOYER_COMPANY_ID)
    .filter((j) => dashState.status === 'ทั้งหมด' || j.status === dashState.status)
    .sort((a, b) => new Date(b.publishedAt || '2026-01-01') - new Date(a.publishedAt || '2026-01-01'));

  const tbody = document.getElementById('jobs-tbody');
  document.getElementById('jobs-empty').hidden = jobs.length > 0;
  document.getElementById('jobs-table').style.display = jobs.length > 0 ? '' : 'none';

  tbody.innerHTML = jobs.map((job) => `
    <tr>
      <td><a href="job-detail.html?id=${job.id}" style="font-weight:600;">${job.title}</a></td>
      <td><span class="badge badge-${JOB_STATUS_TONE[job.status]}">${JOB_STATUS_LABEL[job.status]}</span></td>
      <td>${job.applicants}</td>
      <td>${job.publishedAt || '-'}</td>
      <td>${job.expiresAt || '-'}</td>
      <td><div class="row gap-2 wrap">${jobRowActions(job)}</div></td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => handleStatusAction(btn.dataset.action, btn.dataset.job));
  });
}

const ACTION_COPY = {
  submit: { next: 'pending_review', body: 'ส่งประกาศงานนี้ให้ทีมแอดมินตรวจสอบก่อนเผยแพร่ใช่หรือไม่?', toast: 'ส่งประกาศงานเพื่อตรวจสอบแล้ว' },
  pause: { next: 'paused', body: 'พักประกาศงานนี้ชั่วคราว ผู้สมัครใหม่จะไม่สามารถสมัครได้ ใช่หรือไม่?', toast: 'พักประกาศงานแล้ว' },
  resume: { next: 'published', body: 'เผยแพร่ประกาศงานนี้อีกครั้งใช่หรือไม่?', toast: 'เผยแพร่ประกาศงานอีกครั้งแล้ว' },
  close: { next: 'closed', body: 'ปิดรับสมัครประกาศงานนี้ถาวร ไม่สามารถเปิดใหม่ได้ ใช่หรือไม่?', toast: 'ปิดรับสมัครประกาศงานแล้ว' },
};

function handleStatusAction(action, jobId) {
  const copy = ACTION_COPY[action];
  const modal = document.getElementById('status-modal');
  document.getElementById('status-modal-body').textContent = copy.body;
  modal.dataset.jobId = jobId;
  modal.dataset.nextStatus = copy.next;
  modal.dataset.toast = copy.toast;
  ModalCtl.open('status-modal');
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderStatusFilter();
  renderTable();

  document.getElementById('confirm-status-btn').addEventListener('click', () => {
    const modal = document.getElementById('status-modal');
    if (modal.dataset.nextStatus === 'pending_review') Store.submitJob(modal.dataset.jobId);
    else Store.setJobStatus(modal.dataset.jobId, modal.dataset.nextStatus);
    ModalCtl.close('status-modal');
    renderStats();
    renderTable();
    Toast.show(modal.dataset.toast, 'success');
  });
});
