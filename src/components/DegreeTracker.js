// DegreeTracker.js
import { stateManager, getTodayDateString } from '../state.js';
import { triggerConfetti } from '../utils/confetti.js';

export function renderDegreeTracker(container) {
  const state = stateManager.state;
  const activeDegree = stateManager.getActiveDegree();

  // Calculate stats
  let totalTopics = 0;
  let completedTopics = 0;
  activeDegree.modules.forEach(m => {
    totalTopics += m.topics.length;
    completedTopics += m.topics.filter(t => t.completed).length;
  });
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Calculate total study time
  let totalStudyMinutes = 0;
  activeDegree.modules.forEach(m => {
    if (m.studyLogs) {
      m.studyLogs.forEach(sl => totalStudyMinutes += sl.duration);
    }
  });
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  container.innerHTML = `
    <div class="tracker-layout">
      <!-- Left sidebar: Stats, Curriculum Manager and Admin -->
      <div class="tracker-sidebar glass-card">
        <div class="card-glow"></div>
        
        <!-- Curriculum Switcher & Management Hub -->
        <div class="degree-title-section">
          <label class="section-label">Curriculum Track</label>
          <div class="custom-select-container" id="degree-switcher-container" style="margin-top:4px;">
            <button type="button" class="glass-input custom-select-trigger" id="degree-switcher-trigger">
              <span>📚 ${activeDegree.title}</span>
              <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
            </button>
            <div class="custom-select-options hidden" id="degree-switcher-options">
              <!-- Switched options loaded dynamically -->
            </div>
          </div>

          <div class="curriculum-actions-row" style="margin-top: 8px; display: flex; gap: 4px;">
            <button class="btn btn-secondary btn-sm" id="btn-add-new-degree" title="Add Track" style="flex:1;">
              <i data-lucide="plus" style="width:14px; height:14px;"></i> New Track
            </button>
            <button class="btn btn-danger btn-sm" id="btn-delete-degree" title="Delete Active Track" style="padding:6px;">
              <i data-lucide="trash" style="width:14px; height:14px;"></i>
            </button>
          </div>

          <!-- Inline Rename Degree Title -->
          <div class="editable-title-row" style="margin-top: 10px;">
            <button class="btn btn-secondary btn-sm w-100" id="btn-edit-degree-title">
              <i data-lucide="edit-3" style="width:12px; height:12px;"></i> Rename Track
            </button>
          </div>
          <div class="edit-title-input-row hidden" id="degree-title-edit-container" style="margin-top: 6px;">
            <input type="text" id="input-degree-title" class="glass-input input-sm" value="${activeDegree.title}" />
            <button class="btn btn-primary btn-sm" id="btn-save-degree-title">Save</button>
          </div>
        </div>

        <div class="progress-visualization">
          <div class="radial-progress-container">
            <svg viewBox="0 0 100 100" class="radial-svg">
              <circle cx="50" cy="50" r="40" class="radial-bg"></circle>
              <circle cx="50" cy="50" r="40" class="radial-fill" style="stroke-dashoffset: ${251.2 - (251.2 * overallProgress) / 100}"></circle>
            </svg>
            <div class="radial-text">
              <span class="pct font-accent">${overallProgress}%</span>
              <span class="lbl">Complete</span>
            </div>
          </div>
          <p class="stats-text font-accent">${completedTopics} / ${totalTopics} Topics Mastered</p>
          <div class="total-study-pill font-accent">
            <i data-lucide="clock"></i> Studied ${totalStudyHours} hrs
          </div>
        </div>

        <!-- Overall Study Analytics: STUDY TIME BY MODULE GRAPH -->
        <div class="study-overall-analytics">
          <h3>Study Hour Allocation</h3>
          <div class="overall-study-bar-chart" id="overall-study-bar-chart">
            <!-- Custom SVG bar chart will be loaded here -->
          </div>
        </div>

        <div class="add-module-box">
          <h3>Add New Subject</h3>
          <div class="form-group-row">
            <input type="text" id="input-new-module" class="glass-input" placeholder="e.g. Operating Systems" />
            <button class="btn btn-primary" id="btn-add-module"><i data-lucide="plus"></i> Add</button>
          </div>
        </div>
        
        <hr class="modal-separator" style="margin: 16px 0;" />
        
        <!-- Exam Manager -->
        <div class="exam-manager-section">
          <h3>Manage Exams & Deadlines</h3>
          <div class="exams-list" id="sidebar-exams-list" style="margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
            <!-- Rendered exams -->
          </div>
          <div class="add-exam-form glass-card-secondary" style="padding: 10px; border-radius: 8px;">
            <input type="text" id="input-exam-title" class="glass-input input-sm mb-2" placeholder="Exam Name (e.g. JEE)" style="margin-bottom: 6px;" />
            <input type="date" id="input-exam-date" class="glass-input input-sm mb-2" style="margin-bottom: 6px;" />
            <input type="text" id="input-exam-score" class="glass-input input-sm mb-2" placeholder="Target Score (e.g. 99%)" style="margin-bottom: 6px;" />
            <button class="btn btn-primary btn-sm w-100" id="btn-add-exam"><i data-lucide="plus"></i> Add Exam</button>
          </div>
        </div>
      </div>

      <!-- Right main panel: Syllabus Tree -->
      <div class="tracker-main glass-card">
        <div class="card-glow"></div>
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3>Syllabus Breakdown</h3>
            <span class="sub-title">Log live lectures, subjects, and study hours for your track</span>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-ai-planner" style="background: var(--gradient-gold); color: #000; font-weight: 600; border: none; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);">
            ⚡ Smart Catch-Up Planner
          </button>
        </div>

        <div class="syllabus-tree" id="syllabus-tree-container">
          <!-- Syllabus modules will go here -->
        </div>
      </div>
    </div>

    <!-- Blocker Overlay Modal -->
    <div class="modal-overlay hidden" id="blocker-modal">
      <div class="glass-card modal-content">
        <div class="modal-header">
          <h3>Log Friction / Blocker</h3>
          <button class="icon-btn" id="btn-close-blocker-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <p>You unchecked this topic. What difficulties or blockers did you face? Logging this helps show obstacles on your dashboard.</p>
          <textarea id="blocker-textarea" class="glass-input textarea" placeholder="e.g. Hard to understand Dijkstra's runtime complexity, need to read CLRS book..."></textarea>
          <input type="hidden" id="blocker-topic-id" />
          <input type="hidden" id="blocker-module-id" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-skip-blocker">Skip Blocker Log</button>
          <button class="btn btn-primary" id="btn-save-blocker">Save Blocker</button>
        </div>
      </div>
    </div>

    <!-- AI Planner Overlay Modal -->
    <div class="modal-overlay hidden" id="ai-planner-modal">
      <div class="glass-card modal-content" style="max-width: 600px; width: 100%;">
        <div class="modal-header">
          <h3 class="neon-text-gold">⚡ Suggested 7-Day Catch-Up Plan</h3>
          <button class="icon-btn" id="btn-close-ai-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <p class="sub-text">Based on your incomplete syllabus topics and upcoming exams, here is an optimized daily breakdown to help you catch up:</p>
          <div id="ai-planner-results" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 8px;">
            <!-- Rendered by JS -->
          </div>
        </div>
        <div class="modal-footer" style="justify-content: flex-end;">
          <button class="btn btn-secondary" id="btn-dismiss-ai-modal">Close</button>
        </div>
      </div>
    </div>
  `;

  // 1. Setup Custom Switcher Dropdown options
  const switcherTrigger = document.getElementById('degree-switcher-trigger');
  const switcherOptions = document.getElementById('degree-switcher-options');

  switcherOptions.innerHTML = state.degrees
    .map(d => `<div class="custom-select-option" data-value="${d.id}">📚 ${d.title}</div>`)
    .join('');

  switcherTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    switcherOptions.classList.toggle('hidden');
  });

  switcherOptions.querySelectorAll('.custom-select-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      stateManager.setActiveDegree(opt.dataset.value);
      switcherOptions.classList.add('hidden');
      renderDegreeTracker(container);
    });
  });

  document.addEventListener('click', () => {
    if (switcherOptions) switcherOptions.classList.add('hidden');
  });

  // 2. Add New Curriculum Track
  document.getElementById('btn-add-new-degree').addEventListener('click', () => {
    const title = prompt('Enter Curriculum Title:');
    if (title && title.trim()) {
      stateManager.addDegree(title.trim());
      renderDegreeTracker(container);
    }
  });

  // 3. Delete Active Curriculum Track
  document.getElementById('btn-delete-degree').addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete "${activeDegree.title}" track and all its modules?`)) {
      stateManager.deleteDegree(activeDegree.id);
      renderDegreeTracker(container);
    }
  });

  // 4. Rename Active Curriculum Track
  const editTitleBtn = document.getElementById('btn-edit-degree-title');
  const saveTitleBtn = document.getElementById('btn-save-degree-title');
  const titleEditContainer = document.getElementById('degree-title-edit-container');
  const inputDegreeTitle = document.getElementById('input-degree-title');

  editTitleBtn.addEventListener('click', () => {
    editTitleBtn.classList.add('hidden');
    titleEditContainer.classList.remove('hidden');
    inputDegreeTitle.focus();
  });

  saveTitleBtn.addEventListener('click', () => {
    const newTitle = inputDegreeTitle.value.trim();
    if (newTitle) {
      stateManager.updateDegreeTitle(newTitle);
      renderDegreeTracker(container);
    }
  });

  // 5. Add Module inside Active Track
  const addModuleBtn = document.getElementById('btn-add-module');
  const inputNewModule = document.getElementById('input-new-module');

  addModuleBtn.addEventListener('click', () => {
    const modName = inputNewModule.value.trim();
    if (modName) {
      stateManager.addModule(modName);
      inputNewModule.value = '';
      renderDegreeTracker(container);
    }
  });

  inputNewModule.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addModuleBtn.click();
  });

  // 6. Manage Exams
  const examsList = document.getElementById('sidebar-exams-list');
  if (examsList) {
    examsList.innerHTML = (state.exams || []).map(exam => `
      <div class="exam-sidebar-item" style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; position: relative;">
        <div class="font-accent" style="font-weight: 600; font-size: 13px;">${exam.title}</div>
        <div class="text-muted" style="font-size: 11px;">${new Date(exam.date).toLocaleDateString()} | Target: ${exam.targetScore || 'N/A'}</div>
        <button class="icon-btn btn-delete-exam" data-exam-id="${exam.id}" style="position: absolute; right: 4px; top: 8px; width: 20px; height: 20px; padding: 2px;">
          <i data-lucide="trash" style="width: 12px; height: 12px; color: var(--danger-color);"></i>
        </button>
      </div>
    `).join('');

    document.querySelectorAll('.btn-delete-exam').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.examId;
        stateManager.deleteExam(id);
        renderDegreeTracker(container);
      });
    });
  }

  const addExamBtn = document.getElementById('btn-add-exam');
  if (addExamBtn) {
    addExamBtn.addEventListener('click', () => {
      const title = document.getElementById('input-exam-title').value.trim();
      const date = document.getElementById('input-exam-date').value;
      const score = document.getElementById('input-exam-score').value.trim();
      if (title && date) {
        stateManager.addExam(title, date, 'Competitive', score);
        renderDegreeTracker(container);
      } else {
        alert('Please provide at least a title and a date for the exam.');
      }
    });
  }

  // Render overall modules horizontal study chart
  renderOverallStudyBarChart();

  // Render tree
  renderSyllabusTree(container);

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderOverallStudyBarChart() {
  const chartEl = document.getElementById('overall-study-bar-chart');
  if (!chartEl) return;

  const state = stateManager.state;
  const activeDegree = stateManager.getActiveDegree();
  const modules = activeDegree.modules;

  if (modules.length === 0) {
    chartEl.innerHTML = `<p class="stats-mini-desc">No modules added yet.</p>`;
    return;
  }

  // Calculate study hours per module
  const allocation = modules.map(m => {
    let minutes = 0;
    if (m.studyLogs) {
      m.studyLogs.forEach(sl => minutes += sl.duration);
    }
    return {
      name: m.name,
      hours: minutes / 60
    };
  });

  const maxHours = Math.max(...allocation.map(a => a.hours), 1);

  chartEl.innerHTML = allocation.map(a => {
    const pct = (a.hours / maxHours) * 100;
    return `
      <div class="study-alloc-bar-item">
        <div class="bar-lbl-row font-accent">
          <span class="lbl-name truncate">${a.name}</span>
          <span class="lbl-hours">${a.hours.toFixed(1)}h</span>
        </div>
        <div class="alloc-bar-track">
          <div class="alloc-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

