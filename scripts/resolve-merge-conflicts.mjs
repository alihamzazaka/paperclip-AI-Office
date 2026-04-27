/**
 * Resolves git merge conflicts in specific files by taking the "theirs" side
 * for every conflict block. Non-conflicted (auto-merged) sections are preserved.
 *
 * Run: node scripts/resolve-merge-conflicts.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const root = dirname(dirname(fileURLToPath(import.meta.url)));

const files = [
  "packages/adapter-utils/src/server-utils.ts",
  "server/src/adapters/registry.ts",
  "ui/src/adapters/registry.ts",
];

const SHA = "d2cbe2cb238deb685765942b93e67c9b1e835223";

function takeAllTheirs(content) {
  // Matches: <<<<<<< HEAD\n...\n=======\n(theirs_content)\n>>>>>>> sha\n
  const pattern = new RegExp(
    `<<<<<<< HEAD\\r?\\n[\\s\\S]*?=======\\r?\\n([\\s\\S]*?)>>>>>>> ${SHA}\\r?\\n?`,
    "g",
  );
  return content.replace(pattern, (_match, theirs) => theirs);
}

for (const rel of files) {
  const filePath = join(root, rel);
  const content = readFileSync(filePath, "utf8");
  const resolved = takeAllTheirs(content);
  if (resolved === content) {
    console.log(`No conflicts found: ${rel}`);
  } else {
    writeFileSync(filePath, resolved, "utf8");
    console.log(`Resolved: ${rel}`);
  }
}
