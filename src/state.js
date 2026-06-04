// state.js
// Handles global state, localStorage serialization, and operations on user data.

const STATE_KEY = 'iturned20today_state';

// Helper to get formatted date string: YYYY-MM-DD
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_STATE = {
  birthDate: '2006-06-04',
  expectedLifespan: 80,
  monthlyBudget: 1500,
  currencySymbol: '₹', // Default currency is INR
  screenTimeLog: {}, // { 'YYYY-MM-DD': hours }
  dailyJournal: {}, // { 'YYYY-MM-DD': { mood: 3, highlight: '', notes: '', blockers: [] } }
  degrees: [
    {
      id: 'deg-1',
      title: 'BSc Computer Science',
      modules: [
        {
          id: 'mod-1',
          name: 'Data Structures & Algorithms',
          topics: [
            { id: 'top-1-1', name: 'Arrays & Linked Lists', completed: true },
            { id: 'top-1-2', name: 'Binary Search Trees', completed: false, blocker: 'Found recursion concepts difficult' },
            { id: 'top-1-3', name: 'Graph Traversals (BFS/DFS)', completed: false }
          ],
          lectures: [
            { id: 'lec-1-1', date: '2026-06-02', topic: 'Complexity analysis (Big O)', lecturer: 'Dr. Alan Turing', keyTakeaways: 'Master theorem limits, worst case vs average case.', notes: 'Focus on recursion trees.' },
            { id: 'lec-1-2', date: '2026-06-04', topic: 'BST insertions and deletions', lecturer: 'Dr. Alan Turing', keyTakeaways: 'Deletions have 3 cases. Successor finding is key.', notes: 'Need to write code practice.' }
          ],
          studyLogs: [
            { id: 'stl-1-1', date: '2026-06-02', duration: 90, notes: 'Implemented doubly linked list from scratch.' },
            { id: 'stl-1-3', date: '2026-06-03', duration: 60, notes: 'Completed Big-O homework sheets.' }
          ]
        },
        {
          id: 'mod-2',
          name: 'Web Development',
          topics: [
            { id: 'top-2-1', name: 'HTML & CSS Essentials', completed: true },
            { id: 'top-2-2', name: 'Modern ES6+ Javascript', completed: true },
            { id: 'top-2-3', name: 'Vite & Vanilla Components', completed: false }
          ],
          lectures: [
            { id: 'lec-2-1', date: '2026-06-03', topic: 'Javascript Event Loop', lecturer: 'Prof. Tim Berners-Lee', keyTakeaways: 'Microtasks vs Macrotasks execution order.', notes: 'Callbacks go to queue, promises go to microtask.' }
          ],
          studyLogs: [
            { id: 'stl-2-1', date: '2026-06-04', duration: 120, notes: 'Designed CSS glassmorphic components for portfolio.' }
          ]
        }
      ]
    }
  ],
  activeDegreeId: 'deg-1',
  goals: [
    {
      id: 'goal-1',
      category: 'career',
      title: 'Land a software engineering summer internship',
      completed: false,
      milestones: [
        { id: 'ms-1-1', title: 'Build portfolio website', completed: true },
        { id: 'ms-1-2', title: 'Solve 100 LeetCode problems', completed: false },
        { id: 'ms-1-3', title: 'Apply to 20 companies', completed: false }
      ]
    },
    {
      id: 'goal-2',
      category: 'skills',
      title: 'Master Piano & Music Theory',
      completed: false,
      milestones: [
        { id: 'ms-2-1', title: 'Learn key signatures', completed: true },
        { id: 'ms-2-2', title: 'Practice Moonlight Sonata 1st Movement', completed: false }
      ]
    }
  ],
  finances: {
    transactions: [
      { id: 'tx-1', date: '2026-06-02', type: 'income', category: 'Freelance', amount: 35000, description: 'Website development landing page' },
      { id: 'tx-2', date: '2026-06-03', type: 'expense', category: 'Food', amount: 1500, description: 'Dinner with friends' },
      { id: 'tx-3', date: '2026-06-04', type: 'expense', category: 'Subscription', amount: 999, description: 'Spotify Premium' }
    ],
    savingsGoals: [
      { id: 'save-1', title: 'New MacBook Pro', target: 200000, current: 85000 },
      { id: 'save-2', title: 'Emergency Fund', target: 500000, current: 220000 }
    ]
  },
  fitness: {
    habits: [
      { id: 'hab-1', name: 'Hydration', target: 3, current: 0, unit: 'L' },
      { id: 'hab-2', name: 'Steps', target: 10000, current: 0, unit: 'steps' },
      { id: 'hab-3', name: 'Sleep', target: 8, current: 0, unit: 'hrs' },
      { id: 'hab-4', name: 'Workout', target: 1, current: 0, unit: 'session' }
    ],
    dailyLogs: {} // { 'YYYY-MM-DD': { habits: { 'hab-1': 2 }, weight: 70 } }
  },
  pomodoroSettings: {
    workTime: 25,
    breakTime: 5
  },
  history: {}, // { 'YYYY-MM-DD': { tasksCompleted: 4, score: 5 } }
  calendarEvents: [
    { id: 'evt-1', date: '2026-06-02', title: 'Big O Lecture', type: 'live', moduleId: 'mod-1', duration: 60, completed: true },
    { id: 'evt-2', date: '2026-06-04', title: 'Self study trees', type: 'self', moduleId: 'mod-1', duration: 90, completed: true },
    { id: 'evt-3', date: '2026-06-05', title: 'Code Vite CSS layout', type: 'self', moduleId: 'mod-2', duration: 120, completed: false }
  ],
  focusHistory: [
    { id: 'foc-1', date: '2026-06-03', taskTitle: 'Solve BST deletes', duration: 45 },
    { id: 'foc-2', date: '2026-06-04', taskTitle: 'CSS layout research', duration: 30 }
  ]
};