const activeModuleTabs = {};

function renderSyllabusTree(container) {
  const treeContainer = document.getElementById('syllabus-tree-container');
  if (!treeContainer) return;

  const activeDegree = stateManager.getActiveDegree();
  const modules = activeDegree.modules;

  if (modules.length === 0) {
    treeContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="book-open" class="empty-icon"></i>
        <p>No modules created yet. Add your first study module using the panel on the left!</p>
      </div>
    `;
    return;
  }

  treeContainer.innerHTML = modules
    .map(mod => {
      const total = mod.topics.length;
      const completed = mod.topics.filter(t => t.completed).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      const activeTab = activeModuleTabs[mod.id] || 'topics';

      let studyMins = 0;
      if (mod.studyLogs) {
        mod.studyLogs.forEach(sl => studyMins += sl.duration);
      }
      const studyHrs = (studyMins / 60).toFixed(1);
      const lecturesCount = mod.lectures ? mod.lectures.length : 0;

      return `
      <div class="syllabus-module glass-card-secondary" data-module-id="${mod.id}">
        <div class="module-header">
          <div class="module-info-col">
            <div class="module-title-row">
              <h4 class="module-title" id="title-text-${mod.id}">${mod.name}</h4>
              <input type="text" id="rename-input-${mod.id}" class="glass-input rename-input hidden" value="${mod.name}" />
              <button class="icon-btn btn-rename-module" data-module-id="${mod.id}"><i data-lucide="edit-2"></i></button>
            </div>
            <div class="module-progress-bar">
              <div class="progress-track"><div class="progress-fill" style="width: ${progress}%"></div></div>
              <span class="progress-label font-accent">${progress}% Syllabus</span>
              <span class="study-stats-label font-accent">
                <i data-lucide="book-open"></i> ${studyHrs}h Study | ${lecturesCount} Lectures
              </span>
            </div>
          </div>
          <div class="module-actions">
            <button class="btn btn-secondary btn-sm btn-delete-module" data-module-id="${mod.id}"><i data-lucide="trash-2"></i> Delete</button>
          </div>
        </div>

        <div class="module-subtabs">
          <button class="subtab-btn ${activeTab === 'topics' ? 'active' : ''}" data-module-id="${mod.id}" data-tab="topics">Syllabus Tree</button>
          <button class="subtab-btn ${activeTab === 'lectures' ? 'active' : ''}" data-module-id="${mod.id}" data-tab="lectures">Lecture Journal</button>
          <button class="subtab-btn ${activeTab === 'logs' ? 'active' : ''}" data-module-id="${mod.id}" data-tab="logs">Study Sessions</button>
        </div>

        <div class="module-tab-content-container">
          <!-- SUBTAB CONTENT 1: TOPICS -->
          <div class="subtab-content ${activeTab === 'topics' ? '' : 'hidden'}" id="tab-topics-${mod.id}">
            <div class="topics-list" id="topics-list-${mod.id}">
              ${mod.topics
                .map(
                  top => `
                <div class="topic-item ${top.completed ? 'completed' : ''} ${top.blocker ? 'has-blocker' : ''}" data-topic-id="${top.id}">
                  <div class="topic-checkbox-row">
                    <input type="checkbox" id="chk-${top.id}" data-topic-id="${top.id}" data-module-id="${mod.id}" class="custom-checkbox" ${top.completed ? 'checked' : ''} />
                    <label for="chk-${top.id}" class="topic-label" id="lbl-text-${top.id}">${top.name}</label>
                    <input type="text" id="rename-top-input-${top.id}" class="glass-input rename-input hidden" value="${top.name}" />
                  </div>
                  
                  <div class="topic-actions">
                    ${top.blocker ? `<span class="blocker-tag" title="Friction: ${top.blocker}"><i data-lucide="alert-triangle"></i> Friction</span>` : ''}
                    <button class="icon-btn btn-rename-topic" data-module-id="${mod.id}" data-topic-id="${top.id}"><i data-lucide="edit-3"></i></button>
                    <button class="icon-btn btn-delete-topic" data-module-id="${mod.id}" data-topic-id="${top.id}"><i data-lucide="x"></i></button>
                  </div>
                </div>
              `
                )
                .join('')}
              
              <!-- Inline topic addition -->
              <div class="add-topic-inline">
                <input type="text" id="input-new-topic-${mod.id}" class="glass-input input-sm" placeholder="+ Add a topic (e.g. Sorting Algorithms)" />
                <button class="btn btn-primary btn-sm btn-add-topic" data-module-id="${mod.id}"><i data-lucide="plus"></i> Add</button>
              </div>
            </div>
          </div>

          <!-- SUBTAB CONTENT 2: LECTURES -->
          <div class="subtab-content ${activeTab === 'lectures' ? '' : 'hidden'}" id="tab-lectures-${mod.id}">
            <!-- Add Lecture Form -->
            <div class="add-lecture-card glass-card-secondary" style="margin-bottom: 12px;">
              <h5>Log Live Lecture Details</h5>
              <div class="form-grid-study">
                <input type="text" id="lec-topic-input-${mod.id}" class="glass-input input-sm" placeholder="Lecture Topic (e.g., Red-Black Trees)" />
                <input type="text" id="lec-prof-input-${mod.id}" class="glass-input input-sm" placeholder="Lecturer" />
                <input type="date" id="lec-date-input-${mod.id}" class="glass-input input-sm" title="Log Date" />
              </div>
              <textarea id="lec-takeaways-input-${mod.id}" class="glass-input textarea input-sm" placeholder="Key Takeaways..." style="margin: 6px 0; min-height: 40px;"></textarea>
              <textarea id="lec-notes-input-${mod.id}" class="glass-input textarea input-sm" placeholder="General Notes..." style="margin-bottom: 8px; min-height: 40px;"></textarea>
              <button class="btn btn-primary btn-sm btn-add-lec" data-module-id="${mod.id}">Log Lecture</button>
            </div>

            <div class="lecture-list">
              ${(mod.lectures || []).map(lec => `
                <div class="lecture-log-item glass-card-secondary">
                  <div class="lec-log-header">
                    <span class="lec-date font-accent">${lec.date}</span>
                    <button class="icon-btn btn-delete-lec" data-module-id="${mod.id}" data-lec-id="${lec.id}"><i data-lucide="x"></i></button>
                  </div>
                  <h4>${lec.topic}</h4>
                  <p class="lec-meta font-accent">Lecturer: ${lec.lecturer || 'Professor'}</p>
                  <p class="lec-content"><strong>Takeaway:</strong> ${lec.keyTakeaways}</p>
                  ${lec.notes ? `<p class="lec-content text-muted"><strong>Notes:</strong> ${lec.notes}</p>` : ''}
                </div>
              `).join('')}
              ${(!mod.lectures || mod.lectures.length === 0) ? '<p class="empty-text font-accent">No lectures logged for this module.</p>' : ''}
            </div>
          </div>

          <!-- SUBTAB CONTENT 3: SELF STUDY SESSIONS -->
          <div class="subtab-content ${activeTab === 'logs' ? '' : 'hidden'}" id="tab-logs-${mod.id}">
            <!-- Add Study Session Form -->
            <div class="add-study-card glass-card-secondary" style="margin-bottom: 12px;">
              <h5>Log Study Session</h5>
              <div class="form-grid-study">
                <input type="number" id="study-dur-input-${mod.id}" class="glass-input input-sm" placeholder="Duration (mins)" />
                <input type="text" id="study-notes-input-${mod.id}" class="glass-input input-sm" placeholder="What did you study?" />
                <input type="date" id="study-date-input-${mod.id}" class="glass-input input-sm" title="Session Date" />
              </div>
              <button class="btn btn-primary btn-sm btn-add-study-log" data-module-id="${mod.id}" style="margin-top:8px;">Log Session</button>
            </div>

            <div class="study-logs-list">
              ${(mod.studyLogs || []).map(log => `
                <div class="study-log-item glass-card-secondary">
                  <div class="lec-log-header">
                    <span class="lec-date font-accent">${log.date}</span>
                    <span class="study-duration badge badge-error font-accent">${log.duration} mins</span>
                    <button class="icon-btn btn-delete-study-log" data-module-id="${mod.id}" data-log-id="${log.id}"><i data-lucide="x"></i></button>
                  </div>
                  <p class="lec-content font-accent" style="margin-top: 4px;">${log.notes}</p>
                </div>
              `).join('')}
              ${(!mod.studyLogs || mod.studyLogs.length === 0) ? '<p class="empty-text font-accent">No study logs completed.</p>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  // Wire events for modules & topics
  setupTreeEventHandlers(container);
}

function setupTreeEventHandlers(container) {
  const activeDegree = stateManager.getActiveDegree();
  const todayStr = getTodayDateString();

  container.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const tabName = btn.dataset.tab;
      activeModuleTabs[modId] = tabName;
      renderDegreeTracker(container);
    });
  });

  // Rename Module
  container.querySelectorAll('.btn-rename-module').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const titleText = document.getElementById(`title-text-${modId}`);
      const renameInput = document.getElementById(`rename-input-${modId}`);
      
      if (renameInput.classList.contains('hidden')) {
        titleText.classList.add('hidden');
        renameInput.classList.remove('hidden');
        renameInput.focus();
        btn.innerHTML = `<i data-lucide="check"></i>`;
        if (window.lucide) window.lucide.createIcons();
      } else {
        const newName = renameInput.value.trim();
        if (newName) {
          stateManager.editModule(modId, newName);
          titleText.textContent = newName;
        }
        titleText.classList.remove('hidden');
        renameInput.classList.add('hidden');
        btn.innerHTML = `<i data-lucide="edit-2"></i>`;
        if (window.lucide) window.lucide.createIcons();
        renderDegreeTracker(container);
      }
    });
  });

  // Delete Module
  container.querySelectorAll('.btn-delete-module').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this module?')) {
        const modId = btn.dataset.moduleId;
        stateManager.deleteModule(modId);
        renderDegreeTracker(container);
      }
    });
  });

  // Add Topic
  container.querySelectorAll('.btn-add-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const input = document.getElementById(`input-new-topic-${modId}`);
      const topicName = input.value.trim();
      if (topicName) {
        stateManager.addTopic(modId, topicName);
        input.value = '';
        renderDegreeTracker(container);
      }
    });
  });

  // Allow enter key to trigger Add Topic
  container.querySelectorAll('.add-topic-inline input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const modId = input.id.replace('input-new-topic-', '');
        const btn = input.nextElementSibling;
        btn.click();
      }
    });
  });

  // Topic Checkboxes
  container.querySelectorAll('.custom-checkbox').forEach(chk => {
    chk.addEventListener('change', () => {
      const topicId = chk.dataset.topicId;
      const modId = chk.dataset.moduleId;
      const isChecked = chk.checked;

      if (isChecked) {
        stateManager.toggleTopicCompletion(modId, topicId, true);
        stateManager.incrementDailyTaskCount(todayStr);
        triggerConfetti();
        renderDegreeTracker(container);
      } else {
        openBlockerModal(modId, topicId, container);
      }
    });
  });

  // Rename Topic
  container.querySelectorAll('.btn-rename-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const topicId = btn.dataset.topicId;
      const lblText = document.getElementById(`lbl-text-${topicId}`);
      const renameInput = document.getElementById(`rename-top-input-${topicId}`);

      if (renameInput.classList.contains('hidden')) {
        lblText.classList.add('hidden');
        renameInput.classList.remove('hidden');
        renameInput.focus();
        btn.innerHTML = `<i data-lucide="check"></i>`;
        if (window.lucide) window.lucide.createIcons();
      } else {
        const newName = renameInput.value.trim();
        if (newName) {
          stateManager.editTopic(modId, topicId, newName);
          lblText.textContent = newName;
        }
        lblText.classList.remove('hidden');
        renameInput.classList.add('hidden');
        btn.innerHTML = `<i data-lucide="edit-3"></i>`;
        if (window.lucide) window.lucide.createIcons();
        renderDegreeTracker(container);
      }
    });
  });

  // Delete Topic
  container.querySelectorAll('.btn-delete-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const topicId = btn.dataset.topicId;
      if (confirm('Are you sure you want to delete this topic?')) {
        stateManager.deleteTopic(modId, topicId);
        renderDegreeTracker(container);
      }
    });
  });

  // Log Lecture
  container.querySelectorAll('.btn-add-lec').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const topic = document.getElementById(`lec-topic-input-${modId}`).value.trim();
      const prof = document.getElementById(`lec-prof-input-${modId}`).value.trim();
      const takeaways = document.getElementById(`lec-takeaways-input-${modId}`).value.trim();
      const notes = document.getElementById(`lec-notes-input-${modId}`).value.trim();
      let dateValue = document.getElementById(`lec-date-input-${modId}`).value;
      if (!dateValue) dateValue = undefined;

      if (topic && takeaways) {
        stateManager.addLecture(modId, topic, prof, takeaways, notes, dateValue);
        renderDegreeTracker(container);
      } else {
        alert('Please fill out the lecture topic and key takeaways.');
      }
    });
  });

  // Delete Lecture
  container.querySelectorAll('.btn-delete-lec').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const lecId = btn.dataset.lecId;
      stateManager.deleteLecture(modId, lecId);
      renderDegreeTracker(container);
    });
  });

  // Log Study Session
  container.querySelectorAll('.btn-add-study-log').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const dur = parseFloat(document.getElementById(`study-dur-input-${modId}`).value);
      const notes = document.getElementById(`study-notes-input-${modId}`).value.trim();
      let dateValue = document.getElementById(`study-date-input-${modId}`).value;
      if (!dateValue) dateValue = undefined;

      if (dur > 0 && notes) {
        stateManager.addStudyLog(modId, dur, notes, dateValue);
        renderDegreeTracker(container);
      } else {
        alert('Please fill out study duration and description.');
      }
    });
  });

  // Delete Study Session
  container.querySelectorAll('.btn-delete-study-log').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.dataset.moduleId;
      const logId = btn.dataset.logId;
      stateManager.deleteStudyLog(modId, logId);
      renderDegreeTracker(container);
    });
  });

  // --- AI Catch-Up Planner Logic ---
  const aiBtn = document.getElementById('btn-ai-planner');
  const aiModal = document.getElementById('ai-planner-modal');
  if (aiBtn && aiModal) {
    aiBtn.addEventListener('click', () => {
      const resultsContainer = document.getElementById('ai-planner-results');
      
      // Collect all incomplete topics
      let incompleteTopics = [];
      activeDegree.modules.forEach(m => {
        m.topics.forEach(t => {
          if (!t.completed) {
            incompleteTopics.push({ moduleTitle: m.title, topicTitle: t.title });
          }
        });
      });

      if (incompleteTopics.length === 0) {
        resultsContainer.innerHTML = `<div class="glass-card" style="padding: 1rem; text-align: center;"><p class="text-success" style="font-weight: 600;">🎉 You are completely caught up! No backlogs found.</p></div>`;
      } else {
        // Distribute topics over 7 days using a simple heuristic
        const days = ['Day 1 (Tomorrow)', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
        const plan = days.map(() => []);
        
        incompleteTopics.forEach((topic, i) => {
          plan[i % 7].push(topic);
        });

        resultsContainer.innerHTML = plan.map((dayPlan, i) => {
          if (dayPlan.length === 0) return '';
          return `
            <div class="glass-card-secondary" style="padding: 12px; border-radius: 8px;">
              <h4 class="font-accent" style="margin-bottom: 8px; color: var(--accent-gold);">${days[i]}</h4>
              <ul style="list-style: none; padding-left: 0; margin: 0; display: flex; flex-direction: column; gap: 4px;">
                ${dayPlan.map(t => `<li style="font-size: 0.9rem;"><span class="badge" style="font-size: 0.7rem; margin-right: 6px;">${t.moduleTitle}</span> ${t.topicTitle}</li>`).join('')}
              </ul>
            </div>
          `;
        }).join('');
      }

      aiModal.classList.remove('hidden');
    });

    document.getElementById('btn-close-ai-modal').addEventListener('click', () => {
      aiModal.classList.add('hidden');
    });
    document.getElementById('btn-dismiss-ai-modal').addEventListener('click', () => {
      aiModal.classList.add('hidden');
    });
  }
}


function openBlockerModal(modId, topicId, container) {
  const modal = document.getElementById('blocker-modal');
  const txtarea = document.getElementById('blocker-textarea');
  const inputTopicId = document.getElementById('blocker-topic-id');
  const inputModuleId = document.getElementById('blocker-module-id');

  if (!modal) return;

  txtarea.value = '';
  inputTopicId.value = topicId;
  inputModuleId.value = modId;

  modal.classList.remove('hidden');

  const closeModal = () => {
    modal.classList.add('hidden');
    renderDegreeTracker(container);
  };

  document.getElementById('btn-close-blocker-modal').onclick = closeModal;
  
  document.getElementById('btn-skip-blocker').onclick = () => {
    stateManager.toggleTopicCompletion(modId, topicId, false, '');
    stateManager.decrementDailyTaskCount(getTodayDateString());
    closeModal();
  };

  document.getElementById('btn-save-blocker').onclick = () => {
    const text = txtarea.value.trim();
    stateManager.toggleTopicCompletion(modId, topicId, false, text);
    stateManager.decrementDailyTaskCount(getTodayDateString());
    closeModal();
  };
}
