import { isPortInUse } from "./port-utils.mjs";

const DEV_PORT = 3000;

if (isPortInUse(DEV_PORT)) {
  console.error(
    `\nBuild blocked: port ${DEV_PORT} is in use (dev server is likely running).`,
  );
  console.error(
    "Running 'next build' while 'next dev' is active can corrupt the .next cache.",
  );
  console.error("\nStop the dev server first, or run: npm run dev:fresh\n");
  process.exit(1);
}