class StateManager {
  constructor() {
    this.state = this.load();
    this.listeners = [];
  }

  load() {
    try {
      const data = localStorage.getItem(STATE_KEY);
      if (!data) return DEFAULT_STATE;
      
      const parsed = JSON.parse(data);
      const merged = { ...DEFAULT_STATE, ...parsed };

      // Handle migration from single 'degree' to multiple 'degrees' if needed
      if (parsed.degree && !parsed.degrees) {
        merged.degrees = [
          {
            id: 'deg-1',
            title: parsed.degree.title || 'Curriculum',
            modules: parsed.degree.modules || []
          }
        ];
        merged.activeDegreeId = 'deg-1';
        delete merged.degree;
      }
      
      // Ensure arrays exist
      if (!merged.degrees) merged.degrees = DEFAULT_STATE.degrees;
      if (!merged.focusHistory) merged.focusHistory = DEFAULT_STATE.focusHistory;
      if (!merged.currencySymbol) merged.currencySymbol = '₹';

      // Ensure modules inside degrees have logs and lectures arrays
      merged.degrees.forEach(deg => {
        if (deg.modules) {
          deg.modules = deg.modules.map(mod => ({
            lectures: [],
            studyLogs: [],
            ...mod
          }));
        }
      });

      return merged;
    } catch (e) {
      console.error('Failed to load state:', e);
      return DEFAULT_STATE;
    }
  }

