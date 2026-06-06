// PomodoroTimer.js
import { stateManager, getTodayDateString } from '../state.js';

let timerInterval = null;
let secondsLeft = 25 * 60;
let isRunning = false;
let isWorkMode = true; // true = work, false = break
let selectedTask = {
  id: 'general-focus',
  type: 'general',
  name: 'General Productivity',
  label: '⚡ General Productivity Session'
};
let customMinutes = 25; // default custom work time
let containerEl = null;

export function renderPomodoroTimer(container) {
  containerEl = container;
  const state = stateManager.state;
  const settings = state.pomodoroSettings;

  // Let's populate the custom task selection list options
  const activeDegree = stateManager.getActiveDegree();
  const taskOptions = [];
  
  // Add active syllabus topics
  if (activeDegree && activeDegree.modules) {
    activeDegree.modules.forEach(mod => {
      mod.topics.forEach(top => {
        if (!top.completed) {
          taskOptions.push({
            type: 'syllabus',
            id: top.id,
            moduleId: mod.id,
            moduleName: mod.name,
            name: top.name,
            label: `📚 ${mod.name}: ${top.name}`
          });
        }
      });
    });
  }

  // Add active goal milestones
  state.goals.forEach(goal => {
    if (!goal.completed) {
      goal.milestones.forEach(ms => {
        if (!ms.completed) {
          taskOptions.push({
            type: 'milestone',
            id: ms.id,
            goalId: goal.id,
            goalTitle: goal.title,
            name: ms.title,
            label: `🎯 ${goal.title}: ${ms.title}`
          });
        }
      });
    }
  });

  // Add today's calendar events
  const todayStr = getTodayDateString();
  const calendarEvents = state.calendarEvents || [];
  calendarEvents.forEach(evt => {
    if (!evt.completed && evt.date === todayStr) {
      taskOptions.push({
        type: 'calendar',
        id: evt.id,
        name: evt.title,
        label: `📅 Calendar: ${evt.title}`
      });
    }
  });

  // Default option
  taskOptions.unshift({
    type: 'general',
    id: 'general-focus',
    name: 'General Productivity',
    label: '⚡ General Productivity Session'
  });

  // Ensure selectedTask is still valid in options, fallback if not
  const taskExists = taskOptions.some(opt => opt.id === selectedTask.id);
  if (!taskExists) {
    selectedTask = taskOptions[0];
  }

  // If timer is not running and hasn't started yet, set seconds based on mode
  if (!isRunning) {
    secondsLeft = (isWorkMode ? customMinutes : settings.breakTime) * 60;
  }

  container.innerHTML = `
    <div class="pomodoro-layout-grid">
      <!-- Left side: The Timer and configuration -->
      <div class="pomodoro-timer-panel glass-card">
        <div class="card-glow"></div>
        
        <div class="pomodoro-header">
          <h2 id="pomo-mode-title">${isWorkMode ? 'Deep Work Focus' : 'Short Break'}</h2>
          <p class="subtitle font-accent">Silence distractions and enter flow state</p>
        </div>

        <div class="pomodoro-visual-wrapper">
          <div class="pomodoro-pulse-ring" id="pomo-pulse-ring"></div>
          <div class="pomodoro-circle-box">
            <svg viewBox="0 0 100 100" class="pomodoro-svg">
              <circle cx="50" cy="50" r="45" class="radial-bg"></circle>
              <circle cx="50" cy="50" r="45" class="radial-fill" id="pomo-radial-fill" style="stroke-dasharray: 282.7; stroke-dashoffset: 0; stroke: var(--stroke-color);"></circle>
            </svg>
            <div class="pomodoro-display">
              <span class="digital-time font-accent" id="pomo-digital-time">25:00</span>
            </div>
          </div>
        </div>

        <div class="pomodoro-config-box">
          <div class="pomodoro-presets">
            <button class="preset-tab ${isWorkMode ? 'active' : ''}" id="preset-work">Work Focus</button>
            <button class="preset-tab ${!isWorkMode ? 'active' : ''}" id="preset-break">Break</button>
          </div>

          <div class="duration-slider-group ${isWorkMode ? '' : 'hidden'}" id="duration-slider-group">
            <div class="slider-label-row">
              <label>Focus Duration</label>
              <span class="duration-val font-accent" id="custom-duration-val">${customMinutes}m</span>
            </div>
            <input type="range" id="pomo-duration-slider" min="1" max="120" value="${customMinutes}" class="glass-slider" ${isRunning ? 'disabled' : ''} />
          </div>
        </div>

        <!-- Custom Dropdown select menu for Active study tasks -->
        <div class="form-group pomo-task-group ${isWorkMode ? '' : 'hidden'}" id="pomo-task-selection-group">
          <label>Link Focus Session to Task</label>
          <div class="custom-select-container" id="pomo-task-select-container">
            <button type="button" class="glass-input custom-select-trigger" id="pomo-task-select-trigger" data-value="${selectedTask.id}" ${isRunning ? 'disabled' : ''}>
              <span>${selectedTask.label}</span>
              <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
            </button>
            <div class="custom-select-options hidden" id="pomo-task-select-options">
              ${taskOptions.map(opt => `
                <div class="custom-select-option" data-value="${opt.id}" data-type="${opt.type}" data-name="${opt.name}" data-label="${opt.label}" ${opt.moduleId ? `data-module-id="${opt.moduleId}"` : ''}>
                  ${opt.label}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pomodoro-controls">
          <button class="btn btn-secondary btn-sm" id="btn-pomo-reset">
            <i data-lucide="rotate-ccw"></i> Reset
          </button>
          <button class="btn btn-primary" id="btn-pomo-toggle">
            <i data-lucide="${isRunning ? 'pause' : 'play'}"></i> ${isRunning ? 'Pause' : 'Start'}
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-pomo-skip">
            <i data-lucide="skip-forward"></i> Skip
          </button>
        </div>
      </div>

      <!-- Right side: Focus History Log -->
      <div class="pomodoro-history-panel glass-card">
        <div class="card-glow"></div>
        <div class="card-header">
          <h3>Focus Registry</h3>
          <span class="sub-title">Audit trail of completed flow sessions</span>
        </div>
        <div class="focus-log-feed" id="focus-log-feed">
          <!-- Log feed list will be dynamically loaded here -->
        </div>
      </div>
    </div>
  `;

  updateTimerDisplay();
  renderFocusRegistry();

  // Attach controls
  const toggleBtn = document.getElementById('btn-pomo-toggle');
  const resetBtn = document.getElementById('btn-pomo-reset');
  const skipBtn = document.getElementById('btn-pomo-skip');
  const presetWork = document.getElementById('preset-work');
  const presetBreak = document.getElementById('preset-break');
  const slider = document.getElementById('pomo-duration-slider');

  toggleBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener('click', () => {
    resetTimer();
  });

  skipBtn.addEventListener('click', () => {
    skipSession();
  });

  presetWork.addEventListener('click', () => {
    isWorkMode = true;
    presetWork.classList.add('active');
    presetBreak.classList.remove('active');
    document.getElementById('pomo-mode-title').textContent = 'Deep Work Focus';
    document.getElementById('duration-slider-group').classList.remove('hidden');
    document.getElementById('pomo-task-selection-group').classList.remove('hidden');
    resetTimer();
  });

  presetBreak.addEventListener('click', () => {
    isWorkMode = false;
    presetBreak.classList.add('active');
    presetWork.classList.remove('active');
    document.getElementById('pomo-mode-title').textContent = 'Short Break';
    document.getElementById('duration-slider-group').classList.add('hidden');
    document.getElementById('pomo-task-selection-group').classList.add('hidden');
    resetTimer();
  });

  if (slider) {
    slider.addEventListener('input', (e) => {
      customMinutes = parseInt(e.target.value);
      document.getElementById('custom-duration-val').textContent = `${customMinutes}m`;
      if (!isRunning) {
        secondsLeft = customMinutes * 60;
        updateTimerDisplay();
      }
    });
  }

  // Task selection dropdown logic
  const trigger = document.getElementById('pomo-task-select-trigger');
  const optionsPanel = document.getElementById('pomo-task-select-options');
  if (trigger && optionsPanel) {
    const options = optionsPanel.querySelectorAll('.custom-select-option');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsPanel.classList.toggle('hidden');
    });

    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.dataset.value;
        const type = opt.dataset.type;
        const name = opt.dataset.name;
        const label = opt.dataset.label;
        const moduleId = opt.dataset.moduleId || '';

        selectedTask = { id: val, type, name, label, moduleId };
        trigger.dataset.value = val;
        trigger.querySelector('span').textContent = label;
        optionsPanel.classList.add('hidden');
      });
    });

    document.addEventListener('click', () => {
      if (optionsPanel) optionsPanel.classList.add('hidden');
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  
  const pulseRing = document.getElementById('pomo-pulse-ring');
  if (pulseRing) pulseRing.classList.add('active');

  const toggleBtn = document.getElementById('btn-pomo-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = `<i data-lucide="pause"></i> Pause`;
    if (window.lucide) window.lucide.createIcons();
  }

  // Disable slider and dropdown trigger while running
  const slider = document.getElementById('pomo-duration-slider');
  if (slider) slider.disabled = true;
  const trigger = document.getElementById('pomo-task-select-trigger');
  if (trigger) trigger.disabled = true;

  synthSound(440, 'triangle', 0.2);

  timerInterval = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      
      synthSound(880, 'sine', 0.5);
      setTimeout(() => synthSound(1100, 'sine', 0.6), 150);

      // Save to logs
      if (isWorkMode) {
        const focusDuration = customMinutes;
        const taskTitle = selectedTask.label;
        
        stateManager.logFocusSession(taskTitle, focusDuration);
        
        // Add Study Log if syllabus topic
        if (selectedTask.type === 'syllabus' && selectedTask.moduleId) {
          stateManager.addStudyLog(selectedTask.moduleId, focusDuration, `Focused Study Session: ${selectedTask.name}`);
          stateManager.toggleTopicCompletion(selectedTask.moduleId, selectedTask.id, true);
        } else if (selectedTask.type === 'milestone' && selectedTask.goalId) {
          stateManager.toggleMilestone(selectedTask.goalId, selectedTask.id, true);
        } else if (selectedTask.type === 'calendar') {
          stateManager.toggleCalendarEventCompletion(selectedTask.id, true);
        }
      }

      alert(isWorkMode ? 'Great work! Time for a break.' : 'Break is over! Ready to focus?');
      
      // Auto flip-flop mode
      isWorkMode = !isWorkMode;
      
      if (containerEl) {
        renderPomodoroTimer(containerEl);
      }
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);

  const pulseRing = document.getElementById('pomo-pulse-ring');
  if (pulseRing) pulseRing.classList.remove('active');

  const toggleBtn = document.getElementById('btn-pomo-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = `<i data-lucide="play"></i> Start`;
    if (window.lucide) window.lucide.createIcons();
  }

  // Enable slider and dropdown trigger
  const slider = document.getElementById('pomo-duration-slider');
  if (slider) slider.disabled = false;
  const trigger = document.getElementById('pomo-task-select-trigger');
  if (trigger) trigger.disabled = false;

  synthSound(330, 'sawtooth', 0.1);
}

function resetTimer() {
  pauseTimer();
  const settings = stateManager.state.pomodoroSettings;
  secondsLeft = (isWorkMode ? customMinutes : settings.breakTime) * 60;
  updateTimerDisplay();
}

function skipSession() {
  pauseTimer();
  isWorkMode = !isWorkMode;
  
  if (containerEl) {
    renderPomodoroTimer(containerEl);
  }
}

function updateTimerDisplay() {
  const dTime = document.getElementById('pomo-digital-time');
  const radialFill = document.getElementById('pomo-radial-fill');

  if (!dTime) return;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  dTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const settings = stateManager.state.pomodoroSettings;
  const totalSeconds = (isWorkMode ? customMinutes : settings.breakTime) * 60;
  
  const circumference = 2 * Math.PI * 45;
  const fraction = secondsLeft / totalSeconds;
  const strokeOffset = circumference * (1 - fraction);
  
  if (radialFill) {
    radialFill.style.strokeDashoffset = strokeOffset;
    const color = isWorkMode ? '#ec4899' : '#00f2fe';
    radialFill.style.stroke = color;
    document.documentElement.style.setProperty('--stroke-color', color);
  }
}

function renderFocusRegistry() {
  const feed = document.getElementById('focus-log-feed');
  if (!feed) return;

  const history = [...(stateManager.state.focusHistory || [])].reverse();

  if (history.length === 0) {
    feed.innerHTML = `
      <div class="empty-state">
        <i data-lucide="info" class="empty-icon"></i>
        <p>No focus sessions recorded yet. Start the timer to log your flow!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = history.map(item => `
    <div class="focus-log-item glass-card-secondary" data-foc-id="${item.id}">
      <div class="log-info">
        <span class="log-date font-accent">${item.date}</span>
        <h4 class="log-task">${item.taskTitle}</h4>
        <span class="log-duration font-accent"><i data-lucide="clock" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${item.duration} mins</span>
      </div>
      <button class="icon-btn btn-delete-focus text-danger" data-foc-id="${item.id}">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `).join('');

  // Wire delete buttons
  feed.querySelectorAll('.btn-delete-focus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.focId;
      stateManager.state.focusHistory = stateManager.state.focusHistory.filter(f => f.id !== id);
      stateManager.save();
      renderFocusRegistry();
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function synthSound(frequency = 440, type = 'sine', duration = 0.15) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    console.warn('Audio output not allowed/supported yet:', err);
  }
}
