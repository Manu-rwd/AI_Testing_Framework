#!/usr/bin/env node
import fs from "node:fs";
import { visibleDiff } from "../util/visibleDiff";

const [, , actualPath, expectedPath] = process.argv;
if (!actualPath || !expectedPath) {
  console.error("Usage: tsx packages/planner/src/cli/verify-snapshot.ts <actual.md> <expected.md>");
  process.exit(2);
}

const actual = fs.readFileSync(actualPath, "utf8");
const expected = fs.readFileSync(expectedPath, "utf8");
const res = visibleDiff(actual, expected);
if (!res.ok) {
  console.error(res.message);
  process.exit(1);
}
console.log("✅ Snapshot match.");


