<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# The Future of Cursor Project Rules: Migration from .cursorrules to the New System

Your understanding is correct – **Cursor is indeed deprecating the `.cursorrules` file** in favor of a more powerful and flexible rules system. Here's a comprehensive overview of how to set up project rules in Cursor's new vision.

## The Current State: Deprecated vs. New Systems

The **`.cursorrules` file is officially deprecated** as of Cursor version 0.45, though it still works for backward compatibility. Cursor's development team strongly recommends migrating to the new Project Rules system, which offers significantly more control and flexibility.[^1][^2][^3][^4][^5]

## The New Project Rules System

### Core Structure

The new system uses **`.mdc` (Markdown Components) files** stored in the `.cursor/rules/` directory at your project root. The structure looks like this:[^2][^4][^1]

```
PROJECT_ROOT/
├── .cursor/
│   └── rules/
│       ├── your-rule-name.mdc
│       ├── frontend-standards.mdc
│       └── testing-guidelines.mdc
└── ...
```


### MDC File Format

Each rule file follows a specific structure with YAML frontmatter and markdown content:[^6][^4][^2]

```markdown
---
description: Brief explanation of the rule's purpose
globs: ["src/**/*.ts", "components/**/*.tsx"]
alwaysApply: false
---

# Rule Title

- Your detailed instructions go here
- Use markdown for clarity
- Reference other files with @path/to/file.ts
```


## Rule Types and Behavior

The new system supports four distinct rule types, determined by the metadata configuration:[^4][^7][^8]


| Rule Type | Configuration | Behavior |
| :-- | :-- | :-- |
| **Always** | `alwaysApply: true` | Always included in model context for every prompt |
| **Auto Attached** | `globs: ["pattern"]`, `alwaysApply: false` | Included when files matching glob patterns are referenced |
| **Agent Requested** | `description: "..."`, `alwaysApply: false` | AI decides whether to include based on relevance description |
| **Manual** | `alwaysApply: false` (or omitted) | Only included when explicitly mentioned with `@ruleName` |

### How Rule Activation Works

The system operates in two stages:[^9]

1. **Injection**: Rules are added to the system prompt context based on the metadata
2. **Activation**: The AI model decides whether to actually use the rule based on its `description` and relevance to the current task

## Creating Rules in the New System

### Method 1: Using the UI

1. Open Cursor Settings (`Cmd/Ctrl + Shift + J`)
2. Navigate to **General > Project Rules**
3. Click **"Add Rule"** to create a new `.mdc` file
4. Configure the rule type, description, and glob patterns
5. Write your rule content in the editor[^10][^11]

### Method 2: Command Palette

1. Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows/Linux)
2. Search for **"New Cursor Rule"**
3. Name your rule and configure it[^2][^6]

### Method 3: Generate from Chat

Use the `/Generate Cursor Rules` command in chat conversations to automatically create rules based on your interactions with the AI.[^6][^4]

## Alternative: AGENTS.md File

Cursor now also supports **`AGENTS.md`** as a simpler alternative for basic use cases. This is a plain markdown file placed in your project root:[^12][^4]

```markdown
# Project Instructions

## Code Style
- Use TypeScript for all new files
- Prefer functional components in React
- Use snake_case for database columns

## Architecture
- Follow the repository pattern
- Keep business logic in service layers
```

**Key differences from Project Rules:**

- Must be placed in project root (not `.cursor/rules/`)
- Plain markdown format (no metadata or complex configurations)
- Cannot be split across multiple files
- Perfect for simple, straightforward instructions[^4][^12]


## Migration Strategy

### From .cursorrules to Project Rules

1. **Copy your existing `.cursorrules` content** into a new `.mdc` file
2. **Add appropriate metadata** (description, globs, alwaysApply)
3. **Split large rule sets** into focused, topic-specific files
4. **Test the new rules** to ensure they work as expected
5. **Remove the old `.cursorrules` file** once migration is complete[^3][^13][^2]

### Best Practices for Organization

- Use **descriptive file names** with kebab-case (e.g., `frontend-standards.mdc`)
- **Group related rules** by topic or technology
- Keep rules **focused and specific** rather than trying to cover everything in one file
- Use **numerical prefixes** for loading order if needed (e.g., `001-core.mdc`, `002-frontend.mdc`)[^14]


## Advanced Features

### Nested Rules

You can create **subdirectory-specific rules** by placing `.cursor/rules/` directories in subdirectories. These automatically attach when files in their directory are referenced:[^4]

