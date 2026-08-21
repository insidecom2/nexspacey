/* Shared job-card renderer — used on index.html and candidate-profile.html (saved jobs). */

function jobCardHTML(job) {
  const company = Store.getCompany(job.companyId);
  const saved = Store.isSaved(job.id);
  return `
  <article class="job-card">
    <div class="job-card__top">
      <div class="job-card__logo" aria-hidden="true">${company.initials}</div>
      <div style="min-width:0;">
        <a href="job-detail.html?id=${job.id}" class="job-card__title" style="display:block;">${job.title}</a>
        <p class="job-card__company">${company.name}${company.verified ? ' · ' + icon('checkCircle', 'icon-sm') : ''}</p>
      </div>
      <button class="btn btn-icon btn-ghost job-card__save" data-save="${job.id}" aria-pressed="${saved}" aria-label="${saved ? 'เอาออกจากงานที่บันทึกไว้' : 'บันทึกงานนี้'}">
        ${icon(saved ? 'bookmarkFilled' : 'bookmark')}
      </button>
    </div>
    <div class="job-card__meta">
      <span>${icon('mapPin', 'icon-sm')}${job.location}</span>
      <span>${icon('briefcase', 'icon-sm')}${JOB_TYPE_LABEL[job.type]}</span>
      <span>${icon('clock', 'icon-sm')}${timeAgo(job.publishedAt)}</span>
    </div>
    <div class="job-card__tags">
      <span class="badge badge-neutral">${job.category}</span>
      <span class="badge badge-neutral">${WORK_MODEL_LABEL[job.workModel]}</span>
    </div>
    <div class="job-card__footer">
      <span class="job-card__salary">${formatSalary(job.salaryMin, job.salaryMax)}</span>
      <a href="job-detail.html?id=${job.id}" class="btn btn-secondary btn-sm">ดูรายละเอียด</a>
    </div>
  </article>`;
}

function skeletonCardHTML() {
  return `<div class="job-card"><div class="row gap-3"><div class="skeleton" style="width:48px;height:48px;border-radius:8px;"></div><div style="flex:1;"><div class="skeleton" style="height:16px;width:70%;margin-bottom:8px;"></div><div class="skeleton" style="height:13px;width:40%;"></div></div></div><div class="skeleton" style="height:13px;width:90%;"></div><div class="skeleton" style="height:36px;width:100%;"></div></div>`;
}

/* Re-bind save-toggle handlers on any container of rendered job cards. */
function bindJobCardSaveButtons(container) {
  container.querySelectorAll('[data-save]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nowSaved = Store.toggleSave(btn.dataset.save);
      btn.innerHTML = icon(nowSaved ? 'bookmarkFilled' : 'bookmark');
      btn.setAttribute('aria-pressed', String(nowSaved));
      btn.setAttribute('aria-label', nowSaved ? 'เอาออกจากงานที่บันทึกไว้' : 'บันทึกงานนี้');
      Toast.show(nowSaved ? 'บันทึกงานนี้แล้ว' : 'เอาออกจากงานที่บันทึกไว้แล้ว', 'success');
      if (btn.closest('#saved-jobs-grid') && !nowSaved) btn.closest('.job-card').remove();
      if (document.getElementById('saved-count')) document.getElementById('saved-count').textContent = Store.getSavedJobs().length;
      const grid = document.getElementById('saved-jobs-grid');
      if (grid) document.getElementById('saved-empty').hidden = grid.children.length > 0;
    });
  });
}
