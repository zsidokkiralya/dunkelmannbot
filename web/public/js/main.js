function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

function toggleDev() {
  const panel = document.getElementById('devPanel');
  if (panel) panel.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action], .tab[data-tab]');
  if (action) {
    if (action.dataset.action === 'mobile-menu') toggleMobileMenu();
    if (action.dataset.action === 'dev-panel') toggleDev();
    if (action.dataset.action === 'toggle-all') toggleAllFilters(action.dataset.enabled === 'true');
    if (action.dataset.tab) switchTab(action.dataset.tab);
  }
  const p = document.getElementById('devPanel');
  const b = document.getElementById('devFab');
  if (p && p.classList.contains('open') && !p.contains(e.target) && b && !b.contains(e.target)) {
    p.classList.remove('open');
  }

  const m = document.getElementById('mobileMenu');
  if (m && m.classList.contains('open') && e.target === m) {
    m.classList.remove('open');
  }
});

document.addEventListener('input', (e) => {
  if (e.target.dataset.filter === 'commands') filterCommands(e.target.value);
  if (e.target.dataset.filter === 'dashboard') filterDashboardGuilds(e.target.value);
  if (e.target.dataset.filter === 'servers') filterServers(e.target.value);
});
document.addEventListener('change', (e) => {
  if (e.target.hasAttribute('data-filter-category')) filterCategory(e.target.value);
});
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName !== 'IMG') return;
  if (img.hasAttribute('data-fallback-initials')) {
    img.style.display = 'none';
    if (img.nextElementSibling) img.nextElementSibling.style.display = 'flex';
  } else if (img.dataset.fallback && !img.dataset.retried) {
    img.dataset.retried = 'true';
    img.src = img.dataset.fallback;
  }
}, true);

function switchTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach((t) => t.classList.remove('active'));
  contents.forEach((c) => c.classList.remove('active'));

  const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const activeContent = document.getElementById(`tab-${tabId}`);

  if (activeTab) activeTab.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function filterCommands(query) {
  commandQuery = query.toLowerCase().trim();
  applyCommandFilters();
}

let commandQuery = '';
let commandCategory = 'all';
function filterCategory(catName) {
  commandCategory = catName;
  applyCommandFilters();
}

function applyCommandFilters() {
  const sections = document.querySelectorAll('.cmd-section');
  sections.forEach((sec) => {
    const catHeader = sec.querySelector('.cmd-cat span');
    const categoryMatches = commandCategory === 'all' || catHeader?.textContent.trim() === commandCategory;
    let visible = false;
    sec.querySelectorAll('.cmd-card').forEach((card) => {
      const matches = categoryMatches && (!commandQuery || card.textContent.toLowerCase().includes(commandQuery));
      card.classList.toggle('hidden', !matches);
      visible ||= matches;
    });
    sec.style.display = visible ? 'block' : 'none';
  });
}

function filterServers(query) {
  const cards = document.querySelectorAll('.admin-guild-card');
  const q = query.toLowerCase().trim();

  cards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    if (!q || text.includes(q)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function filterDashboardGuilds(query) {
  const cards = document.querySelectorAll('.guild-card');
  const q = query.toLowerCase().trim();

  cards.forEach((card) => {
    const name = card.getAttribute('data-name') || card.textContent.toLowerCase();
    if (!q || name.includes(q)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function toggleAllFilters(enableState) {
  const switches = document.querySelectorAll('.mod-switch');
  switches.forEach((sw) => {
    sw.checked = enableState;
  });
  showToast("A szűrők átállítva. A változásokhoz nyomd meg a Mentés gombot.", "info");
}
