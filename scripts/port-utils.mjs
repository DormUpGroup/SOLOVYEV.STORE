import { execSync } from "node:child_process";
import { platform } from "node:os";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPortInUse(port) {
  try {
    if (platform() === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
      });
      return output.split(/\r?\n/).some((line) => line.includes("LISTENING"));
    }

    execSync(`lsof -ti tcp:${port}`, { stdio: "ignore", shell: true });
    return true;
  } catch {
    return false;
  }
}

export function killPort(port) {
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
