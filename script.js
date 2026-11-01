/* Taskpad — Kanban board (vanilla JS)
   Structure:  STORE (state + localStorage)  ->  VIEW (small render functions)  ->  EVENTS
   Flow:       user action -> update(state) -> save() -> render() */

/* ---------- Constants & helpers ---------- */
const STATUSES = [
  { id: "todo", label: "To Do", icon: "📝", tint: "var(--lilac)" },
  { id: "progress", label: "In Progress", icon: "🚀", tint: "var(--butter)" },
  { id: "done", label: "Completed", icon: "🎉", tint: "var(--mint)" },
];
const PRIORITY = { high: "High", medium: "Medium", low: "Low" };
const KEY = "taskpad.v1";

const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const iso = (d) => {
  const z = new Date(d);
  z.setMinutes(z.getMinutes() - z.getTimezoneOffset());
  return z.toISOString().slice(0, 10);
};
const today = () => iso(new Date());
const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const fmt = (d) =>
  new Date(d + "T00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

/* ---------- STORE: single source of truth ---------- */
function seed() {
  return [
    {
      id: uid(),
      title: "Design landing page",
      description: "Hero, features and pricing sections in Figma.",
      priority: "high",
      due: inDays(2),
      status: "progress",
    },
    {
      id: uid(),
      title: "Write project README",
      description: "Setup steps, screenshots and live link.",
      priority: "medium",
      due: inDays(5),
      status: "todo",
    },
    {
      id: uid(),
      title: "Fix mobile navbar",
      description: "Menu overlaps the logo on small screens.",
      priority: "high",
      due: inDays(-1),
      status: "todo",
    },
    {
      id: uid(),
      title: "Pick colour palette",
      description: "",
      priority: "low",
      due: inDays(-3),
      status: "done",
    },
  ];
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(d)) return d;
  } catch {}
  return seed();
}
const state = {
  tasks: load(),
  filters: { q: "", priority: "all", status: "all" },
};

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.tasks));
  } catch {}
}
function update(fn) {
  fn(state);
  save();
  render();
}

/* ---------- Selectors ---------- */
function visibleTasks() {
  const { q, priority, status } = state.filters;
  const s = q.trim().toLowerCase();
  return state.tasks.filter(
    (t) =>
      (!s || t.title.toLowerCase().includes(s)) &&
      (priority === "all" || t.priority === priority) &&
      (status === "all" || t.status === status),
  );
}
function dueInfo(t) {
  if (!t.due) return null;
  if (t.status === "done") return { text: fmt(t.due), cls: "" };
  const diff = Math.round(
    (new Date(t.due + "T00:00") - new Date(today() + "T00:00")) / 864e5,
  );
  if (diff < 0) return { text: "Overdue · " + fmt(t.due), cls: "late" };
  if (diff === 0) return { text: "Due today", cls: "soon" };
  if (diff === 1) return { text: "Due tomorrow", cls: "soon" };
  return { text: "Due " + fmt(t.due), cls: "" };
}
const isFiltered = () =>
  state.filters.q ||
  state.filters.priority !== "all" ||
  state.filters.status !== "all";

/* ---------- VIEW: small "components" ---------- */
const TaskCard = (t) => {
  const d = dueInfo(t),
    i = STATUSES.findIndex((s) => s.id === t.status);
  return `<article class="card" draggable="true" data-id="${t.id}">
    <div class="card-top"><span class="tag ${t.priority}">${PRIORITY[t.priority]}</span>${d ? `<span class="due ${d.cls}">${esc(d.text)}</span>` : ""}</div>
    <h3>${esc(t.title)}</h3>${t.description ? `<p>${esc(t.description)}</p>` : ""}
    <div class="card-actions">
      <button data-act="prev" title="Move left" aria-label="Move to previous column" ${i === 0 ? "disabled" : ""}>←</button>
      <button data-act="next" title="Move right" aria-label="Move to next column" ${i === 2 ? "disabled" : ""}>→</button>
      <span class="sp"></span>
      <button data-act="edit" title="Edit" aria-label="Edit task">✎</button>
      <button data-act="del" title="Delete" aria-label="Delete task">🗑</button>
    </div></article>`;
};
const Column = (
  s,
  tasks,
) => `<section class="col" data-status="${s.id}" style="--tint:${s.tint}">
  <header class="col-head"><h2>${s.icon} ${s.label}</h2><b class="count">${tasks.length}</b></header>
  <div class="list">${tasks.map(TaskCard).join("") || `<div class="empty">${isFiltered() ? "No matching tasks" : "Drop tasks here"}</div>`}</div></section>`;

