// FinanceTracker.js
import { stateManager, getTodayDateString, formatCurrency } from '../state.js';

export function renderFinanceTracker(container) {
  const state = stateManager.state;
  const finances = state.finances;

  // Calculate calculations
  let totalIncome = 0;
  let totalExpense = 0;
  finances.transactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  const netBalance = totalIncome - totalExpense;
  const budgetRatio = state.monthlyBudget > 0 ? (totalExpense / state.monthlyBudget) * 100 : 0;
  const isOverBudget = totalExpense > state.monthlyBudget;

  // Draw Cash Flow Bar Chart SVG
  const maxVal = Math.max(totalIncome, totalExpense, 100);
  const incPct = (totalIncome / maxVal) * 100;
  const expPct = (totalExpense / maxVal) * 100;

  const flowChartSvg = `
    <svg viewBox="0 0 400 120" class="flow-bar-svg" width="100%" height="100%">
      <!-- Income Bar -->
      <text x="10" y="25" font-size="10" fill="var(--text-secondary)" font-family="var(--font-accent)">Income</text>
      <rect x="10" y="32" width="${(380 * incPct) / 100}" height="14" rx="4" fill="url(#gradient-emerald)" />
      <text x="${Math.max(20, (380 * incPct) / 100 - 45)}" y="43" font-size="9" fill="#fff" font-weight="700" font-family="var(--font-accent)">+${formatCurrency(Math.round(totalIncome))}</text>
      
      <!-- Expense Bar -->
      <text x="10" y="75" font-size="10" fill="var(--text-secondary)" font-family="var(--font-accent)">Expenses</text>
      <rect x="10" y="82" width="${(380 * expPct) / 100}" height="14" rx="4" fill="url(#gradient-pink)" />
      <text x="${Math.max(20, (380 * expPct) / 100 - 45)}" y="93" font-size="9" fill="#fff" font-weight="700" font-family="var(--font-accent)">-${formatCurrency(Math.round(totalExpense))}</text>
    </svg>
  `;

  container.innerHTML = `
    <div class="tracker-layout">
      <!-- Left sidebar: Stats and Budgets -->
      <div class="tracker-sidebar glass-card">
        <div class="card-glow"></div>
        <h3>Financial Health</h3>
        
        <div class="finance-metric-block">
          <div class="metric-row">
            <span>Net Balance</span>
            <span class="metric-val ${netBalance >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(netBalance)}</span>
          </div>
          <div class="metric-row">
            <span>Total Income</span>
            <span class="metric-val text-success">+${formatCurrency(totalIncome)}</span>
          </div>
          <div class="metric-row">
            <span>Total Expenses</span>
            <span class="metric-val text-danger">-${formatCurrency(totalExpense)}</span>
          </div>
        </div>

        <div class="budget-progress-section">
          <div class="progress-header">
            <span>Monthly Budget Limit</span>
            <span class="font-accent">${formatCurrency(totalExpense)} / ${formatCurrency(state.monthlyBudget)}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${isOverBudget ? 'bg-danger animate-pulse' : 'bg-warning'}" style="width: ${Math.min(100, budgetRatio)}%"></div>
          </div>
          <p class="budget-status-text font-accent">
            ${isOverBudget 
              ? `<span class="text-danger"><i data-lucide="alert-octagon"></i> Over budget by ${formatCurrency(totalExpense - state.monthlyBudget)}</span>`
              : `<span class="text-success"><i data-lucide="check-circle"></i> ${formatCurrency(state.monthlyBudget - totalExpense)} remaining</span>`
            }
          </p>
          
          <div class="budget-edit-row">
            <input type="number" id="input-monthly-budget" class="glass-input input-sm" value="${state.monthlyBudget}" placeholder="Set Budget" />
            <button class="btn btn-secondary btn-sm" id="btn-save-budget">Update Budget</button>
          </div>
        </div>

        <!-- Add Transaction Box -->
        <div class="add-tx-box">
          <h3>Log Transaction</h3>
          <div class="form-group">
            <label>Description</label>
            <input type="text" id="tx-description" class="glass-input input-sm" placeholder="e.g. Grocery store" />
          </div>
          <div class="form-group-row">
            <div>
              <label>Amount (${state.currencySymbol || '₹'})</label>
              <input type="number" id="tx-amount" class="glass-input input-sm" placeholder="250" step="0.01" />
            </div>
            <div>
              <label>Type</label>
              <div class="segmented-control" id="tx-type-segmented">
                <button type="button" class="segment-btn active" data-value="expense">Expense</button>
                <button type="button" class="segment-btn" data-value="income">Income</button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Category</label>
            <input type="text" id="tx-category" class="glass-input input-sm" placeholder="Food, Rent, Salary..." list="category-datalist" />
            <datalist id="category-datalist">
              <option value="Food"></option>
              <option value="Utilities"></option>
              <option value="Rent"></option>
              <option value="Freelance"></option>
              <option value="Entertainment"></option>
              <option value="Education"></option>
            </datalist>
          </div>
          <button class="btn btn-primary w-100" id="btn-add-tx"><i data-lucide="plus"></i> Log Entry</button>
        </div>
      </div>

      <!-- Right Main: Savings, Chart and Ledger -->
      <div class="tracker-main">
        <!-- Cash Flow Chart -->
        <div class="glass-card comparative-chart-card" style="padding: 20px;">
          <div class="card-glow"></div>
          <div class="card-header" style="margin-bottom: 10px;">
            <h3>Cash Flow Balance</h3>
            <span class="sub-title">Income vs. Expense comparison</span>
          </div>
          <div class="cash-flow-chart-container" style="height: 120px;">
            ${flowChartSvg}
          </div>
        </div>

        <!-- Section 1: Savings Vaults -->
        <div class="glass-card savings-goals-section">
          <div class="card-glow"></div>
          <div class="card-header">
            <h3>Savings Vaults</h3>
            <button class="btn btn-secondary btn-sm" id="btn-toggle-add-savings"><i data-lucide="plus"></i> New Vault</button>
          </div>

          <!-- New Savings Goal Form -->
          <div class="add-savings-form hidden glass-card-secondary" id="add-savings-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Goal Name</label>
                <input type="text" id="save-title" class="glass-input" placeholder="e.g. Summer Vacation" />
              </div>
              <div class="form-group">
                <label>Target Amount (${state.currencySymbol || '₹'})</label>
                <input type="number" id="save-target" class="glass-input" placeholder="2000" />
              </div>
              <div class="form-group">
                <label>Starting Balance (${state.currencySymbol || '₹'})</label>
                <input type="number" id="save-current" class="glass-input" placeholder="100" />
              </div>
            </div>
            <div class="form-actions-row">
              <button class="btn btn-secondary btn-sm" id="btn-cancel-savings">Cancel</button>
              <button class="btn btn-primary btn-sm" id="btn-create-savings">Create Vault</button>
            </div>
          </div>

          <div class="savings-grid" id="savings-grid">
             <!-- Savings cards will be generated here -->
          </div>
        </div>

        <!-- Section 2: Ledger -->
        <div class="glass-card ledger-section">
          <div class="card-glow"></div>
          <div class="card-header">
            <h3>Transaction Ledger</h3>
          </div>
          
          <div class="table-container">
            <table class="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="ledger-tbody">
                <!-- Ledger items dynamically loaded -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Segmented Type Selector Logic
  let selectedType = 'expense';
  const segmentBtns = container.querySelectorAll('#tx-type-segmented .segment-btn');
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.value;
    });
  });

  // Attach Budget Handlers
  const saveBudgetBtn = document.getElementById('btn-save-budget');
  const inputBudget = document.getElementById('input-monthly-budget');
  saveBudgetBtn.addEventListener('click', () => {
    const val = parseFloat(inputBudget.value);
    if (val >= 0) {
      stateManager.updateBudget(val);
      renderFinanceTracker(container);
    }
  });

  // Attach Transaction Handlers
  const addTxBtn = document.getElementById('btn-add-tx');
  addTxBtn.addEventListener('click', () => {
    const desc = document.getElementById('tx-description').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const category = document.getElementById('tx-category').value.trim() || 'General';

    if (desc && amount > 0) {
      stateManager.addTransaction(selectedType, category, amount, desc);
      renderFinanceTracker(container);
    }
  });

  // Attach Savings Toggles
  const newVaultBtn = document.getElementById('btn-toggle-add-savings');
  const savingsForm = document.getElementById('add-savings-form');
  const createSavingsBtn = document.getElementById('btn-create-savings');
  const cancelSavingsBtn = document.getElementById('btn-cancel-savings');

  newVaultBtn.addEventListener('click', () => {
    savingsForm.classList.toggle('hidden');
  });

  cancelSavingsBtn.addEventListener('click', () => {
    savingsForm.classList.add('hidden');
  });

  createSavingsBtn.addEventListener('click', () => {
    const title = document.getElementById('save-title').value.trim();
    const target = parseFloat(document.getElementById('save-target').value);
    const current = parseFloat(document.getElementById('save-current').value) || 0;

    if (title && target > 0) {
      stateManager.addSavingsGoal(title, target, current);
      renderFinanceTracker(container);
    }
  });

  // Render sub elements
  renderSavingsVaults();
  renderLedger();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderSavingsVaults() {
  const grid = document.getElementById('savings-grid');
  if (!grid) return;

  const state = stateManager.state;
  const vaults = state.finances.savingsGoals;

  if (vaults.length === 0) {
    grid.innerHTML = `
      <div class="empty-state w-100">
        <p>No savings vaults created. Save up for something exciting!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = vaults
    .map(v => {
      const pct = v.target > 0 ? Math.min(100, Math.round((v.current / v.target) * 100)) : 0;
      return `
      <div class="savings-card glass-card-secondary" data-save-id="${v.id}">
        <div class="vault-header">
          <h4>${v.title}</h4>
          <button class="icon-btn btn-delete-vault" data-save-id="${v.id}"><i data-lucide="x"></i></button>
        </div>
        
        <!-- Premium Vault Visual: An actual cylinder that fills up -->
        <div class="vault-visual-container">
          <div class="vault-cylinder">
            <div class="vault-liquid" style="height: ${pct}%"></div>
            <div class="vault-reflection"></div>
            <span class="vault-pct font-accent">${pct}%</span>
          </div>
        </div>

        <div class="vault-progress-details font-accent">
          <span>${formatCurrency(v.current)}</span>
          <span>Target: ${formatCurrency(v.target)}</span>
        </div>

        <div class="vault-update-row">
          <input type="number" class="glass-input input-sm input-current-savings" data-save-id="${v.id}" value="${v.current}" placeholder="Update" />
          <button class="btn btn-secondary btn-sm btn-update-vault" data-save-id="${v.id}">Update</button>
        </div>
      </div>
    `;
    })
    .join('');

  // Wire vault events
  document.querySelectorAll('.btn-update-vault').forEach(btn => {
    btn.addEventListener('click', () => {
      const saveId = btn.dataset.saveId;
      const input = document.querySelector(`.input-current-savings[data-save-id="${saveId}"]`);
      const val = parseFloat(input.value);
      if (val >= 0) {
        stateManager.updateSavingsProgress(saveId, val);
        renderSavingsVaults();
      }
    });
  });

  // Delete Vault
  document.querySelectorAll('.btn-delete-vault').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this savings vault?')) {
        const saveId = btn.dataset.saveId;
        stateManager.deleteSavingsGoal(saveId);
        renderSavingsVaults();
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderLedger() {
  const tbody = document.getElementById('ledger-tbody');
  if (!tbody) return;

  const state = stateManager.state;
  const transactions = [...state.finances.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table-cell">No transactions logged.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions
    .map(
      t => `
    <tr>
      <td>${new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
      <td>${t.description}</td>
      <td><span class="ledger-cat font-accent">${t.category}</span></td>
      <td class="${t.type === 'income' ? 'text-success font-bold' : 'text-danger'}">
        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
      </td>
      <td>
        <button class="icon-btn btn-delete-tx text-danger" data-tx-id="${t.id}"><i data-lucide="trash"></i></button>
      </td>
    </tr>
  `
    )
    .join('');

  // Wire delete tx
  tbody.querySelectorAll('.btn-delete-tx').forEach(btn => {
    btn.addEventListener('click', () => {
      const txId = btn.dataset.txId;
      stateManager.deleteTransaction(txId);
      const parent = document.querySelector('.tracker-layout').parentElement;
      renderFinanceTracker(parent);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}
