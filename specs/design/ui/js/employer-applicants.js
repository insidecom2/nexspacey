/* employer-applicants.html — applicant list + status management for one job. */

let applicantsFilter = 'ทั้งหมด';
let currentJobId = null;

function statusSelectHTML(applicant) {
  const options = [applicant.status, ...(APP_ALLOWED_TRANSITIONS[applicant.status] || [])];
  return `<select class="form-control" style="min-height:36px; padding:0 var(--space-3);" data-status-select="${applicant.name}" aria-label="เปลี่ยนสถานะของ ${applicant.name}">
    ${options.map((s) => `<option value="${s}" ${s === applicant.status ? 'selected' : ''}>${APP_STATUS_LABEL[s]}</option>`).join('')}
  </select>`;
}

function renderApplicantsFilter(applicants) {
  const statuses = ['ทั้งหมด', 'submitted', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected'];
  const wrap = document.getElementById('status-filter');
  wrap.innerHTML = statuses.map((s) => {
    const count = s === 'ทั้งหมด' ? applicants.length : applicants.filter((a) => a.status === s).length;
    return `<button type="button" class="pill-filter${s === applicantsFilter ? ' is-active' : ''}" data-filter="${s}" aria-pressed="${s === applicantsFilter}">${s === 'ทั้งหมด' ? s : APP_STATUS_LABEL[s]} (${count})</button>`;
  }).join('');
  wrap.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applicantsFilter = btn.dataset.filter;
      renderAll();
    });
  });
}

function renderApplicantsTable(applicants) {
  const filtered = applicantsFilter === 'ทั้งหมด' ? applicants : applicants.filter((a) => a.status === applicantsFilter);
  const tbody = document.getElementById('applicants-tbody');
  document.getElementById('applicants-empty').hidden = filtered.length > 0;

  tbody.innerHTML = filtered.map((a) => `
    <tr>
      <td>
        <div class="row gap-2" style="align-items:center;">
          <span class="avatar" aria-hidden="true">${a.name.slice(0, 1)}</span>
          <div>
            <p style="font-weight:600;">${a.name}</p>
            <p class="text-xs text-subtle">${a.email}</p>
          </div>
        </div>
      </td>
      <td>${a.experience}</td>
      <td>${timeAgo(a.appliedAt)}</td>
      <td><button class="btn btn-ghost btn-sm" data-resume="${a.resumeFile}">${icon('download', 'icon-sm')}ดาวน์โหลด</button></td>
      <td>${statusSelectHTML(a)}</td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-resume]').forEach((btn) => {
    btn.addEventListener('click', () => Toast.show(`กำลังดาวน์โหลด ${btn.dataset.resume} (ตัวอย่างสาธิต)`, 'default'));
  });
  tbody.querySelectorAll('[data-status-select]').forEach((select) => {
    select.addEventListener('change', () => {
      const name = select.dataset.statusSelect;
      if (select.value === 'rejected') {
        const modal = document.getElementById('reject-modal');
        modal.dataset.candidate = name;
        document.getElementById('reject-note').value = '';
        ModalCtl.open('reject-modal');
        // revert select until confirmed, so cancelling doesn't leave a stale "rejected" selection
        const applicant = applicants.find((a) => a.name === name);
        select.value = applicant.status;
        return;
      }
      if (!Store.updateApplicantStatus(currentJobId, name, select.value)) {
        Toast.show('เปลี่ยนสถานะนี้ไม่ได้', 'danger');
        renderAll();
        return;
      }
      renderAll();
      Toast.show(`อัปเดตสถานะของ ${name} เป็น "${APP_STATUS_LABEL[select.value]}" แล้ว`, 'success');
    });
  });
}

function renderAll() {
  const applicants = Store.getApplicantsForJob(currentJobId);
  renderApplicantsFilter(applicants);
  renderApplicantsTable(applicants);
}

document.addEventListener('DOMContentLoaded', () => {
  currentJobId = new URLSearchParams(window.location.search).get('id') || 'j1';
  const job = Store.getJob(currentJobId);
  if (job) {
    document.getElementById('job-title-heading').textContent = `ผู้สมัครตำแหน่ง ${job.title}`;
    document.title = `ผู้สมัคร - ${job.title} | JobJing`;
  }

  renderAll();
  document.getElementById('applicant-count-text').textContent = `ทั้งหมด ${Store.getApplicantsForJob(currentJobId).length} คน`;

  document.getElementById('confirm-reject-btn').addEventListener('click', () => {
    const modal = document.getElementById('reject-modal');
    const note = document.getElementById('reject-note').value.trim();
    Store.updateApplicantStatus(currentJobId, modal.dataset.candidate, 'rejected', note);
    ModalCtl.close('reject-modal');
    renderAll();
    Toast.show(`บันทึกผลไม่ผ่านการคัดเลือกของ ${modal.dataset.candidate} แล้ว`, 'success');
  });
});
