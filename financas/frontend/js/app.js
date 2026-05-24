/* ============================================================
   app.js — Utilitários globais: toast, modal, formatação
   ============================================================ */

const App = (() => {

  /* ── Categorias ─────────────────────────────────────────── */
  const CATEGORIES = {
    salario:      { label: 'Salário',      icon: '💼', type: 'income'  },
    freelance:    { label: 'Freelance',    icon: '💻', type: 'income'  },
    investimento: { label: 'Investimento', icon: '📈', type: 'income'  },
    outros_r:     { label: 'Outros',       icon: '💰', type: 'income'  },
    alimentacao:  { label: 'Alimentação',  icon: '🍽️', type: 'expense' },
    transporte:   { label: 'Transporte',   icon: '🚗', type: 'expense' },
    moradia:      { label: 'Moradia',      icon: '🏠', type: 'expense' },
    saude:        { label: 'Saúde',        icon: '🏥', type: 'expense' },
    educacao:     { label: 'Educação',     icon: '📚', type: 'expense' },
    lazer:        { label: 'Lazer',        icon: '🎮', type: 'expense' },
    roupas:       { label: 'Roupas',       icon: '👕', type: 'expense' },
    assinaturas:  { label: 'Assinaturas',  icon: '📱', type: 'expense' },
    outros_d:     { label: 'Outros',       icon: '💸', type: 'expense' },
  };

  /* ── Formatação ─────────────────────────────────────────── */
  const CURRENCY_FMT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  const DATE_FMT     = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  function formatCurrency(v) { return CURRENCY_FMT.format(Number(v) || 0); }
  function formatDate(d) {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d.includes('T') ? d : d + 'T00:00:00') : d;
    return DATE_FMT.format(dt);
  }
  function monthName(m) {
    return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
            'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][Number(m)-1] || '';
  }
  function truncate(str, max = 30) { return str && str.length > max ? str.slice(0, max) + '…' : (str || ''); }

  /* ── Toast ──────────────────────────────────────────────── */
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-text">${message}</span>`;
    container.appendChild(toast);
    const remove = () => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };
    setTimeout(remove, duration);
    toast.addEventListener('click', remove);
  }

  /* ── Loading state ──────────────────────────────────────── */
  function setLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
  }

  /* ── Modal ──────────────────────────────────────────────── */
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    el.addEventListener('click', (e) => { if (e.target === el) closeModal(id); }, { once: true });
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
  }
  function confirm({ title = 'Confirmar', message, confirmText = 'Confirmar', danger = false, onConfirm }) {
    document.getElementById('_confirm-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = '_confirm-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="App.closeModal('_confirm-modal')">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-2);font-size:0.93rem;line-height:1.6">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal('_confirm-modal')">Cancelar</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="_confirm-ok">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    openModal('_confirm-modal');
    document.getElementById('_confirm-ok').addEventListener('click', () => {
      closeModal('_confirm-modal');
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  /* ── Sidebar ────────────────────────────────────────────── */
  function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    if (overlay) {
      overlay.classList.toggle('show');
      overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
    }
  }

  /* ── Avatar ─────────────────────────────────────────────── */
  function updateUserAvatar() {
    const user = Api.auth.getCachedUser?.() ?? null;
    if (!user) return;
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initial);
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name || '');
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email || '');
  }

  /* ── Categorias ─────────────────────────────────────────── */
  function getCategoryInfo(key) { return CATEGORIES[key] || { label: key || 'Outros', icon: '📌' }; }
  function populateCategorySelect(selectEl, type = 'all') {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Selecione uma categoria</option>';
    Object.entries(CATEGORIES).forEach(([key, cat]) => {
      if (type === 'all' || cat.type === type) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${cat.icon} ${cat.label}`;
        selectEl.appendChild(opt);
      }
    });
  }

  /* ── DOM helpers ────────────────────────────────────────── */
  function showLoadingState(el, msg = 'Carregando…') {
    if (!el) return;
    el.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-2)">
      <div style="font-size:1.5rem;margin-bottom:8px;animation:spin 1s linear infinite;display:inline-block">⟳</div>
      <p style="font-size:0.88rem">${msg}</p></div>`;
  }
  function showEmptyState(el, title, message = '', icon = '📭') {
    if (!el) return;
    el.innerHTML = `<div class="empty-state">
      <div class="icon">${icon}</div>
      <h4>${title}</h4>
      ${message ? `<p>${message}</p>` : ''}
    </div>`;
  }

  /* ── Init ───────────────────────────────────────────────── */
  function _init() {
    if (document.querySelector('.sidebar') && !document.querySelector('.sidebar-overlay')) {
      const ov = document.createElement('div');
      ov.className = 'sidebar-overlay';
      document.body.appendChild(ov);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateUserAvatar);
    } else {
      updateUserAvatar();
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelector('.sidebar')?.classList.remove('open');
        document.querySelector('.sidebar-overlay')?.classList.remove('show');
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        document.body.style.overflow = '';
      }
    });
  }

  _init();

  return {
    showToast, setLoading,
    openModal, closeModal, confirm,
    toggleSidebar, updateUserAvatar,
    formatCurrency, formatDate, monthName, truncate,
    getCategoryInfo, populateCategorySelect, CATEGORIES,
    showLoadingState, showEmptyState,
  };
})();
