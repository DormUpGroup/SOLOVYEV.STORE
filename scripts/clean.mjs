import { removeDirSafe } from "./fs-utils.mjs";

await removeDirSafe(".next");
await removeDirSafe("out");
