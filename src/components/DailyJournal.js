// DailyJournal.js
import { stateManager, getTodayDateString } from '../state.js';

export function renderDailyJournal(container) {
  const state = stateManager.state;
  const todayStr = getTodayDateString();
  const entry = state.dailyJournal[todayStr] || { mood: 3, highlight: '', notes: '', blockers: [] };
  const loggedScreenTime = state.screenTimeLog[todayStr] || 0;

  // Gather active incomplete items (Topics and Milestones)
  const incompleteItems = [];
  
  // Collect syllabus topics
  const activeDegree = stateManager.getActiveDegree();
  if (activeDegree && activeDegree.modules) {
    activeDegree.modules.forEach(mod => {
      mod.topics.forEach(top => {
        if (!top.completed) {
          incompleteItems.push({
            id: `syllabus-${mod.id}-${top.id}`,
            type: 'Syllabus Topic',
            title: `${mod.name} -> ${top.name}`,
            originalId: top.id,
            moduleId: mod.id,
            blockerText: top.blocker || ''
          });
        }
      });
    });
  }

  // Collect goals & milestones
  state.goals.forEach(goal => {
    if (!goal.completed) {
      goal.milestones.forEach(ms => {
        if (!ms.completed) {
          incompleteItems.push({
            id: `goal-ms-${goal.id}-${ms.id}`,
            type: 'Goal Milestone',
            title: `${goal.title} -> ${ms.title}`,
            originalId: ms.id,
            goalId: goal.id,
            blockerText: '' // default empty
          });
        }
      });
    }
  });

  container.innerHTML = `
    <div class="tracker-layout">
      <!-- Left side: Mood, Screen Time, Highlights -->
      <div class="tracker-sidebar glass-card">
        <div class="card-glow"></div>
        <h3>Daily Check-In</h3>
        
        <div class="form-group">
          <label>Screen Time Today (Hours)</label>
          <div class="form-group-row">
            <input type="number" id="journal-screentime" class="glass-input" step="0.1" min="0" max="24" value="${loggedScreenTime}" placeholder="e.g. 4.5" />
            <button class="btn btn-secondary" id="btn-save-screentime">Log Hours</button>
          </div>
        </div>

        <div class="form-group">
          <label>How's your flow today? (Mood)</label>
          <div class="mood-selector" id="mood-selector">
            <button class="mood-btn ${entry.mood === 1 ? 'active' : ''}" data-mood="1" title="High Friction">😫</button>
            <button class="mood-btn ${entry.mood === 2 ? 'active' : ''}" data-mood="2" title="Distracted">🥱</button>
            <button class="mood-btn ${entry.mood === 3 ? 'active' : ''}" data-mood="3" title="Balanced">😐</button>
            <button class="mood-btn ${entry.mood === 4 ? 'active' : ''}" data-mood="4" title="Focused">🙂</button>
            <button class="mood-btn ${entry.mood === 5 ? 'active' : ''}" data-mood="5" title="Deep Flow">⚡</button>
          </div>
        </div>

        <div class="form-group">
          <label>One Sentence Highlight</label>
          <input type="text" id="journal-highlight" class="glass-input" value="${entry.highlight}" placeholder="e.g. Mastered binary tree traversals!" />
        </div>

        <div class="form-group">
          <label>General Notes / Reflection</label>
          <textarea id="journal-notes" class="glass-input textarea" placeholder="Write down any thoughts, notes, or gratitude entries...">${entry.notes}</textarea>
        </div>

        <button class="btn btn-primary w-100" id="btn-save-journal">
          <i data-lucide="save"></i> Save Reflection
        </button>
      </div>

      <!-- Right side: Log Friction points for Incomplete Tasks -->
      <div class="tracker-main glass-card">
        <div class="card-glow"></div>
        <div class="card-header">
          <h3>Friction Log (Struggling Items)</h3>
          <span class="sub-title">Did something hold you back today? Journal the blockers to review on the dashboard.</span>
        </div>

        <div class="incomplete-items-list" id="journal-incomplete-list">
          <!-- Incomplete topics list will be rendered here -->
        </div>
      </div>
    </div>
  `;

  // Bind Mood buttons
  let selectedMood = entry.mood;
  const moodBtns = container.querySelectorAll('.mood-btn');
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = parseInt(btn.dataset.mood);
    });
  });

  // Bind Screen Time Save
  const saveSTBtn = document.getElementById('btn-save-screentime');
  saveSTBtn.addEventListener('click', () => {
    const hours = parseFloat(document.getElementById('journal-screentime').value);
    if (hours >= 0 && hours <= 24) {
      stateManager.logScreenTime(todayStr, hours);
      alert('Screen time logged!');
    } else {
      alert('Please enter a valid hours count between 0 and 24.');
    }
  });

  // Bind General Journal Save
  const saveJournalBtn = document.getElementById('btn-save-journal');
  saveJournalBtn.addEventListener('click', () => {
    const highlight = document.getElementById('journal-highlight').value.trim();
    const notes = document.getElementById('journal-notes').value.trim();
    
    // Collect active blockers input fields
    const blockers = [];
    container.querySelectorAll('.blocker-input-field').forEach(input => {
      const text = input.value.trim();
      if (text) {
        blockers.push({
          itemId: input.dataset.itemId,
          taskTitle: input.dataset.itemTitle,
          text: text
        });
      }
    });

    stateManager.saveJournalEntry(todayStr, {
      mood: selectedMood,
      highlight,
      notes,
      blockers
    });

    // Also update blockers in state manager degree list
    blockers.forEach(b => {
      if (b.itemId.startsWith('syllabus-')) {
        const parts = b.itemId.split('-');
        const modId = parts[1];
        const topId = parts[2];
        stateManager.toggleTopicCompletion(modId, topId, false, b.text);
      }
    });

    alert('Daily Reflection saved successfully!');
    renderDailyJournal(container);
  });

  // Render incomplete items list
  renderIncompleteItems(incompleteItems);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderIncompleteItems(items) {
  const listEl = document.getElementById('journal-incomplete-list');
  if (!listEl) return;

  if (items.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i data-lucide="check-circle" class="empty-icon text-success"></i>
        <p>All items checked! You have zero pending tasks for today. Outstanding work!</p>
      </div>
    `;
    return;
  }

  // Pre-load blocker texts from existing daily journal if any
  const state = stateManager.state;
  const todayStr = getTodayDateString();
  const todayEntry = state.dailyJournal[todayStr] || { blockers: [] };

  listEl.innerHTML = items
    .map(item => {
      // Check if blocker was already logged today for this item
      const existingBlocker = todayEntry.blockers.find(b => b.itemId === item.id);
      const blockerVal = existingBlocker ? existingBlocker.text : item.blockerText;

      return `
      <div class="journal-blocker-item glass-card-secondary">
        <div class="item-header">
          <span class="badge badge-error font-accent">${item.type}</span>
          <h4>${item.title}</h4>
        </div>
        <div class="item-blocker-input">
          ${blockerVal ? `
            <div style="padding: 10px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--accent-emerald); border-radius: 4px; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="check-circle" class="text-success" style="width:16px; height:16px;"></i>
              <span class="font-accent text-secondary" style="font-size: 0.9rem;">${blockerVal}</span>
            </div>
            <input type="hidden" class="blocker-input-field" data-item-id="${item.id}" data-item-title="${item.title}" value="${blockerVal}" />
          ` : `
            <label class="font-accent">What blocker did you face?</label>
            <input type="text" 
                   class="glass-input blocker-input-field" 
                   data-item-id="${item.id}" 
                   data-item-title="${item.title}" 
                   value="" 
                   placeholder="e.g. Spent too much time on Instagram, or concept too confusing" />
          `}
        </div>
      </div>
    `;
    })
    .join('');
}
