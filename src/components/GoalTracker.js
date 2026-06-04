// GoalTracker.js
import { stateManager, getTodayDateString } from '../state.js';
import { triggerConfetti } from '../utils/confetti.js';

export function renderGoalTracker(container) {
  const state = stateManager.state;
  const goals = state.goals;

  // Donut chart calculations
  const categories = ['career', 'skills', 'personal', 'travel'];
  const colors = {
    career: '#00f2fe',
    skills: '#8b5cf6',
    personal: '#ec4899',
    travel: '#f59e0b'
  };
  const counts = categories.map(cat => goals.filter(g => g.category === cat).length);
  const totalGoals = goals.length;

  let donutSvg = '';
  if (totalGoals === 0) {
    donutSvg = `
      <svg viewBox="0 0 100 100" class="donut-svg">
        <circle cx="50" cy="50" r="38" class="radial-bg" stroke-width="8" fill="none"></circle>
        <text x="50" y="55" text-anchor="middle" font-size="8" fill="var(--text-muted)" font-family="var(--font-accent)">No Goals</text>
      </svg>
    `;
  } else {
    let cumulativeCircumference = 0;
    const radius = 35;
    const circ = 2 * Math.PI * radius; // ~219.9
    
    let segments = '';
    categories.forEach((cat, idx) => {
      const count = counts[idx];
      if (count > 0) {
        const pct = count / totalGoals;
        const strokeLength = pct * circ;
        const strokeOffset = circ - strokeLength + cumulativeCircumference;
        cumulativeCircumference -= strokeLength;

        segments += `
          <circle cx="50" cy="50" r="${radius}" 
                  fill="none" 
                  stroke="${colors[cat]}" 
                  stroke-width="9" 
                  stroke-dasharray="${circ}" 
                  stroke-dashoffset="${strokeOffset}" 
                  stroke-linecap="round"
                  transform="rotate(-90 50 50)" />
        `;
      }
    });

    donutSvg = `
      <svg viewBox="0 0 100 100" class="donut-svg">
        <circle cx="50" cy="50" r="${radius}" stroke="rgba(255,255,255,0.03)" stroke-width="9" fill="none"></circle>
        ${segments}
        <g class="donut-text">
          <text x="50" y="48" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)" font-family="var(--font-accent)">${totalGoals}</text>
          <text x="50" y="60" text-anchor="middle" font-size="7" fill="var(--text-secondary)" font-family="var(--font-accent)">TOTAL GOALS</text>
        </g>
      </svg>
    `;
  }

  container.innerHTML = `
    <div class="goals-layout">
      <!-- Left Admin Pane -->
      <div class="goals-sidebar glass-card">
        <div class="card-glow"></div>
        
        <!-- Donut chart visual -->
        <div class="goals-analytics-box">
          <h3>Manifest Balance</h3>
          <div class="donut-chart-wrapper">
            ${donutSvg}
          </div>
          <div class="donut-legend font-accent">
            <span class="legend-dot-item"><span class="dot" style="background:#00f2fe"></span>Career</span>
            <span class="legend-dot-item"><span class="dot" style="background:#8b5cf6"></span>Skills</span>
            <span class="legend-dot-item"><span class="dot" style="background:#ec4899"></span>Personal</span>
            <span class="legend-dot-item"><span class="dot" style="background:#f59e0b"></span>Travel</span>
          </div>
        </div>

        <hr class="modal-separator" style="margin: 10px 0;" />

        <h3>Manifest New Goal</h3>
        <div class="form-group">
          <label>Goal Title</label>
          <input type="text" id="goal-title-input" class="glass-input" placeholder="e.g. Master React & Redux" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <div class="custom-select-container" id="goal-category-select-container">
            <button type="button" class="glass-input custom-select-trigger" id="goal-category-select-trigger" data-value="career">
              <span>💼 Career & Growth</span>
              <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
            </button>
            <div class="custom-select-options hidden" id="goal-category-select-options">
              <div class="custom-select-option" data-value="career">💼 Career & Growth</div>
              <div class="custom-select-option" data-value="skills">🎹 Skills & Talents</div>
              <div class="custom-select-option" data-value="personal">🌱 Personal & Mind</div>
              <div class="custom-select-option" data-value="travel">✈️ Travel & Adventure</div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary w-100" id="btn-manifest-goal">
          <i data-lucide="sparkles"></i> Manifest Goal
        </button>
      </div>

      <!-- Right Main Pane: Goal Cards -->
      <div class="goals-main">
        <div class="goals-filter-row">
          <button class="filter-tab active" data-category="all">All Goals</button>
          <button class="filter-tab" data-category="career">Career</button>
          <button class="filter-tab" data-category="skills">Skills</button>
          <button class="filter-tab" data-category="personal">Personal</button>
          <button class="filter-tab" data-category="travel">Travel</button>
        </div>

        <div class="goals-grid" id="goals-cards-grid">
          <!-- Goal cards injected dynamically -->
        </div>
      </div>
    </div>
  `;

  // Custom Dropdown Picker Logic
  const trigger = document.getElementById('goal-category-select-trigger');
  const optionsPanel = document.getElementById('goal-category-select-options');
  const options = optionsPanel.querySelectorAll('.custom-select-option');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    optionsPanel.classList.toggle('hidden');
  });

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.dataset.value;
      const text = opt.textContent;
      
      trigger.dataset.value = val;
      trigger.querySelector('span').textContent = text;
      optionsPanel.classList.add('hidden');
    });
  });

  document.addEventListener('click', () => {
    optionsPanel.classList.add('hidden');
  });

  // Bind add goal
  const manifestBtn = document.getElementById('btn-manifest-goal');
  const titleInput = document.getElementById('goal-title-input');

  manifestBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const category = trigger.dataset.value;
    if (title) {
      stateManager.addGoal(title, category);
      titleInput.value = '';
      renderGoalTracker(container); // Full re-render to update donut chart!
    }
  });

  // Bind category filter tabs
  const filterTabs = container.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderGoalCards(tab.dataset.category);
    });
  });

  // Initial render
  renderGoalCards('all');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderGoalCards(filterCategory = 'all') {
  const grid = document.getElementById('goals-cards-grid');
  if (!grid) return;

  const state = stateManager.state;
  const filteredGoals = state.goals.filter(g => filterCategory === 'all' || g.category === filterCategory);

  if (filteredGoals.length === 0) {
    grid.innerHTML = `
      <div class="empty-state glass-card w-100 grid-full-width" style="grid-column: 1 / -1;">
        <i data-lucide="target" class="empty-icon"></i>
        <p>No goals logged in this category. Write down your aspirations on the left!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  grid.innerHTML = filteredGoals
    .map(goal => {
      const msTotal = goal.milestones.length;
      const msCompleted = goal.milestones.filter(m => m.completed).length;
      const pct = msTotal > 0 ? Math.round((msCompleted / msTotal) * 100) : (goal.completed ? 100 : 0);

      // Icon mappings
      const catIcons = {
        career: 'briefcase',
        skills: 'award',
        personal: 'heart',
        travel: 'compass'
      };
      const iconName = catIcons[goal.category] || 'target';

      return `
      <div class="goal-card glass-card ${goal.completed ? 'goal-completed' : ''}" data-goal-id="${goal.id}">
        <div class="card-glow"></div>
        <div class="goal-card-header">
          <div class="goal-icon-box ${goal.category}-accent">
            <i data-lucide="${iconName}"></i>
          </div>
          <div class="goal-info">
            <div class="goal-title-edit-row">
              <h4 id="g-title-${goal.id}" class="goal-card-title">${goal.title}</h4>
              <input type="text" id="edit-g-title-${goal.id}" class="glass-input hidden rename-input" value="${goal.title}" />
              <button class="icon-btn btn-edit-goal" data-goal-id="${goal.id}"><i data-lucide="edit-2"></i></button>
            </div>
            <span class="goal-category font-accent">${goal.category.toUpperCase()}</span>
          </div>
        </div>

        <div class="goal-progress-section">
          <div class="goal-progress-bar">
            <div class="progress-track"><div class="progress-fill" style="width: ${pct}%"></div></div>
            <span class="progress-val font-accent">${pct}%</span>
          </div>
        </div>

        <!-- Milestones list -->
        <div class="milestones-container">
          <h5>Milestones</h5>
          <div class="milestones-list" id="ms-list-${goal.id}">
            ${goal.milestones
              .map(
                ms => `
              <div class="milestone-item ${ms.completed ? 'completed' : ''}">
                <input type="checkbox" id="chk-ms-${ms.id}" data-goal-id="${goal.id}" data-ms-id="${ms.id}" class="ms-checkbox" ${ms.completed ? 'checked' : ''} />
                <span class="ms-label-container">
                  <label for="chk-ms-${ms.id}" id="ms-title-${ms.id}">${ms.title}</label>
                  <input type="text" id="edit-ms-title-${ms.id}" class="glass-input hidden rename-input" value="${ms.title}" />
                </span>
                <div class="ms-actions">
                  <button class="icon-btn btn-edit-ms" data-goal-id="${goal.id}" data-ms-id="${ms.id}"><i data-lucide="edit-2"></i></button>
                  <button class="icon-btn btn-delete-ms" data-goal-id="${goal.id}" data-ms-id="${ms.id}"><i data-lucide="x"></i></button>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
          
          <!-- Add Milestone Inline -->
          <div class="add-ms-inline">
            <input type="text" id="input-new-ms-${goal.id}" class="glass-input input-sm" placeholder="+ Add milestone" />
            <button class="btn btn-secondary btn-sm btn-add-ms" data-goal-id="${goal.id}"><i data-lucide="plus"></i></button>
          </div>
        </div>

        <div class="goal-actions">
          <button class="btn btn-sm btn-danger btn-delete-goal" data-goal-id="${goal.id}">
            <i data-lucide="trash-2"></i> Delete Goal
          </button>
          
          <button class="btn btn-sm ${goal.completed ? 'btn-secondary' : 'btn-success'} btn-complete-goal" data-goal-id="${goal.id}">
            <i data-lucide="${goal.completed ? 'rotate-ccw' : 'check'}"></i> 
            ${goal.completed ? 'Undo Done' : 'Complete Goal'}
          </button>
        </div>
      </div>
    `;
    })
    .join('');

  // Setup goal event handlers
  setupGoalEventHandlers(filterCategory);
}

function setupGoalEventHandlers(filterCategory) {
  const todayStr = getTodayDateString();

  // Edit Goal Title
  document.querySelectorAll('.btn-edit-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalId;
      const titleDisplay = document.getElementById(`g-title-${goalId}`);
      const titleInput = document.getElementById(`edit-g-title-${goalId}`);

      if (titleInput.classList.contains('hidden')) {
        titleDisplay.classList.add('hidden');
        titleInput.classList.remove('hidden');
        titleInput.focus();
        btn.innerHTML = `<i data-lucide="check"></i>`;
        if (window.lucide) window.lucide.createIcons();
      } else {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
          stateManager.editGoal(goalId, newTitle);
          titleDisplay.textContent = newTitle;
        }
        titleDisplay.classList.remove('hidden');
        titleInput.classList.add('hidden');
        btn.innerHTML = `<i data-lucide="edit-2"></i>`;
        if (window.lucide) window.lucide.createIcons();
        renderGoalCards(filterCategory);
      }
    });
  });

  // Edit Milestone Title
  document.querySelectorAll('.btn-edit-ms').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalId;
      const msId = btn.dataset.msId;
      const titleDisplay = document.getElementById(`ms-title-${msId}`);
      const titleInput = document.getElementById(`edit-ms-title-${msId}`);

      if (titleInput.classList.contains('hidden')) {
        titleDisplay.classList.add('hidden');
        titleInput.classList.remove('hidden');
        titleInput.focus();
        btn.innerHTML = `<i data-lucide="check"></i>`;
        if (window.lucide) window.lucide.createIcons();
      } else {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
          stateManager.editMilestone(goalId, msId, newTitle);
          titleDisplay.textContent = newTitle;
        }
        titleDisplay.classList.remove('hidden');
        titleInput.classList.add('hidden');
        btn.innerHTML = `<i data-lucide="edit-2"></i>`;
        if (window.lucide) window.lucide.createIcons();
        renderGoalCards(filterCategory);
      }
    });
  });

  // Delete Goal
  document.querySelectorAll('.btn-delete-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this goal?')) {
        const goalId = btn.dataset.goalId;
        stateManager.deleteGoal(goalId);
        // Re-render whole component to update donut chart!
        const parent = document.getElementById('goals-cards-grid').parentElement.parentElement;
        renderGoalTracker(parent);
      }
    });
  });

  // Complete Goal Toggle
  document.querySelectorAll('.btn-complete-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalId;
      const goal = stateManager.state.goals.find(g => g.id === goalId);
      if (goal) {
        const newCompleted = !goal.completed;
        stateManager.toggleGoalCompletion(goalId, newCompleted);
        if (newCompleted) {
          stateManager.incrementDailyTaskCount(todayStr);
          triggerConfetti();
        } else {
          stateManager.decrementDailyTaskCount(todayStr);
        }
        // Re-render whole component to update donut chart!
        const parent = document.getElementById('goals-cards-grid').parentElement.parentElement;
        renderGoalTracker(parent);
      }
    });
  });

  // Add Milestone Inline
  document.querySelectorAll('.btn-add-ms').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalId;
      const input = document.getElementById(`input-new-ms-${goalId}`);
      const msTitle = input.value.trim();
      if (msTitle) {
        stateManager.addMilestone(goalId, msTitle);
        input.value = '';
        renderGoalCards(filterCategory);
      }
    });
  });

  // Allow enter key to trigger Add Milestone
  document.querySelectorAll('.add-ms-inline input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const goalId = input.id.replace('input-new-ms-', '');
        const btn = input.nextElementSibling;
        btn.click();
      }
    });
  });

  // Milestone Checkbox Toggle
  document.querySelectorAll('.ms-checkbox').forEach(chk => {
    chk.addEventListener('change', () => {
      const goalId = chk.dataset.goalId;
      const msId = chk.dataset.msId;
      const isChecked = chk.checked;
      
      stateManager.toggleMilestone(goalId, msId, isChecked);
      if (isChecked) {
        stateManager.incrementDailyTaskCount(todayStr);
        const goal = stateManager.state.goals.find(g => g.id === goalId);
        if (goal && goal.completed) {
          triggerConfetti();
        }
      } else {
        stateManager.decrementDailyTaskCount(todayStr);
      }
      renderGoalCards(filterCategory);
    });
  });

  // Delete Milestone
  document.querySelectorAll('.btn-delete-ms').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalId;
      const msId = btn.dataset.msId;
      stateManager.deleteMilestone(goalId, msId);
      renderGoalCards(filterCategory);
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
