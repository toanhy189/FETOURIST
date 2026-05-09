const { spawn } = require("node:child_process");
const path = require("node:path");

const frontendDir = path.resolve(__dirname, "..");
const backendDir = process.env.BETOURIST_BACKEND_DIR || "D:\\BETOURIST";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const tasks = [
  {
    name: "backend-api",
    cwd: backendDir,
    args: ["run", "dev"],
  },
  {
    name: "backend-worker",
    cwd: backendDir,
    args: ["run", "worker"],
  },
  {
    name: "frontend",
    cwd: frontendDir,
    args: ["run", "dev"],
  },
];

const children = [];
let shuttingDown = false;

function stopAll(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  children.forEach((child) => {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  });

  setTimeout(() => process.exit(exitCode), 500).unref();
}

tasks.forEach((task) => {
  const child = spawn(npmCommand, task.args, {
    cwd: task.cwd,
    stdio: "inherit",
    env: process.env,
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    console.log(`[${task.name}] stopped with ${signal || `code ${code}`}.`);
    stopAll(code || 0);
  });
});

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
