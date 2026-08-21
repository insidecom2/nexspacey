/* job-detail.html — populate job detail from mock data + apply/save flows. */

function jobBadges(job) {
  const badges = [
    { tone: 'neutral', icon: 'mapPin', text: job.location },
    { tone: 'neutral', icon: 'briefcase', text: JOB_TYPE_LABEL[job.type] },
    { tone: 'primary', icon: null, text: WORK_MODEL_LABEL[job.workModel] },
    { tone: JOB_STATUS_TONE[job.status], icon: null, text: JOB_STATUS_LABEL[job.status] },
  ];
  return badges.map((b) => `<span class="badge badge-${b.tone}">${b.icon ? icon(b.icon, 'icon-sm') : ''}${b.text}</span>`).join('');
}

function renderSaveButton(job) {
  const btn = document.getElementById('save-btn');
  const saved = Store.isSaved(job.id);
  btn.innerHTML = `${icon(saved ? 'bookmarkFilled' : 'bookmark')}<span>${saved ? 'บันทึกไว้แล้ว' : 'บันทึกงานนี้'}</span>`;
  btn.setAttribute('aria-pressed', String(saved));
}

function renderApplyButton(job) {
  const btn = document.getElementById('apply-btn');
  const applied = Store.hasApplied(job.id);
  const eligibility = Store.canApply(job.id);
  if (applied) {
    btn.querySelector('.btn-label').textContent = 'ส่งใบสมัครแล้ว';
    btn.disabled = true;
  } else if (!eligibility.ok) {
    btn.querySelector('.btn-label').textContent = eligibility.reason;
    btn.disabled = true;
  } else {
    btn.querySelector('.btn-label').textContent = 'สมัครงานนี้';
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(window.location.search).get('id') || 'j1';

  setTimeout(() => {
    const job = Store.getPublicJob(id);
    document.getElementById('loading-state').hidden = true;

    if (!job) {
      document.getElementById('not-found-state').hidden = false;
      return;
    }

    const company = Store.getCompany(job.companyId);
    document.getElementById('job-detail-content').hidden = false;
    document.title = `${job.title} ที่ ${company.name} | JobJing`;
    document.getElementById('crumb-title').textContent = job.title;
    document.getElementById('logo').textContent = company.initials;
    document.getElementById('job-title').textContent = job.title;
    document.getElementById('job-company').textContent = `${company.name} · ${company.location}`;
    document.getElementById('job-badges').innerHTML = jobBadges(job);
    document.getElementById('job-description').textContent = job.description;
    document.getElementById('job-responsibilities').innerHTML = job.responsibilities.map((r) => `<li class="row gap-2" style="align-items:flex-start;">${icon('check', 'icon-sm')}<span>${r}</span></li>`).join('');
    document.getElementById('job-requirements').innerHTML = job.requirements.map((r) => `<li class="row gap-2" style="align-items:flex-start;">${icon('check', 'icon-sm')}<span>${r}</span></li>`).join('');
    document.getElementById('job-benefits').innerHTML = job.benefits.map((b) => `<span class="badge badge-primary">${b}</span>`).join('');
    document.getElementById('job-skills').innerHTML = (job.skills || []).length ? job.skills.map((skill) => `<span class="badge badge-neutral">${skill}</span>`).join('') : '<span class="text-sm text-muted">ไม่ได้ระบุทักษะ</span>';
    document.getElementById('job-salary').textContent = formatSalary(job.salaryMin, job.salaryMax);
    document.getElementById('job-posted').textContent = `ประกาศเมื่อ ${timeAgo(job.publishedAt)}`;
    document.getElementById('job-expires').textContent = `ปิดรับสมัคร ${job.expiresAt}`;
    document.getElementById('applicants-count').textContent = `มีผู้สมัครแล้ว ${job.applicants} คน`;
    document.getElementById('company-name').textContent = company.name;
    document.getElementById('company-industry').textContent = `${company.industry}${company.verified ? ' · บริษัทที่ตรวจสอบแล้ว' : ''}`;
    document.getElementById('company-about').textContent = company.about;

    renderSaveButton(job);
    renderApplyButton(job);

    document.getElementById('save-btn').addEventListener('click', () => {
      const nowSaved = Store.toggleSave(job.id);
      renderSaveButton(job);
      Toast.show(nowSaved ? 'บันทึกงานนี้แล้ว' : 'เอาออกจากงานที่บันทึกไว้แล้ว', 'success');
    });

    document.getElementById('apply-btn').addEventListener('click', () => {
      if (!Store.canApply(job.id).ok) return;
      document.getElementById('modal-job-title').textContent = job.title;
      document.getElementById('modal-company-name').textContent = company.name;
      document.getElementById('modal-resume-name').textContent = CANDIDATE_PROFILE.resumeFile;
      ModalCtl.open('apply-modal');
    });

    document.getElementById('confirm-apply-btn').addEventListener('click', (e) => {
      setButtonLoading(e.currentTarget, true);
      setTimeout(() => {
        const app = Store.applyToJob(job.id);
        setButtonLoading(e.currentTarget, false);
        if (!app) {
          ModalCtl.close('apply-modal');
          Toast.show(Store.canApply(job.id).reason, 'danger');
          return;
        }
        ModalCtl.close('apply-modal');
        renderApplyButton(job);
        document.getElementById('applicants-count').textContent = `มีผู้สมัครแล้ว ${job.applicants} คน`;
        Toast.show('ส่งใบสมัครเรียบร้อยแล้ว ติดตามสถานะได้ที่หน้าใบสมัครของฉัน', 'success');
      }, 700);
    });
  }, 400);
});
