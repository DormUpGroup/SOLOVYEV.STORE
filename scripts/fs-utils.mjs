import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { platform } from "node:os";
import { sleep } from "./port-utils.mjs";

const DEFAULT_ATTEMPTS = 5;
const DEFAULT_DELAY_MS = 500;

export async function removeDirSafe(path, options = {}) {
  const { attempts = DEFAULT_ATTEMPTS, delayMs = DEFAULT_DELAY_MS } = options;

  if (!existsSync(path)) return;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      rmSync(path, { recursive: true, force: true });
      if (!existsSync(path)) return;
    } catch {
      // Retry after a short delay — common on Windows when handles are still open.
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  if (!existsSync(path)) return;

  if (platform() === "win32") {
    try {
      execSync(`cmd /c rmdir /s /q "${path}"`, { stdio: "ignore" });
      if (!existsSync(path)) return;
    } catch {
      // Fall through to final error.
    }
  }

  throw new Error(`Failed to remove directory: ${path}`);
}
