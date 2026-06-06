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
  isPro: false,
  birthDate: '',
  expectedLifespan: 80,
  monthlyBudget: 0,
  currencySymbol: '₹',
  screenTimeLog: {}, 
  dailyJournal: {}, 
  degrees: [],
  activeDegreeId: null,
  exams: [],
  goals: [],
  finances: {
    transactions: [],
    savingsGoals: []
  },
  fitness: {
    habits: [
      { id: 'hab-1', name: 'Hydration', target: 3, current: 0, unit: 'L' },
      { id: 'hab-2', name: 'Steps', target: 10000, current: 0, unit: 'steps' },
      { id: 'hab-3', name: 'Sleep', target: 8, current: 0, unit: 'hrs' },
      { id: 'hab-4', name: 'Workout', target: 1, current: 0, unit: 'session' }
    ],
    dailyLogs: {} 
  },
  pomodoroSettings: {
    workTime: 25,
    breakTime: 5
  },
  history: {}, 
  calendarEvents: [],
  focusHistory: []
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
      if (!merged.exams) merged.exams = DEFAULT_STATE.exams;
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

  saveLocal() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
      this.triggerListeners();
    } catch (e) {
      console.error('Failed to save state locally:', e);
    }
  }

  save() {
    this.saveLocal();
    
    // Cloud sync for authenticated users
    if (this.state.userProfile && this.state.userProfile.clerkUserId) {
      // Fire and forget push to cloud
      import('./lib/auth.js').then(({ pushRemoteState }) => {
        pushRemoteState(this.state.userProfile.clerkUserId, this.state);
      });
    }
  }

  async loadRemoteState() {
    if (this.state.userProfile && this.state.userProfile.clerkUserId) {
      try {
        const { pullRemoteState } = await import('./lib/auth.js');
        const remoteState = await pullRemoteState(this.state.userProfile.clerkUserId);
        if (remoteState) {
          this.state = { ...this.state, ...remoteState };
          
          // Ensure modules inside degrees have logs and lectures arrays from remote state
          if (this.state.degrees) {
            this.state.degrees.forEach(deg => {
              if (deg.modules) {
                deg.modules = deg.modules.map(mod => ({
                  lectures: [],
                  studyLogs: [],
                  ...mod
                }));
              }
            });
          }

          localStorage.setItem('iturned20today_onboarding_complete', 'true');
          this.saveLocal();
        }
      } catch (err) {
        console.error('Failed to sync remote state', err);
      }
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

  upgradeToPro() {
    this.state.isPro = true;
    this.save();
  }

  updateBudget(budget) {
    this.state.monthlyBudget = budget;
    this.save();
  }

  // --- Multi-Curricula (Degrees) CRUD ---
  getActiveDegree() {
    return this.state.degrees.find(d => d.id === this.state.activeDegreeId) || this.state.degrees[0] || { id: 'temp', title: 'Curriculum', modules: [] };
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
    if (this.state.degrees.length === 0) {
      this.addDegree(title);
      return;
    }
    const activeDegree = this.state.degrees.find(d => d.id === this.state.activeDegreeId) || this.state.degrees[0];
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

  // --- Exams Engine CRUD ---
  addExam(title, date, type = 'Finals', targetScore = '') {
    const newExam = {
      id: `exam-${Date.now()}`,
      title,
      date,
      type,
      targetScore
    };
    if (!this.state.exams) this.state.exams = [];
    this.state.exams.push(newExam);
    this.save();
    return newExam;
  }

  editExam(examId, title, date, type, targetScore) {
    if (!this.state.exams) return;
    const exam = this.state.exams.find(e => e.id === examId);
    if (exam) {
      exam.title = title;
      exam.date = date;
      exam.type = type;
      exam.targetScore = targetScore;
      this.save();
    }
  }

  deleteExam(examId) {
    if (!this.state.exams) return;
    this.state.exams = this.state.exams.filter(e => e.id !== examId);
    this.save();
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
      this.state.history[date] = { tasksCompleted: 0, manualTasksCompleted: 0, score: 0 };
    }
    this.state.history[date].manualTasksCompleted = (this.state.history[date].manualTasksCompleted || 0) + 1;
    this.updateDailyProductivityScore(date);
    this.save();
  }

  decrementDailyTaskCount(date) {
    if (!this.state.history || !this.state.history[date]) return;
    this.state.history[date].manualTasksCompleted = Math.max(0, (this.state.history[date].manualTasksCompleted || 0) - 1);
    this.updateDailyProductivityScore(date);
    this.save();
  }

  // --- Productivity Engine ---
  updateDailyProductivityScore(date) {
    let tasksCompleted = 0;

    const journal = this.state.dailyJournal[date];
    if (journal && journal.highlight) tasksCompleted += 1;
    if (journal && journal.mood) tasksCompleted += 1;

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

    if (this.state.focusHistory) {
      tasksCompleted += this.state.focusHistory.filter(f => f.date === date).length;
    }

    if (this.state.calendarEvents) {
      tasksCompleted += this.state.calendarEvents.filter(e => e.date === date && e.completed).length;
    }

    if (!this.state.history) this.state.history = {};
    if (!this.state.history[date]) {
      this.state.history[date] = { tasksCompleted: 0, manualTasksCompleted: 0, score: 0 };
    }
    
    tasksCompleted += (this.state.history[date].manualTasksCompleted || 0);

    const score = Math.min(5, tasksCompleted);
    
    this.state.history[date].tasksCompleted = tasksCompleted;
    this.state.history[date].score = score;
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
