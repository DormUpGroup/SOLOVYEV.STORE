import { execSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { platform } from "node:os";

const PORT = 3000;

function killPort(port) {
  try {
    if (platform() === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
      });
      const pids = new Set();

      for (const line of output.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts.at(-1);
        if (pid && pid !== "0") pids.add(pid);
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`Stopped process ${pid} on port ${port}`);
        } catch {
          // Process may already be gone.
        }
      }
      return;
    }

    execSync(`lsof -ti tcp:${port} | xargs kill -9`, {
      stdio: "ignore",
      shell: true,
    });
  } catch {
    // Nothing is listening on the port.
  }
}

function clean() {
  rmSync(".next", { recursive: true, force: true });
  rmSync("out", { recursive: true, force: true });
}

killPort(PORT);
clean();

const child = spawn("npx", ["next", "dev", "--port", String(PORT)], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
