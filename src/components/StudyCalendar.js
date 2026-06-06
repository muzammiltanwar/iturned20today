// StudyCalendar.js
import { stateManager, getTodayDateString } from '../state.js';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-indexed

export function renderStudyCalendar(container) {
  const state = stateManager.state;
  
  container.innerHTML = `
    <div class="calendar-main glass-card" style="width: 100%;">
      <div class="card-glow"></div>
      
      <div class="calendar-header-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 20px;">
        <div class="month-selector-controls" style="display: flex; align-items: center; gap: 16px;">
          <button class="icon-btn" id="btn-prev-month"><i data-lucide="chevron-left"></i></button>
          <h2 id="calendar-month-year-label" class="font-accent" style="margin: 0;">June 2026</h2>
          <button class="icon-btn" id="btn-next-month"><i data-lucide="chevron-right"></i></button>
        </div>

        <div class="planner-legends" style="display: flex; gap: 1.5rem; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <div class="legend-row-planner" style="margin: 0; display: flex; align-items: center; gap: 10px;">
            <span class="indicator-dot type-self"></span>
            <span class="font-accent" style="font-size: 0.85rem; color: var(--text-secondary);">Self Study</span>
          </div>
          <div class="legend-row-planner" style="margin: 0; display: flex; align-items: center; gap: 10px;">
            <span class="indicator-dot type-live"></span>
            <span class="font-accent" style="font-size: 0.85rem; color: var(--text-secondary);">Live Lecture</span>
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" id="btn-today-cal">Today</button>
      </div>

      <div class="calendar-grid-container">
        <div class="calendar-weekdays">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div class="calendar-days-grid" id="calendar-days-grid">
          <!-- Day cells injected dynamically -->
        </div>
      </div>
    </div>

    <!-- Calendar Event Modal -->
    <div class="modal-overlay hidden" id="calendar-event-modal">
      <div class="glass-card modal-content">
        <div class="modal-header">
          <h3 id="cal-modal-title">Schedule Study Session</h3>
          <button class="icon-btn" id="btn-close-cal-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Session Title</label>
            <input type="text" id="evt-title-input" class="glass-input" placeholder="e.g. Solve recursion sheets" />
          </div>
          <div class="form-group">
            <label>Session Type</label>
            <div class="segmented-control" id="evt-type-segmented">
              <button type="button" class="segment-btn active" data-value="self">Self Study</button>
              <button type="button" class="segment-btn" data-value="live">Live Lecture</button>
            </div>
          </div>
          <div class="form-group">
            <label>Subject / Module</label>
            <div class="custom-select-container" id="evt-module-select-container">
              <button type="button" class="glass-input custom-select-trigger" id="evt-module-select-trigger" data-value="">
                <span>-- Select Course --</span>
                <i data-lucide="chevron-down" style="width:16px; height:16px;"></i>
              </button>
              <div class="custom-select-options hidden" id="evt-module-select-options">
                <!-- Modules injected here -->
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Allocated Duration (Minutes)</label>
            <input type="number" id="evt-duration-input" class="glass-input" value="60" min="15" step="15" />
          </div>
          <input type="hidden" id="evt-date-hidden" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel-evt">Cancel</button>
          <button class="btn btn-primary" id="btn-save-evt">Add to Calendar</button>
        </div>
      </div>
    </div>

    <!-- View Calendar Events Detail Modal -->
    <div class="modal-overlay hidden" id="calendar-view-modal">
      <div class="glass-card modal-content">
        <div class="modal-header">
          <h3>Daily Planned Sessions</h3>
          <button class="icon-btn" id="btn-close-view-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body" id="cal-events-list-container">
          <!-- List of events on selected day -->
        </div>
      </div>
    </div>
  `;

  // Bind Month Navigation
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    adjustMonth(-1, container);
  });
  document.getElementById('btn-next-month').addEventListener('click', () => {
    adjustMonth(1, container);
  });
  document.getElementById('btn-today-cal').addEventListener('click', () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    renderStudyCalendar(container);
  });


  // Render Calendar Grid
  renderCalendarDays(container);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function adjustMonth(direction, container) {
  currentMonth += direction;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderStudyCalendar(container);
}