```
project/
├── .cursor/rules/          # Project-wide rules
├── backend/
│   └── .cursor/rules/      # Backend-specific rules
└── frontend/
    └── .cursor/rules/      # Frontend-specific rules
```


### File References

Include other files as context using the `@filename` syntax in your rules:[^2][^6]

```markdown
- Use our internal RPC pattern when defining services
- Always use snake_case for service names

@service-template.ts
```


## Timeline and Compatibility

While no specific deprecation timeline has been announced, Cursor's documentation consistently recommends migrating to the new system. The `.cursorrules` file continues to work but lacks the advanced features and flexibility of the new Project Rules system.[^5][^1][^3]

**Current status:**

- `.cursorrules` files still function but are marked as deprecated
- New Project Rules system is fully supported and actively developed
- `AGENTS.md` support was added in version 1.5
- Future versions will likely remove `.cursorrules` support entirely

The new system represents a significant upgrade in terms of flexibility, organization, and control over AI behavior, making migration worthwhile for any serious Cursor usage.
<span style="display:none">[^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37]</span>

<div style="text-align: center">⁂</div>

[^1]: https://www.instructa.ai/blog/cursor-ai/everything-you-need-to-know-cursor-rules

[^2]: https://kirill-markin.com/articles/cursor-ide-rules-for-ai/

[^3]: https://github.com/Mawla/cursor_rules

[^4]: https://docs.cursor.com/context/rules-for-ai

[^5]: https://cursor-docs.apidog.io/rules-for-ai-896238m0

[^6]: https://apidog.com/blog/awesome-cursor-rules/

[^7]: https://forum.cursor.com/t/correct-way-to-specify-rule-type/100672

[^8]: https://forum.cursor.com/t/my-take-on-cursor-rules/67535

[^9]: https://forum.cursor.com/t/a-deep-dive-into-cursor-rules-0-45/60721

[^10]: https://cursor101.com/cursor/rules

[^11]: https://ai-learningpath.nstech.com.br/pages/cursor/cursor_custom_instructions.html

[^12]: https://blog.kilocode.ai/p/agentsmd-may-trick-us-into-writing

[^13]: https://www.devshorts.in/p/how-to-use-cursor-rules

[^14]: https://forum.cursor.com/t/my-best-practices-for-mdc-rules-and-troubleshooting/50526

[^15]: https://www.sidetool.co/post/getting-started-with-cursor-installation-and-setup-guide

[^16]: https://www.reddit.com/r/cursor/comments/1ik06ol/a_guide_to_understand_new_cursorrules_in_045/

[^17]: https://ai-rockstars.com/cursor-ai-update-2025-new-tab-model-and-background-agent-change-development-work/

[^18]: https://dotcursorrules.com

[^19]: https://www.reddit.com/r/cursor/comments/1icmmb0/cursorrules_rules_for_ai_or_project_rules/

[^20]: https://cursor.com/changelog

[^21]: https://forum.cursor.com/t/generate-cursor-rules-created-a-deprecated-cursorrules-file/113200

[^22]: https://forum.cursor.com/t/bug-rules-in-rules-folder-require-undocumented-mdc-format-and-special-save-process/50379

[^23]: https://dev.to/dpaluy/mastering-cursor-rules-a-developers-guide-to-smart-ai-integration-1k65

[^24]: https://forum.cursor.com/t/can-anyone-help-me-use-this-new-cursor-rules-functionality/45692

[^25]: https://forum.cursor.com/t/optimal-structure-for-mdc-rules-files/52260

[^26]: https://forum.cursor.com/t/rules-in-cursor-settings-rules-for-ai-vs-cursorrules-files/11711

[^27]: https://forum.cursor.com/t/what-is-a-mdc-file/50417

[^28]: https://swiftpublished.com/article/cursor-rules,-docs,-ignore

[^29]: https://www.reddit.com/r/cursor/comments/1idg434/anyone_else_finding_the_the_new_mdc_cursorrules/

[^30]: https://forum.cursor.com/t/i-read-cursorrules-will-be-deprecated-please-dont/51779

[^31]: https://playbooks.com/rules/create-rules

[^32]: https://forum.cursor.com/t/rules-hierarchy-in-cursor/108589

[^33]: https://github.com/cline/cline/issues/5033

[^34]: https://github.com/digitalchild/cursor-best-practices

[^35]: https://www.haihai.ai/cursor-vs-claude-code/

[^36]: https://www.arsturn.com/blog/guide-to-setting-up-priority-rules-for-cursor-agents-to-follow-in-coding-tasks

[^37]: https://www.prompthub.us/blog/top-cursor-rules-for-coding-agents

