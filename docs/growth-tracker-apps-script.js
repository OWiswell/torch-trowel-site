const TASKS_SHEET = "Tasks";
const RECOMMENDATIONS_SHEET = "Recommendation Log";

const TASK_HEADERS = [
  "ID",
  "Task",
  "Status",
  "Area",
  "Priority",
  "Owner",
  "Next Action",
  "Dependencies",
  "Due Date",
  "Done Date",
  "Related URL",
  "GitHub Commit",
  "Cloudflare Deploy",
  "Evidence / Notes",
  "Last Updated"
];

const RECOMMENDATION_HEADERS = [
  "Date",
  "Audit / Source",
  "Area",
  "Recommendation",
  "Reason / Evidence",
  "Priority",
  "Decision",
  "Converted Task ID",
  "Related URL",
  "Last Updated"
];

const STATUSES = ["Inbox", "Backlog", "Ready", "Doing", "Needs Review", "Deployed", "Measured", "Done"];
const PRIORITIES = ["High", "Medium", "Low"];
const FALLBACK_SPREADSHEET_ID = "1mR8rFkFXxUu_y5XPuTwqFmJeX3DkLV0gUCdeZ4wwZ3A";

function doGet() {
  return respond(loadTracker());
}

function doPost(e) {
  const body = parseBody(e);
  const token = PropertiesService.getScriptProperties().getProperty("TRACKER_API_TOKEN");

  if (token && body.token !== token) {
    return respond({ ok: false, error: "Unauthorized" }, 401);
  }

  const action = String(e.parameter.action || "dashboard");
  const payload = body.payload || {};

  if (action === "update-task") return respond(updateTask(payload));
  if (action === "add-recommendation") return respond(addRecommendation(payload));
  if (action === "add-task") return respond(addTask(payload));

  return respond({ ok: false, error: "Unknown action" }, 400);
}

function parseBody(e) {
  try {
    return JSON.parse(e.postData.contents || "{}");
  } catch (error) {
    return {};
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength || 500);
}

function today() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function sheetRows(sheetName, headers) {
  const sheet = trackerSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .map((row, index) => {
      const record = { rowNumber: index + 2 };
      headers.forEach((header, columnIndex) => {
        record[header] = row[columnIndex] || "";
      });
      return record;
    })
    .filter((record) => headers.some((header) => String(record[header] || "").trim()));
}

function loadTracker() {
  const tasks = sheetRows(TASKS_SHEET, TASK_HEADERS);
  const recommendations = sheetRows(RECOMMENDATIONS_SHEET, RECOMMENDATION_HEADERS);
  return {
    ok: true,
    tasks,
    recommendations,
    summary: buildSummary(tasks)
  };
}

function buildSummary(tasks) {
  const openTasks = tasks.filter((task) => !["Done", "Measured", "Deployed"].includes(task.Status));
  const countsByStatus = {};
  const countsByArea = {};

  tasks.forEach((task) => {
    countsByStatus[task.Status] = (countsByStatus[task.Status] || 0) + 1;
    countsByArea[task.Area] = (countsByArea[task.Area] || 0) + 1;
  });

  const next = openTasks
    .filter((task) => task.Priority === "High" && ["Ready", "Doing"].includes(task.Status))
    .concat(openTasks.filter((task) => task.Priority === "High" && task.Status === "Backlog"))
    .slice(0, 6);

  const blocked = openTasks
    .filter((task) => clean(task.Dependencies).length > 0)
    .slice(0, 8);

  return {
    totalTasks: tasks.length,
    openTasks: openTasks.length,
    completedTasks: tasks.length - openTasks.length,
    countsByStatus,
    countsByArea,
    next,
    blocked
  };
}

function rowFromTask(task) {
  return TASK_HEADERS.map((header) => task[header] || "");
}

function updateTask(payload) {
  const id = clean(payload.id, 20);
  const tasks = sheetRows(TASKS_SHEET, TASK_HEADERS);
  const task = tasks.find((item) => item.ID === id);

  if (!task) return { ok: false, error: "Task not found" };

  const editable = [
    "Status",
    "Priority",
    "Owner",
    "Next Action",
    "Dependencies",
    "Due Date",
    "Done Date",
    "GitHub Commit",
    "Cloudflare Deploy",
    "Evidence / Notes"
  ];

  editable.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      task[field] = clean(payload[field], 1500);
    }
  });

  if (!STATUSES.includes(task.Status)) return { ok: false, error: "Invalid status" };
  if (!PRIORITIES.includes(task.Priority)) return { ok: false, error: "Invalid priority" };

  task["Last Updated"] = today();
  if (["Done", "Measured", "Deployed"].includes(task.Status) && !task["Done Date"]) {
    task["Done Date"] = today();
  }

  SpreadsheetApp
    .openById(spreadsheetId())
    .getSheetByName(TASKS_SHEET)
    .getRange(task.rowNumber, 1, 1, TASK_HEADERS.length)
    .setValues([rowFromTask(task)]);

  return { ok: true, task };
}

function addRecommendation(payload) {
  const row = [
    today(),
    clean(payload["Audit / Source"] || payload.source || "Codex recommendation", 160),
    clean(payload.Area || payload.area || "Operations", 80),
    clean(payload.Recommendation || payload.recommendation, 1200),
    clean(payload["Reason / Evidence"] || payload.reason, 1500),
    PRIORITIES.includes(payload.Priority) ? payload.Priority : "Medium",
    clean(payload.Decision || payload.decision || "Inbox", 120),
    clean(payload["Converted Task ID"] || payload.taskId, 80),
    clean(payload["Related URL"] || payload.url, 400),
    today()
  ];

  if (!row[3]) return { ok: false, error: "Recommendation is required" };

  trackerSpreadsheet().getSheetByName(RECOMMENDATIONS_SHEET).appendRow(row);
  return { ok: true, recommendation: row };
}

function addTask(payload) {
  const tasks = sheetRows(TASKS_SHEET, TASK_HEADERS);
  const id = nextTaskId(tasks);
  const row = [
    id,
    clean(payload.Task || payload.task, 300),
    STATUSES.includes(payload.Status) ? payload.Status : "Inbox",
    clean(payload.Area || payload.area || "Operations", 80),
    PRIORITIES.includes(payload.Priority) ? payload.Priority : "Medium",
    clean(payload.Owner || payload.owner || "Matt / Codex", 120),
    clean(payload["Next Action"] || payload.nextAction, 500),
    clean(payload.Dependencies || payload.dependencies, 500),
    clean(payload["Due Date"] || payload.dueDate, 40),
    "",
    clean(payload["Related URL"] || payload.url, 400),
    "",
    "",
    clean(payload["Evidence / Notes"] || payload.notes, 1500),
    today()
  ];

  if (!row[1]) return { ok: false, error: "Task is required" };

  trackerSpreadsheet().getSheetByName(TASKS_SHEET).appendRow(row);
  return { ok: true, task: row };
}

function nextTaskId(tasks) {
  const max = tasks.reduce((highest, task) => {
    const match = String(task.ID || "").match(/^TT-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return "TT-" + String(max + 1).padStart(3, "0");
}

function spreadsheetId() {
  return PropertiesService.getScriptProperties().getProperty("TRACKER_SPREADSHEET_ID") || FALLBACK_SPREADSHEET_ID;
}

function trackerSpreadsheet() {
  return SpreadsheetApp.openById(spreadsheetId());
}
