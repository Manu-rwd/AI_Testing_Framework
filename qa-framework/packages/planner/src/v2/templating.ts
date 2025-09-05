type Dict = Record<string, any>;

function get(obj: Dict, path: string): any {
  return path.split(".").reduce((acc, k) => (acc && k in acc ? acc[k] : undefined), obj);
}

/** Tiny mustache-like replacer for {{var}} */
export function tmpl(input: string, ctx: Dict): string {
  return input.replace(/{{\s*([\w.]+)\s*}}/g, (_, p1) => {
    const v = get(ctx, p1);
    return v === undefined || v === null ? "" : String(v);
  });
}

export function tmplMany(arr: string[], ctx: Dict): string[] {
  return arr.map((s) => tmpl(s, ctx));
}


