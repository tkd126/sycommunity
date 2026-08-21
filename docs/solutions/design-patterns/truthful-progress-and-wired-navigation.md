---
title: Truthful progress and wired navigation for long-running teacher workflows
date: 2026-07-20
category: design-patterns
module: report-generator-ui
problem_type: design_pattern
component: frontend_stimulus
severity: medium
applies_when:
  - Long-running file analysis must show progress without inventing completion estimates
  - Navigation contains planned destinations that are not implemented yet
  - Existing JSON API clients must remain compatible while a streaming client is introduced
tags:
  - progress-streaming
  - ndjson
  - navigation
  - user-trust
  - nextjs
---

# Truthful progress and wired navigation for long-running teacher workflows

## Context

The document-analysis screen showed only elapsed seconds, so teachers could not tell whether any file had completed. The sidebar also exposed management buttons with no destination. Both patterns weakened trust: elapsed time looked like progress without measuring work, and button styling promised behavior that did not exist.

## Guidance

Represent progress with completed work units, not a timer-derived percentage. The document parser counts every uploaded evaluation-plan, worksheet, and area-result file, reports completion in each promise's `finally`, then reserves final milestones for roster merging and result readiness (`app/api/parse-documents/route.ts:124`, `app/api/parse-documents/route.ts:130`, `app/api/parse-documents/route.ts:228`). This preserves parallel parsing while producing monotonic progress.

Use an opt-in streaming response so legacy callers remain valid. Requests accepting NDJSON receive progress events followed by one terminal result; ordinary callers still receive JSON (`app/api/parse-documents/route.ts:271`, `app/api/parse-documents/route.ts:278`). The client checks the response content type and supports both paths (`components/ReportGenerator.tsx:40`, `components/ReportGenerator.tsx:391`).

Only render navigation items with a real destination. The active top-level list contains the connected subject, club, creative-activity, and settings screens (`components/AppShell.tsx:7`). Creative activity has its own sidebar configuration (`components/Sidebar.tsx:15`), while placeholder management entries are omitted.

## Why This Matters

A percentage that increases with elapsed time can reach a convincing value even when work is stalled. A percentage computed from completed files tells the truth and makes failures diagnosable. Keeping the original parallel promises avoids turning better feedback into slower processing.

Likewise, hiding incomplete destinations is safer than displaying inert controls. Teachers can distinguish available tools from planned functionality without trial-and-error clicking.

## When to Apply

- File parsing, imports, exports, or batch generation has identifiable work units.
- The server can report unit completion but cannot know precise time remaining.
- A page must introduce progress streaming without breaking current JSON tests or clients.
- Product navigation includes future features that have not been connected.

## Examples

Before, the analysis button displayed only a file count and elapsed time:

```text
분석 중 6개 파일 · 16초
```

After, the UI displays server-reported completion and keeps time as secondary context (`components/ReportGenerator.tsx:839`):

```text
분석 중 67% · 4/6개 파일 · 16초
```

For content generation, encode concrete quality requirements in the prompt rather than only saying “write longer.” The subject prompt now requires exactly one 55–100-character sentence per selected area (`lib/prompt.ts:84`) and names the learning object, activity or reasoning process, and observable achievement.

## Related

- `docs/superpowers/specs/2026-07-20-navigation-analysis-progress-copy-creative-design.md`
- `docs/superpowers/plans/2026-07-20-navigation-analysis-progress-copy-creative.md`