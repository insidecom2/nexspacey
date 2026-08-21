/* employer-post-job.html — create/edit job form against mock Store. */

const EMPLOYER_COMPANY_ID = 'c1';
const JOB_CATEGORIES = ['เทคโนโลยี', 'ดีไซน์', 'บริการลูกค้า', 'โลจิสติกส์', 'ค้าปลีก', 'ข้อมูล', 'การตลาด', 'กฎหมาย'];
const linesToList = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const listToLines = (list) => (list || []).join('\n');

function populateCategorySelect() {
  document.getElementById('j-category').innerHTML = JOB_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('');
}

function fillFormFromJob(job) {
  document.getElementById('j-title').value = job.title;
  document.getElementById('j-category').value = job.category;
  document.getElementById('j-type').value = job.type;
  document.getElementById('j-workmodel').value = job.workModel;
  document.getElementById('j-location').value = job.location;
  document.getElementById('j-salary-min').value = job.salaryMin;
  document.getElementById('j-salary-max').value = job.salaryMax;
  document.getElementById('j-skills').value = (job.skills || []).join(', ');
  document.getElementById('j-expires-at').value = job.expiresAt || '';
  document.getElementById('j-description').value = job.description;
  document.getElementById('j-responsibilities').value = listToLines(job.responsibilities);
  document.getElementById('j-requirements').value = listToLines(job.requirements);
  document.getElementById('j-benefits').value = listToLines(job.benefits);
}

function validateForm() {
  let valid = true;
  const req = (id, extraCheck) => {
    const el = document.getElementById(id);
    const ok = el.value.trim().length > 0 && (extraCheck ? extraCheck(el.value) : true);
    showFieldError(el.closest('.form-group'), !ok);
    valid = valid && ok;
  };
  req('j-title');
  req('j-location');
  req('j-description');
  req('j-expires-at');

  const minText = document.getElementById('j-salary-min').value.trim();
  const maxText = document.getElementById('j-salary-max').value.trim();
  const min = Number(minText);
  const max = Number(maxText);
  const maxOk = (!minText && !maxText) || (minText && maxText && min >= 0 && max >= min);
  showFieldError(document.getElementById('j-salary-max').closest('.form-group'), !maxOk);
  valid = valid && maxOk;

  return valid;
}

function collectFormData() {
  return {
    title: document.getElementById('j-title').value.trim(),
    category: document.getElementById('j-category').value,
    type: document.getElementById('j-type').value,
    workModel: document.getElementById('j-workmodel').value,
    location: document.getElementById('j-location').value.trim(),
    salaryMin: document.getElementById('j-salary-min').value.trim() ? Number(document.getElementById('j-salary-min').value) : null,
    salaryMax: document.getElementById('j-salary-max').value.trim() ? Number(document.getElementById('j-salary-max').value) : null,
    salaryCurrency: 'THB',
    skills: document.getElementById('j-skills').value.split(',').map((skill) => skill.trim()).filter(Boolean),
    expiresAt: document.getElementById('j-expires-at').value,
    description: document.getElementById('j-description').value.trim(),
    responsibilities: linesToList(document.getElementById('j-responsibilities').value),
    requirements: linesToList(document.getElementById('j-requirements').value),
    benefits: linesToList(document.getElementById('j-benefits').value),
  };
}

document.addEventListener('DOMContentLoaded', () => {
  populateCategorySelect();
  document.getElementById('j-category').value = JOB_CATEGORIES[0];

  const editId = new URLSearchParams(window.location.search).get('id');
  const editingJob = editId ? Store.getJob(editId) : null;
  if (editingJob) {
    document.getElementById('page-heading').textContent = 'แก้ไขประกาศงาน';
    fillFormFromJob(editingJob);
  }

  document.getElementById('job-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const clickedMode = e.submitter ? e.submitter.dataset.mode : 'pending_review';
    if (!validateForm()) {
      const firstError = document.querySelector('.has-error .form-control');
      if (firstError) firstError.focus();
      return;
    }
    const btn = document.getElementById(clickedMode === 'draft' ? 'save-draft-btn' : 'submit-review-btn');
    setButtonLoading(btn, true);

    setTimeout(() => {
      const data = collectFormData();
      data.status = clickedMode;
      data.companyId = EMPLOYER_COMPANY_ID;
      if (editingJob) {
        Store.updateJob(editingJob.id, data);
      } else {
        Store.createJob(data);
      }
      setButtonLoading(btn, false);
      Toast.show(clickedMode === 'draft' ? 'บันทึกฉบับร่างเรียบร้อยแล้ว' : 'ส่งประกาศงานเพื่อตรวจสอบเรียบร้อยแล้ว', 'success');
      setTimeout(() => { window.location.href = 'employer-dashboard.html'; }, 600);
    }, 700);
  });
});
