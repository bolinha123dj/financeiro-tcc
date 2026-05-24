/* ============================================================
   dashboard.js — Lógica completa do dashboard
   ============================================================ */

if (!Api.auth.requireAuth()) window.location.href = 'index.html';

/* ── Estado ─────────────────────────────────────────────── */
const State = {
  transactions:       [],
  goals:              [],
  editingTransaction: null,
  editingGoal:        null,
  filter: {
    type:   'all',
    month:  new Date().getMonth() + 1,
    year:   new Date().getFullYear(),
    search: '',
  },
};

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  App.updateUserAvatar();
  _initMonthSelector();
  _initModals();
  _loadAll();
});

async function _loadAll() {
  await Promise.all([loadSummary(), loadTransactions(), loadGoals()]);
}

/* ── Mês/Ano ─────────────────────────────────────────────── */
function _initMonthSelector() {
  const monthSel = document.getElementById('filterMonth');
  const yearSel  = document.getElementById('filterYear');
  if (!monthSel || !yearSel) return;

  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = App.monthName(m);
    if (m === State.filter.month) opt.selected = true;
    monthSel.appendChild(opt);
  }

  const curYear = new Date().getFullYear();
  for (let y = curYear; y >= curYear - 4; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === State.filter.year) opt.selected = true;
    yearSel.appendChild(opt);
  }

  monthSel.addEventListener('change', () => { State.filter.month = Number(monthSel.value); _loadAll(); });
  yearSel.addEventListener('change',  () => { State.filter.year  = Number(yearSel.value);  _loadAll(); });
}

/* ── Resumo ──────────────────────────────────────────────── */
async function loadSummary() {
  try {
    const s = await Api.transactions.summary(State.filter.month, State.filter.year);
    const income  = s.income  ?? s.total_income  ?? 0;
    const expense = s.expense ?? s.total_expense ?? 0;
    const balance = income - expense;

    _setText('totalIncome',  App.formatCurrency(income));
    _setText('totalExpense', App.formatCurrency(expense));

    const balEl = document.getElementById('totalBalance');
    if (balEl) {
      balEl.textContent = App.formatCurrency(balance);
      balEl.className   = 'value ' + (balance >= 0 ? 'positive' : 'negative');
    }
    _renderChart(income, expense);
  } catch (err) {
    console.error('Resumo:', err.message);
  }
}

/* ── Gráfico donut ───────────────────────────────────────── */
function _renderChart(income, expense) {
  const canvas = document.getElementById('summaryChart');
  if (!canvas || !canvas.getContext) return;

  const ctx   = canvas.getContext('2d');
  const total = income + expense || 1;
  const W = canvas.width  = canvas.offsetWidth  || 180;
  const H = canvas.height = canvas.offsetHeight || 180;
  const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 10;

  ctx.clearRect(0, 0, W, H);

  const segments = [
    { value: income,  color: '#00e676' },
    { value: expense, color: '#ff4d6d' },
  ];

  let angle = -Math.PI / 2;
  segments.forEach(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    angle += sweep;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, 2 * Math.PI);
  ctx.fillStyle = '#131920';
  ctx.fill();

  // % de receita no centro
  const pct = total > 0 ? Math.round((income / total) * 100) : 0;
  ctx.fillStyle = '#f0f4f8';
  ctx.font = `bold ${Math.round(r * 0.32)}px DM Sans, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${pct}%`, cx, cy - 6);
  ctx.font = `${Math.round(r * 0.18)}px DM Sans, sans-serif`;
  ctx.fillStyle = '#8fa3b8';
  ctx.fillText('receitas', cx, cy + r * 0.22);
}

/* ── Transações ──────────────────────────────────────────── */
async function loadTransactions() {
  const container = document.getElementById('transactionsList');
  if (!container) return;
  App.showLoadingState(container, 'Carregando transações…');

  try {
    const filters = { month: State.filter.month, year: State.filter.year };
    if (State.filter.type !== 'all') filters.type = State.filter.type;
    if (State.filter.search)        filters.search = State.filter.search;

    State.transactions = await Api.transactions.list(filters);
    renderTransactions();
  } catch (err) {
    App.showEmptyState(container, 'Erro ao carregar', err.message, '⚠️');
    App.showToast('Erro ao carregar transações.', 'error');
  }
}