  save() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
      this.triggerListeners();
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  onChange(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  triggerListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // --- Profile Settings & Currency ---
  updateProfile(birthDate, expectedLifespan) {
    this.state.birthDate = birthDate;
    this.state.expectedLifespan = parseInt(expectedLifespan) || 80;
    this.save();
  }

  updateCurrency(symbol) {
    this.state.currencySymbol = symbol;
    this.save();
  }

  // --- Multi-Curricula (Degrees) CRUD ---
  getActiveDegree() {
    return this.state.degrees.find(d => d.id === this.state.activeDegreeId) || this.state.degrees[0];
  }

  addDegree(title) {
    const newDeg = {
      id: `deg-${Date.now()}`,
      title,
      modules: []
    };
    this.state.degrees.push(newDeg);
    this.state.activeDegreeId = newDeg.id;
    this.save();
    return newDeg;
  }

  deleteDegree(degreeId) {
    if (this.state.degrees.length <= 1) {
      alert('You must have at least one curriculum track active!');
      return;
    }
    this.state.degrees = this.state.degrees.filter(d => d.id !== degreeId);
    if (this.state.activeDegreeId === degreeId) {
      this.state.activeDegreeId = this.state.degrees[0].id;
    }
    this.save();
  }

  setActiveDegree(degreeId) {
    this.state.activeDegreeId = degreeId;
    this.save();
  }

  updateDegreeTitle(title) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      activeDegree.title = title;
      this.save();
    }
  }

  // --- Study / Subject CRUD (scoped to activeDegree) ---
  addModule(name) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const newModule = {
        id: `mod-${Date.now()}`,
        name: name,
        topics: [],
        lectures: [],
        studyLogs: []
      };
      activeDegree.modules.push(newModule);
      this.save();
      return newModule;
    }
  }

  editModule(moduleId, name) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod) {
        mod.name = name;
        this.save();
      }
    }
  }

  deleteModule(moduleId) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      activeDegree.modules = activeDegree.modules.filter(m => m.id !== moduleId);
      this.save();
    }
  }

  addTopic(moduleId, name) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod) {
        const newTopic = {
          id: `top-${Date.now()}`,
          name: name,
          completed: false
        };
        mod.topics.push(newTopic);
        this.save();
        return newTopic;
      }
    }
  }

  editTopic(moduleId, topicId, name) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod) {
        const topic = mod.topics.find(t => t.id === topicId);
        if (topic) {
          topic.name = name;
          this.save();
        }
      }
    }
  }

  toggleTopicCompletion(moduleId, topicId, completed, blocker = '') {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod) {
        const topic = mod.topics.find(t => t.id === topicId);
        if (topic) {
          topic.completed = completed;
          if (completed) {
            delete topic.blocker;
          } else if (blocker) {
            topic.blocker = blocker;
          }
          
          const today = getTodayDateString();
          this.updateDailyProductivityScore(today);
          this.save();
        }
      }
    }
  }

  deleteTopic(moduleId, topicId) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod) {
        mod.topics = mod.topics.filter(t => t.id !== topicId);
        this.save();
      }
    }
  }

  // --- Lecture Track CRUD ---
  addLecture(moduleId, topic, lecturer, keyTakeaways, notes, date = getTodayDateString()) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod) {
        const newLec = {
          id: `lec-${Date.now()}`,
          date,
          topic,
          lecturer,
          keyTakeaways,
          notes
        };
        if (!mod.lectures) mod.lectures = [];
        mod.lectures.push(newLec);
        this.incrementDailyTaskCount(date);
        this.save();
        return newLec;
      }
    }
  }

  deleteLecture(moduleId, lectureId) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod && mod.lectures) {
        const lec = mod.lectures.find(l => l.id === lectureId);
        mod.lectures = mod.lectures.filter(l => l.id !== lectureId);
        if (lec) {
          this.decrementDailyTaskCount(lec.date);
        }
        this.save();
      }
    }
  }

  // --- Study Log CRUD ---
  addStudyLog(moduleId, duration, notes, date = getTodayDateString()) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod) {
        const newLog = {
          id: `stl-${Date.now()}`,
          date,
          duration: parseInt(duration) || 0,
          notes
        };
        if (!mod.studyLogs) mod.studyLogs = [];
        mod.studyLogs.push(newLog);
        this.incrementDailyTaskCount(date);
        this.save();
        return newLog;
      }
    }
  }

  deleteStudyLog(moduleId, logId) {
    const activeDegree = this.getActiveDegree();
    if (activeDegree) {
      const mod = activeDegree.modules.find(m => m.id === moduleId);
      if (mod && mod.studyLogs) {
        const log = mod.studyLogs.find(l => l.id === logId);
        mod.studyLogs = mod.studyLogs.filter(l => l.id !== logId);
        if (log) {
          this.decrementDailyTaskCount(log.date);
        }
        this.save();
      }
    }
  }

  // --- Focus Mode Session Logs ---
  logFocusSession(taskTitle, duration) {
    const newSession = {
      id: `foc-${Date.now()}`,
      date: getTodayDateString(),
      taskTitle,
      duration: parseInt(duration) || 0
    };
    if (!this.state.focusHistory) this.state.focusHistory = [];
    this.state.focusHistory.push(newSession);
    this.incrementDailyTaskCount(getTodayDateString());
    this.save();
    return newSession;
  }

  // --- Calendar Events CRUD ---
  addCalendarEvent(date, title, type, moduleId, duration) {
    const newEvent = {
      id: `evt-${Date.now()}`,
      date,
      title,
      type,
      moduleId,
      duration: parseInt(duration) || 0,
      completed: false
    };
    if (!this.state.calendarEvents) this.state.calendarEvents = [];
    this.state.calendarEvents.push(newEvent);
    this.save();
    return newEvent;
  }

  toggleCalendarEventCompletion(eventId, completed) {
    const evt = this.state.calendarEvents.find(e => e.id === eventId);
    if (evt) {
      evt.completed = completed;
      if (completed && evt.moduleId) {
        this.addStudyLog(evt.moduleId, evt.duration, `Completed planned session: ${evt.title}`, evt.date);
      }
      this.save();
    }
  }

  deleteCalendarEvent(eventId) {
    this.state.calendarEvents = this.state.calendarEvents.filter(e => e.id !== eventId);
    this.save();
  }

  // --- Screen Time Logs ---
  logScreenTime(date, hours) {
    this.state.screenTimeLog[date] = parseFloat(hours) || 0;
    this.updateDailyProductivityScore(date);
    this.save();
  }

  // --- Journal & Blockers ---
  saveJournalEntry(date, entryData) {
    this.state.dailyJournal[date] = {
      ...this.state.dailyJournal[date],
      ...entryData
    };
    this.updateDailyProductivityScore(date);
    this.save();
  }

  // --- Life Goals CRUD ---
  addGoal(title, category) {
    const newGoal = {
      id: `goal-${Date.now()}`,
      category,
      title,
      completed: false,
      milestones: []
    };
    this.state.goals.push(newGoal);
    this.save();
    return newGoal;
  }

  editGoal(goalId, title, category) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      goal.title = title;
      if (category) goal.category = category;
      this.save();
    }
  }

  deleteGoal(goalId) {
    this.state.goals = this.state.goals.filter(g => g.id !== goalId);
    this.save();
  }

  toggleGoalCompletion(goalId, completed) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      goal.completed = completed;
      if (completed) {
        goal.milestones.forEach(m => m.completed = true);
      }
      
      const today = getTodayDateString();
      this.updateDailyProductivityScore(today);
      this.save();
    }
  }

  addMilestone(goalId, title) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      const newMilestone = {
        id: `ms-${Date.now()}`,
        title,
        completed: false
      };
      goal.milestones.push(newMilestone);
      this.save();
      return newMilestone;
    }
  }

  editMilestone(goalId, milestoneId, title) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      const ms = goal.milestones.find(m => m.id === milestoneId);
      if (ms) {
        ms.title = title;
        this.save();
      }
    }
  }

  toggleMilestone(goalId, milestoneId, completed) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      const ms = goal.milestones.find(m => m.id === milestoneId);
      if (ms) {
        ms.completed = completed;
        
        const allCompleted = goal.milestones.every(m => m.completed);
        if (allCompleted && goal.milestones.length > 0) {
          goal.completed = true;
        } else if (!completed) {
          goal.completed = false;
        }
        
        const today = getTodayDateString();
        this.updateDailyProductivityScore(today);
        this.save();
      }
    }
  }

  deleteMilestone(goalId, milestoneId) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      goal.milestones = goal.milestones.filter(m => m.id !== milestoneId);
      this.save();
    }
  }

  // --- Finances CRUD ---
  addTransaction(type, category, amount, description, date = getTodayDateString()) {
    const newTx = {
      id: `tx-${Date.now()}`,
      date,
      type,
      category,
      amount: parseFloat(amount) || 0,
      description
    };
    this.state.finances.transactions.push(newTx);
    this.updateDailyProductivityScore(date);
    this.save();
    return newTx;
  }

  deleteTransaction(txId) {
    const tx = this.state.finances.transactions.find(t => t.id === txId);
    this.state.finances.transactions = this.state.finances.transactions.filter(t => t.id !== txId);
    if (tx) {
      this.updateDailyProductivityScore(tx.date);
    }
    this.save();
  }

  addSavingsGoal(title, target, current = 0) {
    const newGoal = {
      id: `save-${Date.now()}`,
      title,
      target: parseFloat(target) || 0,
      current: parseFloat(current) || 0
    };
    this.state.finances.savingsGoals.push(newGoal);
    this.save();
    return newGoal;
  }

  updateSavingsProgress(saveId, current) {
    const sGoal = this.state.finances.savingsGoals.find(s => s.id === saveId);
    if (sGoal) {
      sGoal.current = parseFloat(current) || 0;
      this.save();
    }
  }

  deleteSavingsGoal(saveId) {
    this.state.finances.savingsGoals = this.state.finances.savingsGoals.filter(s => s.id !== saveId);
    this.save();
  }

  updateBudget(budget) {
    this.state.monthlyBudget = parseFloat(budget) || 0;
    this.save();
  }

  // --- Fitness & Habits CRUD ---
  updateHabitProgress(date, habitId, value) {
    if (!this.state.fitness.dailyLogs[date]) {
      this.state.fitness.dailyLogs[date] = { habits: {}, weight: null };
    }
    this.state.fitness.dailyLogs[date].habits[habitId] = parseFloat(value) || 0;
    this.updateDailyProductivityScore(date);
    this.save();
  }

  logWeight(date, weight) {
    if (!this.state.fitness.dailyLogs[date]) {
      this.state.fitness.dailyLogs[date] = { habits: {}, weight: null };
    }
    this.state.fitness.dailyLogs[date].weight = parseFloat(weight) || null;
    this.save();
  }

  incrementDailyTaskCount(date) {
    if (!this.state.history) this.state.history = {};
    if (!this.state.history[date]) {
      this.state.history[date] = { tasksCompleted: 0, score: 0 };
    }
    this.state.history[date].tasksCompleted = (this.state.history[date].tasksCompleted || 0) + 1;
    this.state.history[date].score = Math.min(5, this.state.history[date].tasksCompleted);
    this.save();
  }

  decrementDailyTaskCount(date) {
    if (!this.state.history || !this.state.history[date]) return;
    this.state.history[date].tasksCompleted = Math.max(0, (this.state.history[date].tasksCompleted || 0) - 1);
    this.state.history[date].score = Math.min(5, this.state.history[date].tasksCompleted);
    this.save();
  }

  // --- Productivity Engine ---
  updateDailyProductivityScore(date) {
    let tasksCompleted = 0;

    const journal = this.state.dailyJournal[date];
    if (journal && journal.highlight) {
      tasksCompleted += 1;
    }
    if (journal && journal.mood) {
      tasksCompleted += 1;
    }

    const fitnessLog = this.state.fitness.dailyLogs[date];
    if (fitnessLog && fitnessLog.habits) {
      Object.keys(fitnessLog.habits).forEach(habId => {
        const habit = this.state.fitness.habits.find(h => h.id === habId);
        const value = fitnessLog.habits[habId];
        if (habit && value >= habit.target * 0.8) {
          tasksCompleted += 1;
        }
      });
    }

    const dailyTxCount = this.state.finances.transactions.filter(t => t.date === date).length;
    tasksCompleted += Math.min(dailyTxCount, 2);

    const score = Math.min(5, tasksCompleted);
    
    if (!this.state.history) {
      this.state.history = {};
    }
    
    this.state.history[date] = {
      tasksCompleted,
      score
    };
  }

  exportData() {
    return JSON.stringify(this.state, null, 2);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.state = { ...DEFAULT_STATE, ...parsed };
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }
}

export const stateManager = new StateManager();
stateManager.updateDailyProductivityScore(getTodayDateString());
export function formatCurrency(amount) {
  const symbol = stateManager.state.currencySymbol || '₹';
  return `${symbol}${amount.toLocaleString()}`;
}
