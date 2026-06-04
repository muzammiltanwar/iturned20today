// FitnessTracker.js
import { stateManager, getTodayDateString } from '../state.js';

export function renderFitnessTracker(container) {
  const state = stateManager.state;
  const habits = state.fitness.habits;
  const todayStr = getTodayDateString();
  
  // Get today's logged values
  const todayLog = state.fitness.dailyLogs[todayStr] || { habits: {}, weight: null };

  // Calculate weekly compliance index calculations
  const weeklyData = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const log = state.fitness.dailyLogs[dateStr] || { habits: {} };
    let metCount = 0;
    
    habits.forEach(h => {
      const val = log.habits[h.id] || 0;
      if (val >= h.target * 0.8) {
        metCount++;
      }
    });

    weeklyData.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      pct: (metCount / habits.length) * 100
    });
  }

  // Draw habit line SVG
  const width = 450;
  const height = 90;
  const paddingLeft = 30;
  const paddingRight = 30;
  const paddingTop = 10;
  const paddingBottom = 20;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const points = weeklyData.map((d, index) => {
    const x = paddingLeft + (index / (weeklyData.length - 1)) * chartW;
    const y = paddingTop + chartH - (d.pct / 100) * chartH;
    return { x, y };
  });

  const linePath = points.map(p => `${p.x},${p.y}`).join(' L ');

  const habitChartSvg = `
    <svg viewBox="0 0 ${width} ${height}" class="habit-line-svg" width="100%" height="100%">
      <!-- Grid lines -->
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" stroke="rgba(255,255,255,0.03)" />
      <line x1="${paddingLeft}" y1="${paddingTop + chartH/2}" x2="${width - paddingRight}" y2="${paddingTop + chartH/2}" stroke="rgba(255,255,255,0.03)" />
      <line x1="${paddingLeft}" y1="${paddingTop + chartH}" x2="${width - paddingRight}" y2="${paddingTop + chartH}" stroke="rgba(255,255,255,0.1)" />

      <!-- Area fill under line -->
      <path d="M ${paddingLeft},${paddingTop + chartH} L ${linePath} L ${width - paddingRight},${paddingTop + chartH} Z" fill="rgba(16,185,129,0.08)" />
      
      <!-- Line path -->
      <path d="M ${linePath}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Markers and Labels -->
      ${weeklyData.map((d, index) => {
        const p = points[index];
        return `
          <circle cx="${p.x}" cy="${p.y}" r="3" fill="#10b981" />
          <text x="${p.x}" y="${height - 4}" font-size="8" fill="var(--text-secondary)" text-anchor="middle" font-family="var(--font-accent)">${d.label}</text>
          <text x="${p.x}" y="${p.y - 6}" font-size="8" fill="#fff" text-anchor="middle" font-family="var(--font-accent)">${d.pct.toFixed(0)}%</text>
        `;
      }).join('')}
    </svg>
  `;

  container.innerHTML = `
    <div class="tracker-layout">
      <!-- Left sidebar: Weight and Logger -->
      <div class="tracker-sidebar glass-card">
        <div class="card-glow"></div>
        <h3>Body Metrics</h3>
        
        <div class="weight-logger-box">
          <label>Log Weight (kg)</label>
          <div class="form-group-row">
            <input type="number" id="input-weight" class="glass-input" step="0.1" value="${todayLog.weight || ''}" placeholder="e.g. 72.5" />
            <button class="btn btn-primary" id="btn-save-weight">Log</button>
          </div>
        </div>

        <div class="habits-today-log">
          <h3>Log Habits</h3>
          <div class="log-steppers-list" id="log-steppers-list">
            <!-- Steppers will be injected here -->
          </div>
        </div>
      </div>

      <!-- Right Main Panel: Dial Visuals -->
      <div class="tracker-main">
        <!-- Habit Compliance Chart -->
        <div class="glass-card comparative-chart-card" style="padding: 20px; margin-bottom: 24px;">
          <div class="card-glow"></div>
          <div class="card-header" style="margin-bottom: 10px;">
            <h3>Habit Compliance Index</h3>
            <span class="sub-title">7-Day Completion Rate</span>
          </div>
          <div class="habit-chart-container" style="height: 120px;">
            ${habitChartSvg}
          </div>
        </div>

        <div class="glass-card" style="padding: 24px;">
          <div class="card-glow"></div>
          <div class="card-header">
            <h3>Habit Rings</h3>
            <span class="sub-title">Complete 80% or more to count as a daily contribution</span>
          </div>
          
          <div class="fitness-dials-grid" id="fitness-dials-grid">
            <!-- SVG Dials will be loaded here -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind weight save
  const saveWeightBtn = document.getElementById('btn-save-weight');
  saveWeightBtn.addEventListener('click', () => {
    const wt = parseFloat(document.getElementById('input-weight').value);
    if (wt > 0) {
      stateManager.logWeight(todayStr, wt);
      alert('Weight logged successfully!');
    }
  });

  // Render sub elements
  renderHabitSteppersAndDials(container);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderHabitSteppersAndDials(container) {
  const stepperList = document.getElementById('log-steppers-list');
  const dialsGrid = document.getElementById('fitness-dials-grid');
  
  if (!stepperList || !dialsGrid) return;

  const state = stateManager.state;
  const habits = state.fitness.habits;
  const todayStr = getTodayDateString();
  const todayLog = state.fitness.dailyLogs[todayStr] || { habits: {}, weight: null };

  const dialColors = {
    'hab-1': '#00f2fe', // Hydration (Cyan)
    'hab-2': '#10b981', // Steps (Emerald)
    'hab-3': '#8b5cf6', // Sleep (Purple)
    'hab-4': '#ec4899'  // Workout (Pink)
  };

  stepperList.innerHTML = habits
    .map(h => {
      const currentVal = todayLog.habits[h.id] || 0;
      return `
      <div class="stepper-item">
        <span class="stepper-label font-accent">${h.name} (${h.unit})</span>
        <div class="stepper-controls">
          <button class="icon-btn btn-step-down" data-habit-id="${h.id}">-</button>
          <input type="number" class="stepper-input font-accent" id="input-hab-${h.id}" data-habit-id="${h.id}" value="${currentVal}" step="0.5" />
          <button class="icon-btn btn-step-up" data-habit-id="${h.id}">+</button>
        </div>
      </div>
    `;
    })
    .join('');

  dialsGrid.innerHTML = habits
    .map(h => {
      const currentVal = todayLog.habits[h.id] || 0;
      const pct = h.target > 0 ? Math.min(100, Math.round((currentVal / h.target) * 100)) : 0;
      const strokeColor = dialColors[h.id] || '#4facfe';

      const radius = 35;
      const circumference = 2 * Math.PI * radius; // ~219.9
      const offset = circumference - (pct / 100) * circumference;

      return `
      <div class="habit-dial-card glass-card-secondary">
        <div class="dial-container">
          <svg viewBox="0 0 100 100" class="dial-svg">
            <circle cx="50" cy="50" r="${radius}" class="radial-bg"></circle>
            <circle cx="50" cy="50" r="${radius}" class="radial-fill" style="stroke: ${strokeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}"></circle>
          </svg>
          <div class="dial-content">
            <span class="dial-pct font-accent">${pct}%</span>
          </div>
        </div>
        <div class="dial-info">
          <h4>${h.name}</h4>
          <span class="dial-details font-accent">${currentVal} / ${h.target} ${h.unit}</span>
        </div>
      </div>
    `;
    })
    .join('');

  // Wire Stepper Events
  container.querySelectorAll('.btn-step-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const habId = btn.dataset.habitId;
      const input = document.getElementById(`input-hab-${habId}`);
      const step = habId === 'hab-2' ? 1000 : 0.5;
      let val = parseFloat(input.value) - step;
      if (val < 0) val = 0;
      input.value = val;
      stateManager.updateHabitProgress(todayStr, habId, val);
      const parent = document.getElementById('fitness-dials-grid').parentElement.parentElement.parentElement;
      renderFitnessTracker(parent);
    });
  });

  container.querySelectorAll('.btn-step-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const habId = btn.dataset.habitId;
      const input = document.getElementById(`input-hab-${habId}`);
      const step = habId === 'hab-2' ? 1000 : 0.5;
      let val = parseFloat(input.value) + step;
      input.value = val;
      stateManager.updateHabitProgress(todayStr, habId, val);
      const parent = document.getElementById('fitness-dials-grid').parentElement.parentElement.parentElement;
      renderFitnessTracker(parent);
    });
  });

  container.querySelectorAll('.stepper-input').forEach(input => {
    input.addEventListener('change', () => {
      const habId = input.dataset.habitId;
      let val = parseFloat(input.value);
      if (isNaN(val) || val < 0) val = 0;
      input.value = val;
      stateManager.updateHabitProgress(todayStr, habId, val);
      const parent = document.getElementById('fitness-dials-grid').parentElement.parentElement.parentElement;
      renderFitnessTracker(parent);
    });
  });
}
