/* admin-moderation.html — MVP moderation, suspension and audit only. */
function initAdminTabs() {
  const tabs = [...document.querySelectorAll('.tab-btn')];
  const activate = (btn) => {
    tabs.forEach((tab) => {
      const active = tab === btn;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      document.getElementById('tab-' + tab.dataset.tab).classList.toggle('is-active', active);
    });
  };
  tabs.forEach((btn, index) => {
    btn.addEventListener('click', () => activate(btn));
    btn.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); activate(next);
    });
  });
}

function renderAdminStats() {
  const stats = [
    { label: 'รอตรวจสอบ', value: Store.getModerationQueue().length, icon: 'clock' },
    { label: 'ประกาศที่ระงับ', value: Store.jobs.filter((j) => j.suspendedAt).length, icon: 'shield' },
    { label: 'ประกาศที่เผยแพร่อยู่', value: Store.getPublishedJobs().length, icon: 'checkCircle' },
  ];
  document.getElementById('admin-stats').innerHTML = stats.map((s) => `<div class="card stat-card"><div class="row gap-2 text-subtle text-sm">${icon(s.icon, 'icon-sm')}${s.label}</div><span class="stat-card__value">${s.value}</span></div>`).join('');
}

function pendingJobCardHTML(job) {
  const company = Store.getCompany(job.companyId);
  return `<div class="card card-pad"><div class="row-between wrap gap-3" style="margin-bottom:12px;"><div><p class="job-card__title">${job.title}</p><p class="job-card__company">${company.name}</p></div><span class="badge badge-warning">รอตรวจสอบ</span></div><p class="text-sm text-muted" style="margin-bottom:16px;">${job.description}</p><div class="row gap-2 wrap"><button class="btn btn-primary btn-sm" data-approve="${job.id}">อนุมัติและเผยแพร่</button><button class="btn btn-secondary btn-sm" data-reject="${job.id}">ส่งกลับแก้ไข</button><button class="btn btn-danger btn-sm" data-suspend="${job.id}">ระงับ</button></div></div>`;
}

function renderPending() {
  const jobs = Store.getModerationQueue();
  document.getElementById('pending-count').textContent = jobs.length;
  document.getElementById('pending-list').innerHTML = jobs.map(pendingJobCardHTML).join('');
  document.getElementById('pending-empty').hidden = jobs.length > 0;
  document.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => { Store.reviewJob(btn.dataset.approve, 'approved'); renderAll(); Toast.show('อนุมัติและเผยแพร่ประกาศแล้ว', 'success'); }));
  document.querySelectorAll('[data-reject]').forEach((btn) => { btn.addEventListener('click', () => { const modal = document.getElementById('reject-job-modal'); modal.dataset.jobId = btn.dataset.reject; ModalCtl.open('reject-job-modal'); }); });
  document.querySelectorAll('[data-suspend]').forEach((btn) => { btn.addEventListener('click', () => { const modal = document.getElementById('suspend-job-modal'); modal.dataset.jobId = btn.dataset.suspend; ModalCtl.open('suspend-job-modal'); }); });
}

function renderSuspended() {
  const jobs = Store.jobs.filter((job) => job.suspendedAt);
  document.getElementById('suspended-list').innerHTML = jobs.length ? jobs.map((job) => `<div class="card card-pad"><p class="job-card__title">${job.title}</p><p class="text-sm text-muted">${job.suspensionReason}</p></div>`).join('') : '<div class="state-block"><p class="state-block__title">ไม่มีประกาศที่ถูกระงับ</p></div>';
}

function renderAudit() {
  const logs = Store.auditLogs;
  document.getElementById('audit-list').innerHTML = logs.length ? logs.map((log) => `<div class="card card-pad"><p style="font-weight:600;">${log.action}</p><p class="text-sm text-muted">${log.reason || 'ไม่มีรายละเอียดเพิ่มเติม'} · ${log.createdAt}</p></div>`).join('') : '<div class="state-block"><p class="state-block__title">ยังไม่มี Audit activity</p></div>';
}

function renderAll() { renderAdminStats(); renderPending(); renderSuspended(); renderAudit(); }
document.addEventListener('DOMContentLoaded', () => {
  initAdminTabs(); renderAll();
  document.getElementById('confirm-reject-job-btn').addEventListener('click', () => {
    const reason = document.getElementById('reject-job-reason').value.trim();
    if (!reason) { showFieldError(document.getElementById('reject-job-group'), true); return; }
    Store.reviewJob(document.getElementById('reject-job-modal').dataset.jobId, 'rejected', reason);
    ModalCtl.close('reject-job-modal'); renderAll(); Toast.show('ส่งประกาศกลับให้แก้ไขแล้ว', 'success');
  });
  document.getElementById('confirm-suspend-job-btn').addEventListener('click', () => {
    const reason = document.getElementById('suspend-job-reason').value.trim();
    if (!reason) { showFieldError(document.getElementById('suspend-job-group'), true); return; }
    Store.suspendJob(document.getElementById('suspend-job-modal').dataset.jobId, reason);
    ModalCtl.close('suspend-job-modal'); renderAll(); Toast.show('ระงับประกาศแล้ว', 'success');
  });
});