function renderCalendarDays(container) {
  const label = document.getElementById('calendar-month-year-label');
  const grid = document.getElementById('calendar-days-grid');
  
  if (!label || !grid) return;

  const state = stateManager.state;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  label.textContent = `${months[currentMonth]} ${currentYear}`;
  grid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // weekday index of 1st day of month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate(); // days count

  const todayStr = getTodayDateString();

  // Render empty placeholder slots before first weekday of month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day-cell empty-day';
    grid.appendChild(emptyCell);
  }

  // Render month days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day-cell';
    if (dateStr === todayStr) {
      dayCell.classList.add('today-highlight');
    }

    dayCell.innerHTML = `
      <div class="day-number font-accent">${day}</div>
      <div class="day-events-container" id="day-events-${dateStr}"></div>
    `;

    // Click Day to schedule or view
    dayCell.addEventListener('click', () => {
      openDayModal(dateStr, container);
    });

    grid.appendChild(dayCell);

    // Render event dots/tags
    renderDayEventBadges(dateStr);
  }
}

function getCombinedEvents(dateStr) {
  const state = stateManager.state;
  const combined = [...(state.calendarEvents || []).filter(e => e.date === dateStr)];
  
  const activeDegree = stateManager.getActiveDegree();
  if (activeDegree && activeDegree.modules) {
    activeDegree.modules.forEach(m => {
      if (m.lectures) {
        m.lectures.forEach(l => {
          if (l.date === dateStr) {
            combined.push({
              id: l.id,
              date: l.date,
              title: `Logged Lecture: ${l.topic}`,
              type: 'live',
              moduleId: m.id,
              duration: 60,
              completed: true,
              isLectureLog: true
            });
          }
        });
      }
    });
  }
  return combined;
}

function renderDayEventBadges(dateStr) {
  const eventsContainer = document.getElementById(`day-events-${dateStr}`);
  if (!eventsContainer) return;

  const events = getCombinedEvents(dateStr);

  eventsContainer.innerHTML = events
    .map(e => `
      <div class="cal-event-badge type-${e.type} ${e.completed ? 'completed' : ''}" title="${e.title}">
        <span class="badge-dot"></span>
        <span class="badge-title truncate">${e.title}</span>
      </div>
    `)
    .join('');
}

function openDayModal(dateStr, container) {
  const state = stateManager.state;
  const events = getCombinedEvents(dateStr);

  // If there are existing events, open the view/details list first
  if (events.length > 0) {
    const viewModal = document.getElementById('calendar-view-modal');
    const listContainer = document.getElementById('cal-events-list-container');
    
    if (!viewModal || !listContainer) return;

    listContainer.innerHTML = `
      <div class="view-events-list">
        ${events.map(e => {
          const activeDegree = stateManager.getActiveDegree();
          const mod = activeDegree ? activeDegree.modules.find(m => m.id === e.moduleId) : null;
          const modName = mod ? mod.name : 'General study';
          return `
            <div class="view-event-item glass-card-secondary">
              <div class="evt-details-header">
                <span class="indicator-dot type-${e.type}"></span>
                <h4>${e.title}</h4>
              </div>
              <div class="evt-meta font-accent">
                <span>Subject: ${modName}</span>
                <span>Duration: ${e.duration} mins</span>
              </div>
              <div class="evt-actions-row">
                ${e.isLectureLog ? 
                  `<span class="text-muted" style="font-size:11px;"><i data-lucide="info"></i> Managed in Syllabus Track</span>` 
                  : 
                  `<button class="btn btn-secondary btn-sm btn-delete-cal-evt" data-evt-id="${e.id}"><i data-lucide="trash-2"></i> Delete</button>
                  <button class="btn btn-sm ${e.completed ? 'btn-secondary' : 'btn-success'} btn-complete-cal-evt" data-evt-id="${e.id}">
                    <i data-lucide="${e.completed ? 'rotate-ccw' : 'check'}"></i> ${e.completed ? 'Undo' : 'Complete'}
                  </button>`
                }
              </div>
            </div>
          `;
        }).join('')}
        
        <button class="btn btn-primary w-100" id="btn-add-another-evt" style="margin-top: 10px;">
          <i data-lucide="plus"></i> Add New Session
        </button>
      </div>
    `;

    viewModal.classList.remove('hidden');

    const closeView = () => {
      viewModal.classList.add('hidden');
      renderCalendarDays(container);
    };

    document.getElementById('btn-close-view-modal').onclick = closeView;

    // Add another event click
    document.getElementById('btn-add-another-evt').onclick = () => {
      viewModal.classList.add('hidden');
      openAddEventModal(dateStr, container);
    };

    // Wire Complete Event
    listContainer.querySelectorAll('.btn-complete-cal-evt').forEach(btn => {
      btn.addEventListener('click', () => {
        const evtId = btn.dataset.evtId;
        const targetEvt = state.calendarEvents.find(e => e.id === evtId);
        if (targetEvt) {
          stateManager.toggleCalendarEventCompletion(evtId, !targetEvt.completed);
          openDayModal(dateStr, container); // refresh view
        }
      });
    });

    // Wire Delete Event
    listContainer.querySelectorAll('.btn-delete-cal-evt').forEach(btn => {
      btn.addEventListener('click', () => {
        const evtId = btn.dataset.evtId;
        stateManager.deleteCalendarEvent(evtId);
        openDayModal(dateStr, container); // refresh view
      });
    });

    if (window.lucide) window.lucide.createIcons();
  } else {
    // If no events, jump straight to scheduling modal
    openAddEventModal(dateStr, container);
  }
}

