#!/usr/bin/env node
// Pushes a feature branch to origin with guardrails. This is the only sanctioned way
// for Claude to push (see CLAUDE.md, "Pushing"): raw pushes stay blocked by hooks.
//
// Usage: node scripts/push-branch.mjs [branch]   (defaults to the current branch)
//
// Rules: only feat/, fix/, docs/, chore/, ci/, refactor/, test/ branches; never main;
// no flags at all, so no force push; the refspec always has a source, so no deletion.

import { execFileSync } from "node:child_process";

const ALLOWED_BRANCH = /^(feat|fix|docs|chore|ci|refactor|test)\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

function fail(message) {
  console.error(`push-branch: ${message}`);
  process.exit(1);
}

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", ...options });
}

const args = process.argv.slice(2);
if (args.length > 1) fail("expected at most one argument (the branch name)");
if (args.some((arg) => arg.startsWith("-"))) fail("flags are not allowed (no --force, -f, --delete, ...)");

const branch = args[0] ?? git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();

if (branch === "HEAD") fail("detached HEAD, check out a branch first");
if (branch === "main" || branch === "master") fail(`pushing to ${branch} is not allowed, open a pull request`);
if (!ALLOWED_BRANCH.test(branch) || branch.includes("..")) {
  fail(`branch "${branch}" is not allowed; use feat/, fix/, docs/, chore/, ci/, refactor/ or test/`);
}

try {
  git(["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]);
} catch {
  fail(`local branch "${branch}" does not exist`);
}

// Explicit refspec without a leading "+": a non-fast-forward update is rejected by git.
git(["push", "--set-upstream", "origin", `refs/heads/${branch}:refs/heads/${branch}`], { stdio: "inherit" });