function renderStats(shown) {
  const total = state.tasks.length,
    t = today();
  const late = state.tasks.filter(
    (x) => x.status !== "done" && x.due && x.due < t,
  ).length;
  const done = state.tasks.filter((x) => x.status === "done").length;
  $("#stats").innerHTML =
    `<span class="chip">📋 ${isFiltered() ? `${shown.length} of ${total}` : total} tasks</span>` +
    `<span class="chip">✅ ${done} completed</span>` +
    (late ? `<span class="chip warn">⏰ ${late} overdue</span>` : "");
}
function render() {
  const shown = visibleTasks();
  const cols = STATUSES.filter(
    (s) => state.filters.status === "all" || s.id === state.filters.status,
  );
  const board = $("#board");
  board.style.setProperty("--cols", cols.length);
  board.innerHTML = cols
    .map((s) =>
      Column(
        s,
        shown.filter((t) => t.status === s.id),
      ),
    )
    .join("");
  renderStats(shown);
}

/* ---------- Actions ---------- */
function move(id, status) {
  update((s) => {
    const i = s.tasks.findIndex((t) => t.id === id);
    if (i < 0 || s.tasks[i].status === status) return;
    const [t] = s.tasks.splice(i, 1);
    t.status = status;
    s.tasks.push(t);
  });
}

/* ---------- Board events (event delegation) ---------- */
const board = $("#board");
board.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.closest(".card").dataset.id,
    task = state.tasks.find((t) => t.id === id);
  const i = STATUSES.findIndex((s) => s.id === task.status),
    act = btn.dataset.act;
  if (act === "prev") move(id, STATUSES[i - 1].id);
  if (act === "next") move(id, STATUSES[i + 1].id);
  if (act === "edit") openModal(task);
  if (act === "del") {
    // two-step delete: click twice to confirm
    if (btn.dataset.sure)
      return update((s) => (s.tasks = s.tasks.filter((t) => t.id !== id)));
    btn.dataset.sure = "1";
    btn.textContent = "Sure?";
    btn.classList.add("sure");
    setTimeout(() => {
      if (btn.isConnected) {
        delete btn.dataset.sure;
        btn.textContent = "🗑";
        btn.classList.remove("sure");
      }
    }, 2500);
  }
});
/* drag & drop between columns */
board.addEventListener("dragstart", (e) => {
  const c = e.target.closest(".card");
  if (!c) return;
  e.dataTransfer.setData("text/plain", c.dataset.id);
  e.dataTransfer.effectAllowed = "move";
  requestAnimationFrame(() => c.classList.add("dragging"));
});
board.addEventListener("dragend", () =>
  document
    .querySelectorAll(".dragging,.over")
    .forEach((el) => el.classList.remove("dragging", "over")),
);
board.addEventListener("dragover", (e) => {
  const col = e.target.closest(".col");
  if (!col) return;
  e.preventDefault();
  document
    .querySelectorAll(".over")
    .forEach((el) => el !== col && el.classList.remove("over"));
  col.classList.add("over");
});
board.addEventListener("drop", (e) => {
  const col = e.target.closest(".col");
  if (!col) return;
  e.preventDefault();
  move(e.dataTransfer.getData("text/plain"), col.dataset.status);
});

/* ---------- Add / Edit modal ---------- */
const modal = $("#modal"),
  form = $("#form");
let editingId = null;

function openModal(task) {
  editingId = task ? task.id : null;
  $("#mTitle").textContent = task ? "Edit task" : "New task";
  form.reset();
  $("#fTitle").value = task ? task.title : "";
  $("#fDesc").value = task ? task.description : "";
  $("#fDue").value = task ? task.due : inDays(3);
  $("#fState").value = task ? task.status : "todo";
  form.querySelector(
    `input[name=priority][value=${task ? task.priority : "medium"}]`,
  ).checked = true;
  modal.showModal();
  $("#fTitle").focus();
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#fTitle").value.trim();
  if (!title) return $("#fTitle").focus();
  const data = {
    title,
    description: $("#fDesc").value.trim(),
    due: $("#fDue").value,
    priority: form.querySelector("input[name=priority]:checked").value,
    status: $("#fState").value,
  };
  update((s) =>
    editingId
      ? Object.assign(
          s.tasks.find((t) => t.id === editingId),
          data,
        )
      : s.tasks.push({ id: uid(), ...data }),
  );
  modal.close();
});
$("#addBtn").addEventListener("click", () => openModal());
$("#cancelBtn").addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.close();
});

/* ---------- Search & filters ---------- */
$("#search").addEventListener("input", (e) => {
  state.filters.q = e.target.value;
  render();
});
$("#fPriority").addEventListener("change", (e) => {
  state.filters.priority = e.target.value;
  render();
});
$("#fStatus").addEventListener("change", (e) => {
  state.filters.status = e.target.value;
  render();
});
$("#resetBtn").addEventListener("click", () => {
  state.filters = { q: "", priority: "all", status: "all" };
  $("#search").value = "";
  $("#fPriority").value = "all";
  $("#fStatus").value = "all";
  document.body.classList.add("boot"); // card pop-in only on first load
  render();
  setTimeout(() => document.body.classList.remove("boot"), 900);
});
document.addEventListener("keydown", (e) => {
  // press "/" to jump to search
  if (
    e.key === "/" &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)
  ) {
    e.preventDefault();
    $("#search").focus();
  }
});

document.body.classList.add("boot"); // card pop-in only on first load
render();
setTimeout(() => document.body.classList.remove("boot"), 900);