function renderTransactions() {
  const container = document.getElementById('transactionsList');
  if (!container) return;

  if (!State.transactions.length) {
    App.showEmptyState(container, 'Nenhuma transação', 'Adicione sua primeira transação clicando em "+ Nova".', '💳');
    return;
  }

  const rows = State.transactions.map(t => {
    const cat      = App.getCategoryInfo(t.category);
    const isIncome = t.type === 'income';
    return `
      <tr>
        <td><span class="category-tag">${cat.icon} ${cat.label}</span></td>
        <td style="font-weight:500">${App.truncate(t.description, 35)}</td>
        <td><span class="badge badge-${t.type}">${isIncome ? '⬆ Receita' : '⬇ Despesa'}</span></td>
        <td class="${isIncome ? 'amount-positive' : 'amount-negative'}">
          ${isIncome ? '+' : '-'} ${App.formatCurrency(t.amount)}
        </td>
        <td style="color:var(--text-2);font-size:0.85rem">${App.formatDate(t.date)}</td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-ghost btn-sm btn-icon" title="Editar" onclick="openEditTransaction('${t.id}')">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" title="Excluir" onclick="deleteTransaction('${t.id}')">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Categoria</th><th>Descrição</th><th>Tipo</th>
            <th>Valor</th><th>Data</th><th></th>
          </tr>
        </thead>
        <tbody class="stagger-children">${rows}</tbody>
      </table>
    </div>`;
}

/* ── Filtros ─────────────────────────────────────────────── */
function setFilter(type) {
  State.filter.type = type;
  document.querySelectorAll('.filter-chip[data-type]').forEach(c =>
    c.classList.toggle('active', c.dataset.type === type)
  );
  loadTransactions();
}

function setSearch(value) {
  State.filter.search = value;
  loadTransactions();
}

/* ── Modal de Transação ──────────────────────────────────── */
function _initModals() {
  const catSel = document.getElementById('transactionCategory');
  if (catSel) App.populateCategorySelect(catSel, 'all');

  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active-income','active-expense'));
      const t = btn.dataset.type;
      btn.classList.add(t === 'income' ? 'active-income' : 'active-expense');
      _setValue('transactionType', t);
      if (catSel) App.populateCategorySelect(catSel, t);
    });
  });

  document.getElementById('transactionForm')?.addEventListener('submit', handleTransactionSubmit);
  document.getElementById('goalForm')?.addEventListener('submit', handleGoalSubmit);
}

function openNewTransaction() {
  State.editingTransaction = null;
  _setText('transactionModalTitle', '➕ Nova Transação');
  document.getElementById('transactionForm')?.reset();
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active-income','active-expense'));
  document.querySelector('.type-btn[data-type="income"]')?.click();
  _setValue('transactionDate', new Date().toISOString().split('T')[0]);
  App.openModal('transactionModal');
}

function openEditTransaction(id) {
  const t = State.transactions.find(tx => tx.id == id);
  if (!t) return;
  State.editingTransaction = t;
  _setText('transactionModalTitle', '✏️ Editar Transação');
  _setValue('transactionDescription', t.description);
  _setValue('transactionAmount',      t.amount);
  _setValue('transactionDate',        t.date ? t.date.split('T')[0] : '');
  _setValue('transactionType',        t.type);
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active-income','active-expense'));
  document.querySelector(`.type-btn[data-type="${t.type}"]`)?.click();
  setTimeout(() => _setValue('transactionCategory', t.category), 50);
  App.openModal('transactionModal');
}

async function handleTransactionSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('saveTransactionBtn');
  App.setLoading(btn, true);

  const payload = {
    description: _getValue('transactionDescription'),
    amount:      parseFloat(_getValue('transactionAmount')),
    type:        _getValue('transactionType'),
    category:    _getValue('transactionCategory'),
    date:        _getValue('transactionDate'),
  };

  if (!payload.type)                         { App.showToast('Selecione receita ou despesa.', 'warning'); App.setLoading(btn, false); return; }
  if (!payload.category)                     { App.showToast('Selecione uma categoria.', 'warning');      App.setLoading(btn, false); return; }
  if (!payload.amount || payload.amount <= 0){ App.showToast('Informe um valor válido.',   'warning');    App.setLoading(btn, false); return; }

  try {
    if (State.editingTransaction) {
      await Api.transactions.update(State.editingTransaction.id, payload);
      App.showToast('Transação atualizada!', 'success');
    } else {
      await Api.transactions.create(payload);
      App.showToast('Transação criada!', 'success');
    }
    App.closeModal('transactionModal');
    await _loadAll();
  } catch (err) {
    App.showToast(err.message, 'error');
  } finally {
    App.setLoading(btn, false);
  }
}

