import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const planPath = join(root, "product-plan.json");
const sprintPath = join(root, "NEXT-SPRINT.md");
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const args = new Set(process.argv.slice(2));

function allTasks() {
  return plan.phases.flatMap((phase) =>
    phase.tasks.map((task) => ({ ...task, phase: phase.id, gate: phase.gate })),
  );
}

function currentPhase() {
  return plan.phases.find((phase) => phase.id === plan.currentPhase) || plan.phases[0];
}

function priority(task) {
  const statusBonus = task.status === "next" ? 100 : 0;
  return statusBonus + task.impact * 3 - task.effort;
}

function selectSprint(limit = 3) {
  return currentPhase().tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => priority(b) - priority(a))
    .slice(0, limit);
}

function buildProject() {
  try {
    const output = join(root, "dist", "index.html");
    if (!existsSync(output)) {
      return { ok: false, detail: "No production build found. Run npm run build." };
    }
    const sourceTime = Math.max(
      statSync(join(root, "src", "App.jsx")).mtimeMs,
      statSync(join(root, "src", "styles.css")).mtimeMs,
    );
    const buildTime = statSync(output).mtimeMs;
    return buildTime >= sourceTime
      ? { ok: true, detail: "Production build exists and is current." }
      : { ok: false, detail: "Source changed after the last build. Run npm run build." };
  } catch (error) {
    return {
      ok: false,
      detail: error.stdout?.toString() || error.stderr?.toString() || error.message,
    };
  }
}

function completeTask(id) {
  let found = false;
  for (const phase of plan.phases) {
    const task = phase.tasks.find((item) => item.id === id);
    if (task) {
      task.status = "done";
      found = true;
    }
  }
  if (!found) throw new Error(`Unknown task: ${id}`);
  writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`);
}

function sprintMarkdown(tasks, build) {
  const phase = currentPhase();
  const lines = [
    "# Pocket Planet Next Sprint",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Current phase: **${phase.id}**`,
    `Phase gate: ${phase.gate}`,
    `Build status: **${build.ok ? "PASS" : "FAIL"}** - ${build.detail.split("\n")[0]}`,
    "",
    "## Product Rule",
    "",
    "Do not begin retention, growth, or monetization work until the current phase gate is measured and passed.",
    "",
    "## Selected Work",
    "",
  ];

  tasks.forEach((task, index) => {
    lines.push(`### ${index + 1}. ${task.title}`);
    lines.push("");
    lines.push(`- ID: \`${task.id}\``);
    lines.push(`- Owner: ${task.owner}`);
    lines.push(`- Impact / effort: ${task.impact} / ${task.effort}`);
    lines.push("- Acceptance:");
    task.acceptance.forEach((item) => lines.push(`  - ${item}`));
    lines.push("");
  });

  lines.push("## Validation Metrics");
  lines.push("");
  lines.push("- First meaningful interaction within 10 seconds.");
  lines.push("- Detail-scene open rate above 45%.");
  lines.push("- Detail-scene completion above 60%.");
  lines.push("- Immediate retry or second-region exploration above 35%.");
  lines.push("- No paid acquisition until at least five external playtests are recorded.");
  lines.push("");
  lines.push("## Commands");
  lines.push("");
  lines.push("```powershell");
  lines.push("npm run autopilot");
  lines.push("npm run autopilot:status");
  lines.push("npm run autopilot:complete -- forest-detail");
  lines.push("```");
  return `${lines.join("\n")}\n`;
}

if (args.has("--complete")) {
  const marker = process.argv.indexOf("--complete");
  const id = process.argv[marker + 1];
  if (!id) throw new Error("Pass a task id after --complete.");
  completeTask(id);
  console.log(`Completed ${id}.`);
}

const build = buildProject();
const sprint = selectSprint();
writeFileSync(sprintPath, sprintMarkdown(sprint, build));

if (args.has("--status")) {
  const tasks = allTasks();
  console.log(JSON.stringify({
    phase: plan.currentPhase,
    complete: tasks.filter((task) => task.status === "done").length,
    remaining: tasks.filter((task) => task.status !== "done").length,
    next: sprint.map((task) => task.id),
    build: build.ok,
  }, null, 2));
} else {
  console.log(`Generated ${sprintPath}`);
  console.log(`Next: ${sprint.map((task) => task.id).join(", ")}`);
  if (!build.ok) process.exitCode = 1;
}
