const habitInput = document.getElementById("habitInput");
const habitTags = document.getElementById("habitTags");
const habitNotes = document.getElementById("habitNotes");
const habitGoal = document.getElementById("habitGoal");
const habitReminder = document.getElementById("habitReminder");
const addHabitBtn = document.getElementById("addHabitBtn");
const habitList = document.getElementById("habitList");
const totalHabits = document.getElementById("totalHabits");
const completedHabits = document.getElementById("completedHabits");
const scheduledToday = document.getElementById("scheduledToday");
const weeklyRate = document.getElementById("weeklyRate");
const progressList = document.getElementById("progressList");
const themeToggle = document.getElementById("theme-toggle");

const deleteModal = document.getElementById("delete-modal");
const deleteMessage = document.getElementById("delete-message");
const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
const deleteCancelBtn = document.getElementById("delete-cancel-btn");
const deleteCloseBtn = document.getElementById("delete-close-btn");

let habits = JSON.parse(localStorage.getItem("habits")) || [];
let pendingDeleteIndex = null;

/* DATE HELPERS */

function getTodayString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const adjusted = new Date(d.getTime() - (offset * 60 * 1000));
  return adjusted.toISOString().split("T")[0];
}

function getYesterdayString() {
  const d = new Date(Date.now() - 86400000);
  const offset = d.getTimezoneOffset();
  const adjusted = new Date(d.getTime() - (offset * 60 * 1000));
  return adjusted.toISOString().split("T")[0];
}

function getDateMs(dateString) {
  return new Date(`${dateString}T00:00:00`).getTime();
}

function getLast7Dates() {
  const dates = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000);
    const offset = d.getTimezoneOffset();
    const adjusted = new Date(d.getTime() - (offset * 60 * 1000));
    dates.push(adjusted.toISOString().split("T")[0]);
  }
  return dates;
}

/* DATA HELPERS */

