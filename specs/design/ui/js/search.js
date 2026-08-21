/* index.html — job search & filtering against mock data. */

const CATEGORIES = ['ทั้งหมด', 'เทคโนโลยี', 'ดีไซน์', 'บริการลูกค้า', 'โลจิสติกส์', 'ค้าปลีก', 'ข้อมูล', 'การตลาด', 'กฎหมาย'];

let state = { q: '', loc: '', category: 'ทั้งหมด', type: '', workModel: '', sort: 'new' };

function applyFilters() {
  let jobs = Store.getPublishedJobs();
  if (state.q.trim()) {
    const q = state.q.trim().toLowerCase();
    jobs = jobs.filter((j) => j.title.toLowerCase().includes(q) || Store.getCompany(j.companyId).name.toLowerCase().includes(q));
  }
  if (state.loc.trim()) {
    const loc = state.loc.trim().toLowerCase();
    jobs = jobs.filter((j) => j.location.toLowerCase().includes(loc));
  }
  if (state.category !== 'ทั้งหมด') jobs = jobs.filter((j) => j.category === state.category);
  if (state.type) jobs = jobs.filter((j) => j.type === state.type);
  if (state.workModel) jobs = jobs.filter((j) => j.workModel === state.workModel);
  jobs = jobs.slice().sort((a, b) => state.sort === 'salary' ? (b.salaryMax || 0) - (a.salaryMax || 0) : new Date(b.publishedAt) - new Date(a.publishedAt));
  return jobs;
}

function renderResults() {
  const container = document.getElementById('job-results');
  const empty = document.getElementById('empty-state');
  const count = document.getElementById('result-count');
  const jobs = applyFilters();
  count.textContent = `พบ ${jobs.length.toLocaleString('th-TH')} ตำแหน่งงาน`;
  if (jobs.length === 0) {
    container.innerHTML = '';
    empty.hidden = false;
  } else {
    empty.hidden = true;
    container.innerHTML = jobs.map(jobCardHTML).join('');
  }
  bindJobCardSaveButtons(container);
}

function renderPills() {
  const wrap = document.getElementById('filter-pills');
  wrap.innerHTML = CATEGORIES.map((c) => `<button type="button" class="pill-filter${c === state.category ? ' is-active' : ''}" data-cat="${c}" aria-pressed="${c === state.category}">${c}</button>`).join('');
  wrap.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.cat;
      renderPills();
      renderResults();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('job-results');
  container.innerHTML = Array(6).fill(skeletonCardHTML()).join('');

  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) { state.q = params.get('q'); document.getElementById('q').value = state.q; }
  if (params.get('loc')) { state.loc = params.get('loc'); document.getElementById('loc').value = state.loc; }

  renderPills();
  setTimeout(renderResults, 350); // simulate network latency for skeleton state

  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = document.getElementById('q').value;
    state.loc = document.getElementById('loc').value;
    renderResults();
  });
  document.getElementById('sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderResults();
  });
  document.getElementById('job-type-filter').addEventListener('change', (e) => { state.type = e.target.value; renderResults(); });
  document.getElementById('work-model-filter').addEventListener('change', (e) => { state.workModel = e.target.value; renderResults(); });
  document.getElementById('clear-filters').addEventListener('click', () => {
    state = { q: '', loc: '', category: 'ทั้งหมด', type: '', workModel: '', sort: 'new' };
    document.getElementById('q').value = '';
    document.getElementById('loc').value = '';
    document.getElementById('sort').value = 'new';
    document.getElementById('job-type-filter').value = '';
    document.getElementById('work-model-filter').value = '';
    renderPills();
    renderResults();
  });
});
