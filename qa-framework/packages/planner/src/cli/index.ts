#!/usr/bin/env node
const argv = process.argv.slice(2);
const command = argv[0];

async function main() {
  if (command === "emit:automation") {
    await import("./emit-automation.js");
    return;
  }
  if (command === "plan:emit") {
    await import("./emit.js");
    return;
  }
  if (command === "plan:review:init" || command === "plan:review:summary") {
    await import("./review.js");
    return;
  }
  if (command === "plan:validate") {
    await import("./validate.js");
    return;
  }
  // Default to manual CLI for backwards compatibility
  await import("./manual.js");
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});