function parseTags(value) {
  if (!value) return [];
  return value
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

function getSelectedSchedule() {
  const selected = Array.from(document.querySelectorAll(".schedule-day:checked"))
    .map(input => Number(input.value));
  return selected.length ? selected : [0, 1, 2, 3, 4, 5, 6];
}

function isScheduledForDay(habit, dayIndex) {
  if (!habit.schedule || habit.schedule.length === 0) return true;
  return habit.schedule.includes(dayIndex);
}

function getLatestCompletionDate(habit) {
  if (!habit.completionDates || habit.completionDates.length === 0) return "";
  return habit.completionDates
    .slice()
    .sort()
    .pop();
}

function normalizeCompletionDates(habit) {
  const uniqueDates = Array.from(new Set(habit.completionDates || []));
  habit.completionDates = uniqueDates.sort();
}

function calculateCurrentStreak(habit) {
  if (!habit.completionDates || habit.completionDates.length === 0) return 0;
  const set = new Set(habit.completionDates);
  let streak = 0;
  const today = getTodayString();
  for (let i = 0; i < 365; i += 1) {
    const date = new Date(getDateMs(today) - i * 86400000);
    const dateStr = date.toISOString().split("T")[0];
    if (set.has(dateStr)) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function calculateMaxStreak(habit) {
  if (!habit.completionDates || habit.completionDates.length === 0) return 0;
  const dates = habit.completionDates.slice().sort();
  let max = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i += 1) {
    const prev = getDateMs(dates[i - 1]);
    const curr = getDateMs(dates[i]);
    if (curr - prev === 86400000) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > max) max = current;
  }
  return max;
}

/* SAVE HABITS */

function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

/* MIGRATION */

habits.forEach(habit => {
  if (habit.tags === undefined) habit.tags = [];
  if (habit.notes === undefined) habit.notes = "";
  if (habit.goalText === undefined) habit.goalText = "";
  if (habit.reminderTime === undefined) habit.reminderTime = "";
  if (habit.schedule === undefined) habit.schedule = [0, 1, 2, 3, 4, 5, 6];
  if (habit.completionDates === undefined) habit.completionDates = [];
  if (habit.streak === undefined) habit.streak = 0;
  if (habit.maxStreak === undefined) habit.maxStreak = habit.completed ? 1 : 0;
  if (habit.lastCompleted === undefined) habit.lastCompleted = "";
  if (habit.createdAt === undefined) habit.createdAt = getTodayString();

  if (habit.lastCompleted && !habit.completionDates.includes(habit.lastCompleted)) {
    habit.completionDates.push(habit.lastCompleted);
  }

  normalizeCompletionDates(habit);
  habit.lastCompleted = getLatestCompletionDate(habit);
});
saveHabits();

/* DAILY RESET / RESET BROKEN STREAKS */

function updateHabitsDailyStatus() {
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();

  habits.forEach(habit => {
    habit.completed = habit.completionDates.includes(todayStr);

    if (!habit.completed && habit.lastCompleted !== yesterdayStr) {
      habit.streak = 0;
    }
  });

  saveHabits();
}

/* CHECK AND UPDATE ACHIEVEMENTS VISUALLY */

function checkMilestones() {
  let maxStreakAcrossAll = 0;

  habits.forEach(habit => {
    if (habit.maxStreak && habit.maxStreak > maxStreakAcrossAll) {
      maxStreakAcrossAll = habit.maxStreak;
    }
  });

  const milestones = [
    { id: "badge-3", streak: 3 },
    { id: "badge-7", streak: 7 },
    { id: "badge-30", streak: 30 }
  ];

  milestones.forEach(m => {
    const el = document.getElementById(m.id);

    if (el) {
      if (maxStreakAcrossAll >= m.streak) {
        el.classList.remove("locked");
        el.classList.add("unlocked");
      } else {
        el.classList.remove("unlocked");
        el.classList.add("locked");
      }
    }
  });
}

/* MILESTONE CELEBRATION MODAL */

function checkMilestoneUnlocked(habitName, newStreak) {
  if (newStreak === 3 || newStreak === 7 || newStreak === 30) {
    showMilestoneModal(habitName, newStreak);
  }
}

function showMilestoneModal(habitName, streak) {
  const modal = document.getElementById("milestone-modal");
  const msg = document.getElementById("milestone-message");
  const icon = modal.querySelector(".modal-badge-icon");

  let medal = "🥉";

  if (streak === 7) medal = "🥈";
  if (streak === 30) medal = "🥇";

  icon.textContent = medal;
  msg.textContent = `You achieved a ${streak}-Day streak on "${habitName}"! Keep it up! 🎉`;

  modal.classList.add("show");
}

function hideMilestoneModal() {
  const modal = document.getElementById("milestone-modal");

  if (modal) {
    modal.classList.remove("show");
  }
}

/* DELETE MODAL */

function openDeleteModal(index) {
  const habit = habits[index];
  pendingDeleteIndex = index;
  deleteMessage.textContent = `Delete "${habit.name}"? This action cannot be undone.`;
  deleteModal.classList.add("show");
}

function closeDeleteModal() {
  pendingDeleteIndex = null;
  deleteModal.classList.remove("show");
}

/* TOGGLE COMPLETE LOGIC */

function toggleComplete(index) {
  const habit = habits[index];
  const todayStr = getTodayString();

  if (!habit.completed) {
    habit.completed = true;
    habit.completionDates.push(todayStr);
  } else {
    habit.completed = false;
    habit.completionDates = habit.completionDates.filter(date => date !== todayStr);
  }

  normalizeCompletionDates(habit);
  habit.lastCompleted = getLatestCompletionDate(habit);
  habit.streak = calculateCurrentStreak(habit);
  habit.maxStreak = Math.max(habit.maxStreak || 0, calculateMaxStreak(habit));

  if (habit.streak > 0) {
    checkMilestoneUnlocked(habit.name, habit.streak);
  }
}

/* PROGRESS */

function getWeeklyProgress(habit) {
  const weekDates = getLast7Dates();
  let scheduledCount = 0;
  let completedCount = 0;

  weekDates.forEach(dateStr => {
    const dayIndex = new Date(`${dateStr}T00:00:00`).getDay();
    if (isScheduledForDay(habit, dayIndex)) {
      scheduledCount += 1;
    }
    if (habit.completionDates.includes(dateStr)) {
      completedCount += 1;
    }
  });

  const percent = scheduledCount === 0
    ? 0
    : Math.round((completedCount / scheduledCount) * 100);

  return { scheduledCount, completedCount, percent };
}

/* RENDER HABITS */

function renderHabits() {
  habitList.innerHTML = "";

  habits.forEach((habit, index) => {
    const li = document.createElement("li");
    li.className = "habit-item";

    const streakHtml = habit.streak && habit.streak > 0
      ? `<span class="streak-badge">🔥 ${habit.streak} day${habit.streak > 1 ? "s" : ""}</span>`
      : "";

    const tagsHtml = habit.tags
      .map(tag => `<span class="tag">${tag}</span>`)
      .join("");

    const scheduleLabel = habit.schedule
      .map(day => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day])
      .join(" ");

    const weekly = getWeeklyProgress(habit);

    li.innerHTML = `
      <div class="habit-main">
        <div class="habit-details">
          <span class="habit-title ${habit.completed ? "completed" : ""}">
            ${habit.name}
          </span>
          <div class="habit-meta">
            ${tagsHtml}
            <span>Schedule: ${scheduleLabel || "Daily"}</span>
            ${habit.goalText ? `<span>Goal: ${habit.goalText}</span>` : ""}
            ${habit.reminderTime ? `<span>Reminder: ${habit.reminderTime}</span>` : ""}
            <span>Weekly: ${weekly.completedCount}/${weekly.scheduledCount}</span>
          </div>
          ${habit.notes ? `<p class="habit-note">${habit.notes}</p>` : ""}
          ${streakHtml}
        </div>
        <div class="actions">
          <button class="complete-btn">${habit.completed ? "Undo" : "Done"}</button>
          <button class="delete-btn">Delete</button>
        </div>
      </div>
      <div class="progress-bar">
        <span style="width: ${weekly.percent}%"></span>
      </div>
    `;

    const completeBtn = li.querySelector(".complete-btn");
    const deleteBtn = li.querySelector(".delete-btn");

    completeBtn.addEventListener("click", () => {
      toggleComplete(index);
      saveHabits();
      renderAll();
    });

    deleteBtn.addEventListener("click", () => {
      openDeleteModal(index);
    });

    habitList.appendChild(li);
  });
}

