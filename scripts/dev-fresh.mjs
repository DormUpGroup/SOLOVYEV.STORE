import { spawn } from "node:child_process";
import { platform } from "node:os";
import { removeDirSafe } from "./fs-utils.mjs";
import { killPort, sleep } from "./port-utils.mjs";

const PORT = 3000;
const POST_KILL_DELAY_MS = platform() === "win32" ? 1500 : 500;

killPort(PORT);
await sleep(POST_KILL_DELAY_MS);

await removeDirSafe(".next");
await removeDirSafe("out");

const child = spawn("npx", ["next", "dev", "--port", String(PORT)], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
