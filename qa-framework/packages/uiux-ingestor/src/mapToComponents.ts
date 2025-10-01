import { normalizeFacetList, normalizeFacetRecord } from "./normalizeFacets";

export type Section = {
  title: string;
  depth: number;
  content: string[];
  lists: string[][];
  tables: { headers: string[]; rows: string[][] }[];
};

export type Components = {
  [k: string]: any;
};

function collectText(section: Section): string[] {
  const texts: string[] = [];
  texts.push(...section.content);
  for (const list of section.lists) texts.push(...list);
  for (const table of section.tables) {
    texts.push(...table.headers);
    for (const row of table.rows) texts.push(...row);
  }
  return texts;
}

function titleIncludes(section: Section, needle: string): boolean {
  return section.title.toLowerCase().includes(needle.toLowerCase());
}

function ensure<T extends object>(obj: any, key: string, fallback: T): T {
  if (!obj[key]) obj[key] = fallback;
  return obj[key] as T;
}

export function mapSectionsToComponents(sections: Section[]): Components {
  const components: Components = {
    titles: {},
    breadcrumbs: {},
    tables: { headers: {}, cells: {}, tooltips: {}, align: {} },
    buttons: {},
    links: {},
    badges: {},
    forms: { input: {}, select: {}, textarea: {}, date: {} },
    toasts: { success: {}, warning: {}, error: {} },
    modals: {},
    loading_overlay: {},
    pagination: {},
    responsive: { breakpoints: [], rules: [] },
    typography: {},
    colors: {},
    spacing: {},
    icons: {}
  };

  for (const section of sections) {
    const tokens = normalizeFacetList(collectText(section));

    if (titleIncludes(section, "title")) {
      components.titles = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "breadcrumb")) {
      components.breadcrumbs = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "table")) {
      const headers = section.tables[0]?.headers ?? [];
      const cells = section.tables.flatMap(t => t.rows.flat());
      components.tables.headers = normalizeFacetRecord({ headers });
      components.tables.cells = normalizeFacetRecord({ cells });
      // derive align and tooltips from tokens/text
      const aligns = tokens.filter(t => t.startsWith("align."));
      components.tables.align = normalizeFacetRecord({ aligns });
      const tt = tokens.filter(t => t.includes("tooltip") || t.includes("color."));
      components.tables.tooltips = normalizeFacetRecord({ tt });
    }
    if (titleIncludes(section, "button")) {
      components.buttons = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "link")) {
      components.links = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "badge")) {
      components.badges = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "form")) {
      const input = tokens.filter(t => t.includes("input") || t.includes("placeholder") || t.includes("font"));
      const select = tokens.filter(t => t.includes("select"));
      const textarea = tokens.filter(t => t.includes("textarea"));
      const date = tokens.filter(t => t.includes("date"));
      components.forms.input = normalizeFacetRecord({ input });
      components.forms.select = normalizeFacetRecord({ select });
      components.forms.textarea = normalizeFacetRecord({ textarea });
      components.forms.date = normalizeFacetRecord({ date });
    }
    if (titleIncludes(section, "toast")) {
      const success = tokens.filter(t => t.includes("success") || t.includes("green"));
      const warning = tokens.filter(t => t.includes("warning") || t.includes("yellow"));
      const error = tokens.filter(t => t.includes("error") || t.includes("red"));
      components.toasts.success = normalizeFacetRecord({ success });
      components.toasts.warning = normalizeFacetRecord({ warning });
      components.toasts.error = normalizeFacetRecord({ error });
    }
    if (titleIncludes(section, "modal")) {
      components.modals = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "loading") || titleIncludes(section, "overlay")) {
      components.loading_overlay = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "pagination")) {
      components.pagination = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "responsive") || titleIncludes(section, "breakpoint")) {
      const breakpoints = Array.from(new Set(tokens.filter(t => /\b\d{2,4}\b/.test(t))))
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      const rules = tokens.filter(t => t.includes("responsive"));
      components.responsive.breakpoints = breakpoints;
      components.responsive.rules = normalizeFacetList(rules);
    }
    if (titleIncludes(section, "typography") || titleIncludes(section, "font")) {
      components.typography = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "color")) {
      components.colors = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "spacing") || titleIncludes(section, "space") || titleIncludes(section, "margin") || titleIncludes(section, "padding")) {
      components.spacing = normalizeFacetRecord({ tokens });
    }
    if (titleIncludes(section, "icon")) {
      components.icons = normalizeFacetRecord({ tokens });
    }
  }

  return components;
}


