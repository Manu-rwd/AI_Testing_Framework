/** Canonical bucket → default tags to attach */
export const BUCKET_TAGS = {
    presence: ["prezenta", "container"],
    columns_header: ["tabel", "coloana", "header"],
    columns_value: ["tabel", "valoare"],
    sorting_asc: ["sortare", "asc"],
    sorting_desc: ["sortare", "desc"],
    pagination_selector: ["paginare", "page-size"],
    pagination_pager: ["paginare", "pager"],
    table_enhancements: ["cautare", "sticky"],
    responsive_md: ["responsive", "md"],
    resilience_offline: ["offline"],
    resilience_slow: ["slow"],
    resilience_loading_sla: ["loading", "SLA"],
    resilience_drop_access: ["drop", "acces"],
    resilience_drop_interaction: ["drop", "interactiune"],
    breadcrumbs: ["breadcrumbs", "text-valoare", "text-traducere", "pozitionare"],
    actions_view: ["actiuni", "vizualizare", "container-tip_buton"],
    actions_edit: ["actiuni", "editare", "container-tip_buton"],
    actions_delete: ["actiuni", "stergere", "container-tip_buton"],
    actions_add: ["actiuni", "adaugare", "container-tip_buton"]
};
/** Auth policy: no standalone auth variants; encode as permission metadata on cases. */
export const AUTH_POLICY = {
    standaloneLines: false,
    permissions: ["viewDocuments", "createDocument", "editDocument", "deleteDocument", "activateDocument"]
};
//# sourceMappingURL=vocabulary.js.map