function deleteTransaction(id) {
  App.confirm({
    title: 'Excluir Transação',
    message: 'Deseja excluir esta transação? Esta ação não pode ser desfeita.',
    confirmText: 'Excluir', danger: true,
    onConfirm: async () => {
      try {
        await Api.transactions.remove(id);
        App.showToast('Transação excluída.', 'success');
        await _loadAll();
      } catch (err) {
        App.showToast(err.message, 'error');
      }
    },
  });
}

/* ── Metas ───────────────────────────────────────────────── */
async function loadGoals() {
  const container = document.getElementById('goalsList');
  if (!container) return;
  try {
    State.goals = await Api.goals.list();
    renderGoals();
  } catch (err) {
    console.error('Goals:', err.message);
  }
}

function renderGoals() {
  const container = document.getElementById('goalsList');
  if (!container) return;

  if (!State.goals.length) {
    App.showEmptyState(container, 'Nenhuma meta', 'Defina uma meta para começar a economizar!', '🎯');
    return;
  }

  container.innerHTML = '<div class="goals-list stagger-children">' +
    State.goals.map(g => {
      const pct    = Math.min(Math.round(((g.current_amount ?? 0) / (g.target_amount || 1)) * 100), 100);
      const isDone = pct >= 100;
      return `
        <div class="goal-card">
          <div class="goal-header">
            <div>
              <div class="goal-name">${isDone ? '✅' : '🎯'} ${App.truncate(g.name, 28)}</div>
              <div class="goal-amounts text-muted">
                ${App.formatCurrency(g.current_amount ?? 0)} de ${App.formatCurrency(g.target_amount)}
                ${g.deadline ? ` · até ${App.formatDate(g.deadline)}` : ''}
              </div>
            </div>
            <div class="goal-percent">${pct}%</div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${pct < 25 ? 'danger' : ''}" style="width:${pct}%"></div>
          </div>
          <div class="d-flex gap-1 mt-2" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" onclick="openEditGoal('${g.id}')">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g.id}')">🗑️</button>
          </div>
        </div>`;
    }).join('') + '</div>';
}

function openNewGoal() {
  State.editingGoal = null;
  _setText('goalModalTitle', '🎯 Nova Meta');
  document.getElementById('goalForm')?.reset();
  App.openModal('goalModal');
}

function openEditGoal(id) {
  const g = State.goals.find(x => x.id == id);
  if (!g) return;
  State.editingGoal = g;
  _setText('goalModalTitle', '✏️ Editar Meta');
  _setValue('goalName',    g.name);
  _setValue('goalTarget',  g.target_amount);
  _setValue('goalCurrent', g.current_amount ?? 0);
  _setValue('goalDeadline', g.deadline ? g.deadline.split('T')[0] : '');
  App.openModal('goalModal');
}

async function handleGoalSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('saveGoalBtn');
  App.setLoading(btn, true);

  const payload = {
    name:           _getValue('goalName'),
    target_amount:  parseFloat(_getValue('goalTarget')),
    current_amount: parseFloat(_getValue('goalCurrent') || 0),
    deadline:       _getValue('goalDeadline') || null,
  };

  try {
    if (State.editingGoal) {
      await Api.goals.update(State.editingGoal.id, payload);
      App.showToast('Meta atualizada!', 'success');
    } else {
      await Api.goals.create(payload);
      App.showToast('Meta criada!', 'success');
    }
    App.closeModal('goalModal');
    await loadGoals();
  } catch (err) {
    App.showToast(err.message, 'error');
  } finally {
    App.setLoading(btn, false);
  }
}

function deleteGoal(id) {
  App.confirm({
    title: 'Excluir Meta', message: 'Deseja excluir esta meta permanentemente?',
    confirmText: 'Excluir', danger: true,
    onConfirm: async () => {
      try {
        await Api.goals.remove(id);
        App.showToast('Meta excluída.', 'success');
        await loadGoals();
      } catch (err) {
        App.showToast(err.message, 'error');
      }
    },
  });
}

/* ── Utils internos ──────────────────────────────────────── */
function _setText(id, text)  { const el = document.getElementById(id); if (el) el.textContent = text; }
function _getValue(id)       { const el = document.getElementById(id); return el ? el.value : ''; }
function _setValue(id, val)  { const el = document.getElementById(id); if (el) el.value = val; }
