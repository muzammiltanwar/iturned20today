// ContributionGraph.js
import { stateManager, getTodayDateString, formatCurrency } from '../state.js';

export function renderDashboard(container) {
  const state = stateManager.state;
  const todayStr = getTodayDateString();

  // 1. Calculate Countdown & Progresses
  const now = new Date();
  const currentYear = now.getFullYear();
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  // Life progress (e.g. current decade progress)
  const birth = new Date(state.birthDate);
  const ageMs = now - birth;
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  const currentDecadeStart = Math.floor(ageYears / 10) * 10;
  const nextDecadeStart = currentDecadeStart + 10;
  
  const decadeStartBirth = new Date(birth.getFullYear() + currentDecadeStart, birth.getMonth(), birth.getDate());
  const decadeEndBirth = new Date(birth.getFullYear() + nextDecadeStart, birth.getMonth(), birth.getDate());
  const totalDecadeDays = (decadeEndBirth - decadeStartBirth) / (1000 * 60 * 60 * 24);
  const elapsedDecadeDays = (now - decadeStartBirth) / (1000 * 60 * 60 * 24);
  const decadeProgressPct = Math.min(100, Math.max(0, (elapsedDecadeDays / totalDecadeDays) * 100));

  // Year Progress
  const startOfYearDate = new Date(currentYear, 0, 1);
  const totalYearMs = endOfYear - startOfYearDate;
  const elapsedYearMs = now - startOfYearDate;
  const yearProgressPct = Math.min(100, Math.max(0, (elapsedYearMs / totalYearMs) * 100));

  // 2. Additional calculations for stats
  const last14DaysKeys = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    last14DaysKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  
  const screenTimes = last14DaysKeys.map(k => state.screenTimeLog[k] || 0);
  const avgScreenTime = screenTimes.reduce((a, b) => a + b, 0) / 14;

  const flowScores = last14DaysKeys.map(k => (state.history && state.history[k] ? state.history[k].score : 0));
  const avgFlowScore = flowScores.reduce((a, b) => a + b, 0) / 14;

  // Total topics completed
  let totalDegreeMastered = 0;
  let totalDegreeTopics = 0;
  const activeDegree = stateManager.getActiveDegree();
  if (activeDegree && activeDegree.modules) {
    activeDegree.modules.forEach(m => {
      totalDegreeTopics += m.topics.length;
      totalDegreeMastered += m.topics.filter(t => t.completed).length;
    });
  }

  // Goals and milestones completed
  let totalMilestonesMastered = 0;
  let totalMilestones = 0;
  state.goals.forEach(g => {
    totalMilestones += g.milestones.length;
    totalMilestonesMastered += g.milestones.filter(m => m.completed).length;
  });

  const overallMastery = totalDegreeMastered + totalMilestonesMastered;

  // Monthly Budget utilization
  let totalExpense = 0;
  state.finances.transactions.forEach(t => {
    if (t.type === 'expense') totalExpense += t.amount;
  });
  const budgetRatio = state.monthlyBudget > 0 ? (totalExpense / state.monthlyBudget) * 100 : 0;

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Section 1: Hero Countdown & Progress -->
      <div class="glass-card hero-countdown-card">
        <div class="card-glow"></div>
        <div class="hero-header">
          <h2>Time Remaining in ${currentYear}</h2>
          <span class="badge neon-text-gold">${Math.round(100 - yearProgressPct)}% left</span>
        </div>
        
        <div class="countdown-timer" id="countdown-timer">
          <div class="time-block"><span class="time-num" id="cd-days">00</span><span class="time-label">Days</span></div>
          <div class="time-divider">:</div>
          <div class="time-block"><span class="time-num" id="cd-hours">00</span><span class="time-label">Hours</span></div>
          <div class="time-divider">:</div>
          <div class="time-block"><span class="time-num" id="cd-mins">00</span><span class="time-label">Mins</span></div>
          <div class="time-divider">:</div>
          <div class="time-block"><span class="time-num" id="cd-secs">00</span><span class="time-label">Secs</span></div>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span>Decade Progress (Age ${currentDecadeStart} to ${nextDecadeStart})</span>
            <span class="progress-val font-accent">${decadeProgressPct.toFixed(4)}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${decadeProgressPct}%"></div>
          </div>
          <p class="progress-subtext">You are currently <strong>${ageYears.toFixed(2)}</strong> years old. Make every day count.</p>
        </div>
      </div>

      <!-- Section 1.5: Quick Statistics Hub -->
      <div class="stats-hub-row">
        <div class="glass-card stats-card-mini">
          <div class="stats-mini-label">14-Day Flow Index</div>
          <div class="stats-mini-value text-success">${avgFlowScore.toFixed(1)} <span class="lbl-small">/ 5</span></div>
          <p class="stats-mini-desc">Average daily flow score</p>
        </div>
        <div class="glass-card stats-card-mini">
          <div class="stats-mini-label">Avg Screen Time</div>
          <div class="stats-mini-value text-warning">${avgScreenTime.toFixed(1)}h <span class="lbl-small">/ day</span></div>
          <p class="stats-mini-desc">Last 14 days logged</p>
        </div>
        <div class="glass-card stats-card-mini">
          <div class="stats-mini-label">Total Masteries</div>
          <div class="stats-mini-value text-success">${overallMastery} <span class="lbl-small">completed</span></div>
          <p class="stats-mini-desc">Topics & milestones ticked</p>
        </div>
        <div class="glass-card stats-card-mini">
          <div class="stats-mini-label">Budget Utilized</div>
          <div class="stats-mini-value ${budgetRatio > 90 ? 'text-danger' : 'text-warning'}">${budgetRatio.toFixed(0)}%</div>
          <p class="stats-mini-desc">${formatCurrency(Math.round(totalExpense))} of ${formatCurrency(Math.round(state.monthlyBudget))} spent</p>
        </div>
      </div>

      <!-- Section 2: Contribution Graph -->
      <div class="glass-card contribution-card">
        <div class="card-glow"></div>
        <div class="card-header">
          <h3>Contribution Repo: My Life [${currentYear}]</h3>
          <div class="graph-legend">
            <span>Friction</span>
            <div class="legend-box level-0"></div>
            <div class="legend-box level-1"></div>
            <div class="legend-box level-2"></div>
            <div class="legend-box level-3"></div>
            <div class="legend-box level-4"></div>
            <div class="legend-box level-5"></div>
            <span>Flow</span>
          </div>
        </div>
        
        <div class="graph-container-wrapper">
          <div class="graph-months-row" id="graph-months-row"></div>
          <div class="graph-grid-body">
            <div class="graph-days-labels">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            <div class="contribution-graph" id="contribution-graph-grid"></div>
          </div>
        </div>
        <div class="graph-tooltip" id="graph-tooltip">Hover over a square to view details.</div>
      </div>

      <!-- Section 3: Screen Time vs Productivity -->
      <div class="glass-card chart-card">
        <div class="card-glow"></div>
        <div class="card-header">
          <h3>Screen Time vs. Productivity</h3>
          <span class="sub-title">14-Day Correlation Index</span>
        </div>
        <div class="chart-content" id="chart-correlation-container">
          <!-- SVG Chart will be injected here -->
        </div>
      </div>

      <!-- Section 4: Friction & Blocker Feed -->
      <div class="glass-card blocker-card">
        <div class="card-glow"></div>
        <div class="card-header">
          <h3>Friction Logs & Obstacles</h3>
          <span class="badge badge-error">Struggle Feed</span>
        </div>
        <div class="blocker-feed-list" id="blocker-feed-list">
          <!-- Blockers list will be injected here -->
        </div>
      </div>
    </div>
  `;

  // Start the ticking countdown timer
  setupCountdownTimer(endOfYear);

  // Render Git Contribution Graph
  renderGitGraph(currentYear);

  // Render Screen Time vs Productivity correlation chart
  renderCorrelationChart();

  // Render Blocker Feed
  renderBlockerFeed();
}

function setupCountdownTimer(endTime) {
  function updateTimer() {
    const now = new Date();
    const timeDiff = endTime - now;

    if (timeDiff <= 0) {
      const timerContainer = document.getElementById('countdown-timer');
      if (timerContainer) timerContainer.innerHTML = `<h3 class="neon-text-gold">Happy New Year!</h3>`;
      return;
    }

    const seconds = Math.floor((timeDiff / 1000) % 60);
    const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMins = document.getElementById('cd-mins');
    const cdSecs = document.getElementById('cd-secs');

    if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
    if (cdMins) cdMins.textContent = String(minutes).padStart(2, '0');
    if (cdSecs) cdSecs.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  const interval = setInterval(() => {
    // Break loop if element is not in DOM anymore
    if (!document.getElementById('countdown-timer')) {
      clearInterval(interval);
      return;
    }
    updateTimer();
  }, 1000);
}

function renderGitGraph(year) {
  const grid = document.getElementById('contribution-graph-grid');
  const monthsRow = document.getElementById('graph-months-row');
  const tooltip = document.getElementById('graph-tooltip');
  
  if (!grid) return;

  const state = stateManager.state;
  grid.innerHTML = '';
  monthsRow.innerHTML = '';

  // Get date helper
  const startDate = new Date(year, 0, 1);
  const startDayOfWeek = startDate.getDay(); // 0 is Sunday, 1 is Monday...
  
  const daysOffset = startDayOfWeek; 
  const totalDaysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

  const todayStr = getTodayDateString();
  const today = new Date(todayStr);

  // Month labels setup
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentMonthIndex = -1;

  // Render empty cells for days offset before Jan 1st
  for (let i = 0; i < daysOffset; i++) {
    const placeholder = document.createElement('div');
    placeholder.className = 'graph-cell placeholder-cell';
    grid.appendChild(placeholder);
  }

  // Render actual days
  for (let dayIndex = 0; dayIndex < totalDaysInYear; dayIndex++) {
    const currentDay = new Date(year, 0, dayIndex + 1);
    const month = currentDay.getMonth();
    const dateStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
    
    // Add month headers
    if (month !== currentMonthIndex) {
      currentMonthIndex = month;
      const monthLabel = document.createElement('div');
      monthLabel.className = 'month-label';
      monthLabel.textContent = months[month];
      // Roughly position month label in line with cell indexes (7 rows per column)
      const colIndex = Math.floor((dayIndex + daysOffset) / 7);
      monthLabel.style.gridColumnStart = colIndex + 2; // +1 index offset, +1 for labels
      monthsRow.appendChild(monthLabel);
    }

    const cell = document.createElement('div');
    cell.className = 'graph-cell';
    
    // Check if cell is in the future
    const isFuture = currentDay > today;
    const isToday = dateStr === todayStr;

    if (isToday) {
      cell.classList.add('today-cell');
    }

    if (isFuture) {
      cell.classList.add('future-cell');
    } else {
      // Find productivity level
      const historyData = state.history && state.history[dateStr];
      const level = historyData ? historyData.score : 0;
      cell.classList.add(`level-${level}`);
      
      // Hover event
      cell.addEventListener('mouseover', (e) => {
        const completed = historyData ? historyData.tasksCompleted : 0;
        const screenTime = state.screenTimeLog[dateStr] || 0;
        const journal = state.dailyJournal[dateStr];
        
        let infoText = `<strong>${currentDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong><br/>`;
        infoText += `Score: ${level}/5 (${completed} activity pts)<br/>`;
        infoText += `Screen Time: ${screenTime}h`;
        
        if (journal && journal.highlight) {
          infoText += `<br/>Highlight: "<em>${journal.highlight}</em>"`;
        }

        tooltip.innerHTML = infoText;
        tooltip.classList.add('visible');
      });

      cell.addEventListener('mouseout', () => {
        tooltip.classList.remove('visible');
        tooltip.textContent = 'Hover over a square to view details.';
      });
    }

    grid.appendChild(cell);
  }
}

function renderCorrelationChart() {
  const chartContainer = document.getElementById('chart-correlation-container');
  if (!chartContainer) return;

  const state = stateManager.state;
  
  // Gather last 14 days
  const data = [];
  const now = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const screenTime = state.screenTimeLog[dateStr] || 0;
    const historyData = state.history && state.history[dateStr];
    const prodScore = historyData ? historyData.score : 0;
    const completed = historyData ? historyData.tasksCompleted : 0;
    
    data.push({
      dateStr,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      screenTime,
      prodScore,
      completed
    });
  }

  // Draw Custom SVG
  const width = 500;
  const height = 180;
  const paddingLeft = 35;
  const paddingRight = 35;
  const paddingTop = 15;
  const paddingBottom = 25;
  
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  
  // Scales
  const maxScreenTime = Math.max(...data.map(d => d.screenTime), 4); // Min 4h scale
  const maxProdScore = 5;

  const pointsScreenTime = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartW;
    const y = paddingTop + chartH - (d.screenTime / maxScreenTime) * chartH;
    return { x, y };
  });

  const pointsProdScore = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartW;
    const y = paddingTop + chartH - (d.prodScore / maxProdScore) * chartH;
    return { x, y };
  });

  let svgContent = `
    <svg viewBox="0 0 ${width} ${height}" class="correlation-svg" id="correlation-svg-element" width="100%" height="100%" style="overflow: visible;">
      <defs>
        <linearGradient id="gradient-screentime" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.25"></stop>
          <stop offset="100%" stop-color="#00f2fe" stop-opacity="0"></stop>
        </linearGradient>
        <linearGradient id="gradient-prod" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"></stop>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0"></stop>
        </linearGradient>
        <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <!-- Grid Lines -->
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" stroke="rgba(255,255,255,0.05)" />
      <line x1="${paddingLeft}" y1="${paddingTop + chartH/2}" x2="${width - paddingRight}" y2="${paddingTop + chartH/2}" stroke="rgba(255,255,255,0.05)" />
      <line x1="${paddingLeft}" y1="${paddingTop + chartH}" x2="${width - paddingRight}" y2="${paddingTop + chartH}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      
      <!-- Screen Time Area & Line -->
      <path d="M ${paddingLeft},${paddingTop + chartH} L ${pointsScreenTime.map(p => `${p.x},${p.y}`).join(' L ')} L ${width - paddingRight},${paddingTop + chartH} Z" fill="url(#gradient-screentime)" />
      <path d="M ${pointsScreenTime.map(p => `${p.x},${p.y}`).join(' L ')}" fill="none" stroke="#00f2fe" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Productivity Area & Line -->
      <path d="M ${paddingLeft},${paddingTop + chartH} L ${pointsProdScore.map(p => `${p.x},${p.y}`).join(' L ')} L ${width - paddingRight},${paddingTop + chartH} Z" fill="url(#gradient-prod)" />
      <path d="M ${pointsProdScore.map(p => `${p.x},${p.y}`).join(' L ')}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Interactive Guides (Hidden by default) -->
      <line id="interactive-vline" x1="0" y1="${paddingTop}" x2="0" y2="${paddingTop + chartH}" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3,3" class="hidden" />
      <circle id="interactive-circle-st" cx="0" cy="0" r="5" fill="#00f2fe" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" class="hidden" filter="url(#glow-effect)" />
      <circle id="interactive-circle-pr" cx="0" cy="0" r="5" fill="#10b981" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" class="hidden" filter="url(#glow-effect)" />

      <!-- Markers -->
  `;

  // Draw point markers
  data.forEach((d, index) => {
    const pSt = pointsScreenTime[index];
    const pPr = pointsProdScore[index];

    svgContent += `
      <circle cx="${pSt.x}" cy="${pSt.y}" r="3" fill="#00f2fe" />
      <circle cx="${pPr.x}" cy="${pPr.y}" r="3" fill="#10b981" />
    `;

    // Date X Labels on bottom (draw every 3 days to avoid crowding)
    if (index % 3 === 0 || index === data.length - 1) {
      svgContent += `
        <text x="${pSt.x}" y="${height - 6}" font-size="9" fill="rgba(255,255,255,0.4)" text-anchor="middle" font-family="var(--font-accent)">${d.label}</text>
      `;
    }
  });

  // Left Y-Axis Label (Screen Time)
  svgContent += `
    <text x="5" y="${paddingTop + 5}" font-size="8" fill="#00f2fe" font-family="var(--font-accent)">Screen Time (Max: ${maxScreenTime.toFixed(1)}h)</text>
    <!-- Right Y-Axis Label (Productivity) -->
    <text x="${width - 5}" y="${paddingTop + 5}" font-size="8" fill="#10b981" text-anchor="end" font-family="var(--font-accent)">Flow Score (0-5)</text>
    
    <!-- Hover overlay rect for capture -->
    <rect id="chart-hover-overlay" x="${paddingLeft}" y="${paddingTop}" width="${chartW}" height="${chartH}" fill="transparent" style="cursor: crosshair;" />
    </svg>
  `;

  // Insert Chart legend & tooltip frame
  chartContainer.innerHTML = `
    <div class="chart-legend-row">
      <span class="legend-item"><span class="legend-color" style="background: #00f2fe"></span>Screen Time (Hours)</span>
      <span class="legend-item"><span class="legend-color" style="background: #10b981"></span>Productivity Score</span>
    </div>
    <div class="svg-container" style="position: relative;">
      ${svgContent}
      <div id="chart-interactive-tooltip" class="chart-hover-tooltip hidden"></div>
    </div>
  `;

  // Wire interactive mouse move logic
  const overlay = document.getElementById('chart-hover-overlay');
  const vline = document.getElementById('interactive-vline');
  const circST = document.getElementById('interactive-circle-st');
  const circPR = document.getElementById('interactive-circle-pr');
  const chartTooltip = document.getElementById('chart-interactive-tooltip');

  if (overlay) {
    overlay.addEventListener('mousemove', (e) => {
      const rect = e.target.getBoundingClientRect();
      const mouseX = e.clientX - rect.left; // x position within the element.
      const mousePercent = mouseX / rect.width;
      
      // Map to data index
      const dataIndex = Math.round(mousePercent * (data.length - 1));
      const targetPointST = pointsScreenTime[dataIndex];
      const targetPointPR = pointsProdScore[dataIndex];
      const d = data[dataIndex];

      if (targetPointST && targetPointPR) {
        // Move vertical line & circles
        vline.setAttribute('x1', targetPointST.x);
        vline.setAttribute('x2', targetPointST.x);
        vline.classList.remove('hidden');

        circST.setAttribute('cx', targetPointST.x);
        circST.setAttribute('cy', targetPointST.y);
        circST.classList.remove('hidden');

        circPR.setAttribute('cx', targetPointPR.x);
        circPR.setAttribute('cy', targetPointPR.y);
        circPR.classList.remove('hidden');

        // Formulate tooltip text
        let correlationMsg = '';
        if (d.screenTime > 5 && d.prodScore < 3) {
          correlationMsg = `<span class="correlation-alert text-danger"><i data-lucide="alert-triangle"></i> Heavy Screen Time. Focus compromised.</span>`;
        } else if (d.screenTime <= 3 && d.prodScore >= 4) {
          correlationMsg = `<span class="correlation-alert text-success"><i data-lucide="zap"></i> Perfect Balance. Low screen, high flow!</span>`;
        } else {
          correlationMsg = `<span class="correlation-alert text-warning"><i data-lucide="check"></i> Normal balance state.</span>`;
        }

        chartTooltip.innerHTML = `
          <div class="tooltip-title">${d.label}</div>
          <div class="tooltip-stat"><span class="lbl">Screen Time:</span> <span class="val text-warning">${d.screenTime.toFixed(1)} hrs</span></div>
          <div class="tooltip-stat"><span class="lbl">Flow Score:</span> <span class="val text-success">${d.prodScore}/5 (${d.completed} pts)</span></div>
          <div class="tooltip-message">${correlationMsg}</div>
        `;

        // Position tooltip
        const tooltipX = targetPointST.x + 10;
        const tooltipY = Math.min(targetPointST.y, targetPointPR.y) - 20;

        chartTooltip.style.left = `${(targetPointST.x / width) * 100}%`;
        chartTooltip.style.top = `${(tooltipY / height) * 100}%`;
        chartTooltip.classList.remove('hidden');

        if (window.lucide) window.lucide.createIcons();
      }
    });

    overlay.addEventListener('mouseleave', () => {
      vline.classList.add('hidden');
      circST.classList.add('hidden');
      circPR.classList.add('hidden');
      chartTooltip.classList.add('hidden');
    });
  }
}

function renderBlockerFeed() {
  const feedList = document.getElementById('blocker-feed-list');
  if (!feedList) return;

  const state = stateManager.state;
  const journalEntries = state.dailyJournal || {};

  // Extract all blockers
  const blockers = [];
  Object.keys(journalEntries).forEach(dateStr => {
    const entry = journalEntries[dateStr];
    if (entry.blockers && entry.blockers.length > 0) {
      entry.blockers.forEach(blk => {
        blockers.push({
          date: dateStr,
          taskTitle: blk.taskTitle || 'General Obstacle',
          blockerText: blk.text,
          mood: entry.mood
        });
      });
    }
  });

  // Add degree incomplete topic blockers
  const activeDegreeBlock = stateManager.getActiveDegree();
  if (activeDegreeBlock && activeDegreeBlock.modules) {
    activeDegreeBlock.modules.forEach(mod => {
      mod.topics.forEach(top => {
        if (!top.completed && top.blocker) {
          blockers.push({
            date: 'Syllabus Blocker',
            taskTitle: `${mod.name} -> ${top.name}`,
            blockerText: top.blocker,
            mood: 'study'
          });
        }
      });
    });
  }

  // Sort blockers by date/source (show recent first or syllabus blockers first)
  if (blockers.length === 0) {
    feedList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="shield-check" class="empty-icon text-success"></i>
        <p>No friction points logged recently. You are in deep flow!</p>
      </div>
    `;
    if (window.lucide) {
      window.lucide.createIcons();
    }
    return;
  }

  feedList.innerHTML = blockers
    .map(
      b => `
      <div class="blocker-item glass-card-secondary">
        <div class="blocker-meta">
          <span class="blocker-source font-accent">${b.date}</span>
          <span class="blocker-label font-accent">${b.taskTitle}</span>
        </div>
        <p class="blocker-text">" ${b.blockerText} "</p>
      </div>
    `
    )
    .join('');
}