function openAddEventModal(dateStr, container) {
  const modal = document.getElementById('calendar-event-modal');
  const activeDegree = stateManager.getActiveDegree();
  const modules = activeDegree ? activeDegree.modules : [];
  
  if (!modal) return;

  // Render subject modules custom dropdown
  const selectTrigger = document.getElementById('evt-module-select-trigger');
  const selectOptions = document.getElementById('evt-module-select-options');

  selectTrigger.dataset.value = '';
  selectTrigger.querySelector('span').textContent = '-- Select Course --';
  selectOptions.innerHTML = `
    <div class="custom-select-option" data-value="">-- Select Course --</div>
    ${modules.map(m => `<div class="custom-select-option" data-value="${m.id}">${m.name}</div>`).join('')}
  `;

  // Custom Dropdown Picker toggle
  selectTrigger.onclick = (e) => {
    e.stopPropagation();
    selectOptions.classList.toggle('hidden');
  };

  selectOptions.querySelectorAll('.custom-select-option').forEach(opt => {
    opt.onclick = (e) => {
      e.stopPropagation();
      selectTrigger.dataset.value = opt.dataset.value;
      selectTrigger.querySelector('span').textContent = opt.textContent;
      selectOptions.classList.add('hidden');
    };
  });

  document.addEventListener('click', () => {
    selectOptions.classList.add('hidden');
  });

  // Set default form inputs
  document.getElementById('evt-title-input').value = '';
  document.getElementById('evt-duration-input').value = '60';
  document.getElementById('evt-date-hidden').value = dateStr;

  // Segmented Type Selector
  let selectedType = 'self';
  const typeBtns = document.querySelectorAll('#evt-type-segmented .segment-btn');
  typeBtns.forEach(btn => {
    btn.onclick = () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.value;
    };
  });

  modal.classList.remove('hidden');

  const closeAddModal = () => {
    modal.classList.add('hidden');
    renderCalendarDays(container);
  };

  document.getElementById('btn-close-cal-modal').onclick = closeAddModal;
  document.getElementById('btn-cancel-evt').onclick = closeAddModal;

  document.getElementById('btn-save-evt').onclick = () => {
    const title = document.getElementById('evt-title-input').value.trim();
    const duration = document.getElementById('evt-duration-input').value;
    const moduleId = selectTrigger.dataset.value;

    if (title) {
      stateManager.addCalendarEvent(dateStr, title, selectedType, moduleId, duration);
      closeAddModal();
    } else {
      alert('Please fill out the session title.');
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

