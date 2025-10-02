import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    reporters: ["default"],
    snapshotFormat: { escapeString: true, printBasicPrototype: true }
  }
});


