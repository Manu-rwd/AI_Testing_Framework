export type CrudSection = "Read" | "Create" | "Update" | "Delete" | "Activate";

export interface ColumnSpec {
  name: string;
  sortable: boolean;
  filter?: string;
  regex?: string;
}

export interface PageSignals {
  pagination?: { enabled: boolean; defaultPageSize?: number | null };
  sortingFields?: string[];
  breakpoints?: string[];
  resilience?: {
    offline?: boolean;
    slowNetwork?: boolean;
    loadingSLAms?: number | null;
    connDropOnAccess?: boolean;
    connDropDuringInteraction?: boolean;
  };
  authPatterns?: {
    unauthRedirect?: string | null;
    nonAdminRole?: boolean;
    unauthorizedHidden?: boolean;
    unauthorizedDisabled?: boolean;
    unauthorizedErrorOnClick?: boolean;
    unauthorized403Direct?: boolean;
  };
}

export interface PlanLiteSection {
  featureTitle: string;
  columns: ColumnSpec[];
  signals: PageSignals;
}

export interface PlanLite {
  sections: Partial<Record<CrudSection, PlanLiteSection>>;
}


