import fs from "node:fs";
import YAML from "yaml";
import { Rules } from "./schema";
export * as v2 from "./v2/schema";
export function loadRules(filePath) {
    const text = fs.readFileSync(filePath, "utf8");
    const raw = YAML.parse(text);
    return Rules.parse(raw);
}
//# sourceMappingURL=index.js.map