function renderProgressCharts() {
  progressList.innerHTML = "";

  habits.forEach(habit => {
    const weekly = getWeeklyProgress(habit);
    const card = document.createElement("div");
    card.className = "progress-card";
    card.innerHTML = `
      <div class="habit-title">${habit.name}</div>
      <div class="habit-meta">Weekly completion: ${weekly.percent}%</div>
      <div class="progress-bar"><span style="width: ${weekly.percent}%"></span></div>
    `;
    progressList.appendChild(card);
  });
}

function updateStats() {
  const todayStr = getTodayString();
  const todayDay = new Date(`${todayStr}T00:00:00`).getDay();

  let completedCount = 0;
  let scheduledCount = 0;
  let totalScheduledWeek = 0;
  let totalCompletedWeek = 0;

  habits.forEach(habit => {
    if (habit.completed) completedCount += 1;
    if (isScheduledForDay(habit, todayDay)) scheduledCount += 1;

    const weekly = getWeeklyProgress(habit);
    totalScheduledWeek += weekly.scheduledCount;
    totalCompletedWeek += weekly.completedCount;
  });

  const overallWeeklyRate = totalScheduledWeek === 0
    ? 0
    : Math.round((totalCompletedWeek / totalScheduledWeek) * 100);

  totalHabits.textContent = habits.length;
  completedHabits.textContent = completedCount;
  scheduledToday.textContent = scheduledCount;
  weeklyRate.textContent = `${overallWeeklyRate}%`;
}

function renderAll() {
  renderHabits();
  renderProgressCharts();
  updateStats();
  checkMilestones();
}

/* ADD HABIT */

addHabitBtn.addEventListener("click", () => {
  const habitName = habitInput.value.trim();

  if (habitName === "") {
    alert("Please enter a habit");
    return;
  }

  const newHabit = {
    name: habitName,
    tags: parseTags(habitTags.value),
    notes: habitNotes.value.trim(),
    goalText: habitGoal.value.trim(),
    reminderTime: habitReminder.value,
    schedule: getSelectedSchedule(),
    completionDates: [],
    completed: false,
    streak: 0,
    maxStreak: 0,
    lastCompleted: "",
    createdAt: getTodayString()
  };

  habits.push(newHabit);

  saveHabits();
  renderAll();

  habitInput.value = "";
  habitTags.value = "";
  habitNotes.value = "";
  habitGoal.value = "";
  habitReminder.value = "";
  document.querySelectorAll(".schedule-day").forEach(input => {
    input.checked = true;
  });
});

/* ENTER KEY SUPPORT */

habitInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addHabitBtn.click();
  }
});

/* THEME HANDLING */

function setTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️ Light Mode";
  } else {
    document.body.classList.remove("dark-mode");
    themeToggle.textContent = "🌙 Dark Mode";
  }

  localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme") || "light";
setTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-mode");
  setTheme(isDark ? "light" : "dark");
});

/* MILESTONE MODAL EVENT LISTENERS */

const closeModalBtn = document.getElementById("close-modal-btn");
const milestoneBtn = document.getElementById("milestone-btn");

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", hideMilestoneModal);
}

if (milestoneBtn) {
  milestoneBtn.addEventListener("click", hideMilestoneModal);
}

/* DELETE MODAL EVENT LISTENERS */

if (deleteCloseBtn) {
  deleteCloseBtn.addEventListener("click", closeDeleteModal);
}

if (deleteCancelBtn) {
  deleteCancelBtn.addEventListener("click", closeDeleteModal);
}

if (deleteConfirmBtn) {
  deleteConfirmBtn.addEventListener("click", () => {
    if (pendingDeleteIndex !== null) {
      habits.splice(pendingDeleteIndex, 1);
      saveHabits();
      renderAll();
    }
    closeDeleteModal();
  });
}

if (deleteModal) {
  deleteModal.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
      closeDeleteModal();
    }
  });
}

/* INITIAL RENDER & DAILY CHECK */

updateHabitsDailyStatus();
renderAll();