import { z } from "zod";

export const FacetRecord = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

const TableSchema = z.object({
  headers: FacetRecord.default({}),
  cells: FacetRecord.default({}),
  tooltips: FacetRecord.default({}),
  align: FacetRecord.default({})
});

const FormsSchema = z.object({
  input: FacetRecord.default({}),
  select: FacetRecord.default({}),
  textarea: FacetRecord.default({}),
  date: FacetRecord.default({})
});

const ToastsSchema = z.object({
  success: FacetRecord.default({}),
  warning: FacetRecord.default({}),
  error: FacetRecord.default({})
});

const ResponsiveSchema = z.object({
  breakpoints: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([])
});

export const ComponentsSchema = z.object({
  titles: FacetRecord.default({}),
  breadcrumbs: FacetRecord.default({}),
  tables: TableSchema.default({ headers: {}, cells: {}, tooltips: {}, align: {} }),
  buttons: FacetRecord.default({}),
  links: FacetRecord.default({}),
  badges: FacetRecord.default({}),
  forms: FormsSchema.default({ input: {}, select: {}, textarea: {}, date: {} }),
  toasts: ToastsSchema.default({ success: {}, warning: {}, error: {} }),
  modals: FacetRecord.default({}),
  loading_overlay: FacetRecord.default({}),
  pagination: FacetRecord.default({}),
  responsive: ResponsiveSchema.default({ breakpoints: [], rules: [] }),
  typography: FacetRecord.default({}),
  colors: FacetRecord.default({}),
  spacing: FacetRecord.default({}),
  icons: FacetRecord.default({})
});

export const UiuxSchema = z.object({
  source: z.literal("uiux_guide"),
  guide_hash: z.string(),
  uiux_version: z.string(),
  generated_at: z.string(),
  components: ComponentsSchema
});

export type Uiux = z.infer<typeof UiuxSchema>;


