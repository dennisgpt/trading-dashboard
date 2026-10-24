#!/usr/bin/env node
// PreToolUse hook (matcher: Bash|PowerShell). Blocks raw `git push` in both shells so
// every push goes through scripts/push-branch.mjs, which enforces the branch rules.
// The Sixth Sense plugin only guards the Bash tool; this also covers PowerShell and
// keeps the rule in place if the plugin is removed.

const RAW_PUSH = /\bgit(?:\.exe)?(?:\s+-[cC]\s+\S+)*\s+push\b/i;

let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  data += chunk;
});
process.stdin.on("end", () => {
  let command;
  try {
    command = JSON.parse(data)?.tool_input?.command;
  } catch {
    process.exit(0);
  }
  if (typeof command !== "string" || !RAW_PUSH.test(command)) process.exit(0);

  process.stderr.write(
    "BLOCKED: raw git push is not allowed in this project. " +
      "Use `node scripts/push-branch.mjs [branch]` for feat/, fix/, docs/, chore/, ci/, refactor/ and test/ branches. " +
      "Force pushes, pushes to main and remote branch deletion stay blocked.\n",
  );
  process.exit(2);
});
