# @pkg/uiux-converter

Convert the UI/UX PDF to normalized Markdown (and optional HTML).

## Local binaries (no PATH required)

Place portable tools in the repo and the CLI will auto-discover them:

- Pandoc: `qa-framework/tools/pandoc/pandoc.exe` (Windows) or `qa-framework/tools/pandoc/pandoc`
- Poppler pdftohtml: `qa-framework/tools/poppler/bin/pdftohtml.exe` (Windows) or `qa-framework/tools/poppler/bin/pdftohtml`

Usage with auto-discovery:

```powershell
pnpm -C qa-framework uiux:convert -- --in "input/Ghid UIUX - Norme si bune practici 1.pdf" --out "temp/uiux_guide.md"
```

Explicit binary flags override detection:

```powershell
pnpm -C qa-framework uiux:convert -- --in "input/Ghid UIUX - Norme si bune practici 1.pdf" --out "temp/uiux_guide.md" --pandoc .\tools\pandoc\pandoc.exe
```

The CLI logs which backend is used, e.g. `Using pandoc at: <path>`.
