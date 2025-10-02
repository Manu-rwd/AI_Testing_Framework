import { describe, it, expect } from "vitest";
import { deepMerge } from "../src/merge";
describe("deepMerge precedence", () => {
    const defaults = { a: 1, nested: { x: "d", z: 0 }, arr: [1] };
    const coverage = { nested: { x: "c" } };
    const uiux = { nested: { x: "u", y: "u-y" }, arr: [2, 3] };
    const project = { a: 2, nested: { y: "p-y" } };
    const us = { a: 3, nested: { x: "us-x" } };
    it("US wins over others; arrays pick first non-empty by precedence; objects merge deterministically with provenance", () => {
        const out = deepMerge({ defaults, coverage, uiux, project, us });
        // primitives
        expect(out.a).toBe(3);
        expect(out.a__prov.source).toBe("us");
        // nested merge
        expect(out.nested.x).toBe("us-x");
        expect(out.nested.x__prov.source).toBe("us");
        expect(out.nested.y).toBe("p-y");
        expect(out.nested.y__prov.source).toBe("project");
        expect(out.nested.z).toBe(0);
        expect(out.nested.z__prov.source).toBe("defaults");
        // arrays choose first non-empty by precedence (uiux before coverage/defaults)
        expect(out.arr).toEqual([2, 3]);
        // snapshot stability
    expect(out).toMatchInlineSnapshot(`
      Object {
        "a": 3,
        "a__prov": Object {
          "confidence_bump": 0,
          "source": "us",
        },
        "arr": Array [
          2,
          3,
        ],
        "nested": Object {
          "x": "us-x",
          "x__prov": Object {
            "confidence_bump": 0,
            "source": "us",
          },
          "y": "p-y",
          "y__prov": Object {
            "confidence_bump": 0.03,
            "source": "project",
          },
          "z": 0,
          "z__prov": Object {
            "confidence_bump": 0,
            "source": "defaults",
          },
        },
      }
    `);
    });
});
//# sourceMappingURL=merge.spec.js.map