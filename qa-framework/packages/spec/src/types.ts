export type Section = "Vizualizare" | "Adăugare" | "Modificare" | "Ștergere" | "Activare";

export type Tag =
  // presence & layout
  | "prezenta" | "pozitionare" | "dimensiune" | "container" | "container-comportament"
  | "container-tip_buton" | "container-tip_badge" | "sticky"
  // text & i18n
  | "text-valoare" | "text-traducere" | "text-culoare" | "mouseover"
  // behavior
  | "comportament" | "auto-hide" | "auto-hide-timp"
  // forms/validation
  | "comportament_validare_obligatoriu" | "comportament_validare_lungime"
  | "comportament_validare_regex" | "comportament_validare_paste"
  | "comportament_validare_reset" | "comportament_validare_blocare_submit"
  | "feedback_succes" | "feedback_eroare"
  // table/columns/sort/filter
  | "tabel" | "coloana" | "header" | "valoare" | "sortare" | "asc" | "desc" | "filtru"
  // pagination/search
  | "paginare" | "page-size" | "pager" | "cautare" | "gol" | "loading"
  // responsive
  | "responsive" | "xs" | "sm" | "md" | "lg" | "xl"
  // resilience
  | "offline" | "slow" | "drop" | "acces" | "interactiune" | "SLA"
  // overlays/meta
  | "overlay" | "auth" | "columns" | "presence" | "sorting" | "pagination" | "responsive_overlay" | "resilience_overlay"
  // breadcrumbs/actions
  | "breadcrumbs" | "actiuni" | "export" | "vizualizare" | "editare" | "stergere" | "adaugare";


