import { unified } from "unified";
import remarkParse from "remark-parse";

export type Section = {
  title: string;
  depth: number;
  content: string[];
  lists: string[][];
  tables: { headers: string[]; rows: string[][] }[];
};

function extractText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return (node.value as string) ?? "";
  if (node.type === "inlineCode") return (node.value as string) ?? "";
  if (Array.isArray(node.children)) return node.children.map(extractText).join("");
  return "";
}

export async function parseMarkdownSections(markdown: string): Promise<Section[]> {
  const file = await unified().use(remarkParse as any).parse(markdown);
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const node of (file as any).children as any[]) {
    if (node.type === "heading") {
      const title = extractText(node).trim();
      current = { title, depth: node.depth ?? 1, content: [], lists: [], tables: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue;
    if (node.type === "paragraph") {
      current.content.push(extractText(node).trim());
    } else if (node.type === "list") {
      const listItems: string[] = [];
      for (const item of node.children ?? []) {
        const text = extractText(item).trim();
        if (text) listItems.push(text);
      }
      current.lists.push(listItems);
    } else if (node.type === "table") {
      const headers: string[] = [];
      const rows: string[][] = [];
      const children = node.children ?? [];
      for (let i = 0; i < children.length; i++) {
        const row = children[i];
        const cells = (row.children ?? []).map((c: any) => extractText(c).trim());
        if (i === 0) headers.push(...cells);
        else rows.push(cells);
      }
      current.tables.push({ headers, rows });
    }
  }

  return sections;
}


