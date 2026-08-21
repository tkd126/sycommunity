# Toolbar Action Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder and visually separate selection, generation, review, and result actions across all three teacher work tables.

**Architecture:** Keep action handlers inside their existing components and introduce only semantic toolbar group wrappers plus shared CSS. DOM order defines workflow order; responsive CSS wraps complete groups without changing button order.

**Tech Stack:** Next.js, React, TypeScript, CSS, Vitest, Testing Library

## Global Constraints

- Preserve all existing generation, copy, download, reset, and session-state behavior.
- Use Korean labels and the existing pastel-blue visual language.
- Apply the same workflow order to subject, club, and creative-activity tables.

---

### Task 1: Lock the toolbar workflow in tests

**Files:**
- Modify: `tests/report-generator.test.tsx`
- Modify: `tests/club-activity-generator.test.tsx`
- Modify: `tests/creative-activity-generator.test.tsx`

- [ ] Add assertions for labelled selection and generation groups.
- [ ] Assert the selection group appears before the generation group.
- [ ] Run the focused tests and verify they fail because the groups do not exist.

### Task 2: Implement semantic action groups

**Files:**
- Modify: `components/ReportGenerator.tsx`
- Modify: `components/ClubActivityGenerator.tsx`
- Modify: `components/CreativeActivityGenerator.tsx`
- Modify: `app/globals.css`

- [ ] Add `toolbar-workflow` and labelled `toolbar-action-group` wrappers.
- [ ] Place selection actions first, generation actions second, and result actions last.
- [ ] Add the creative-activity review group between selection and generation.
- [ ] Add shared pastel-blue generation emphasis and responsive wrapping styles.
- [ ] Run focused tests and verify they pass.

### Task 3: Verify the complete change

**Files:**
- Test: all affected component tests

- [ ] Run TypeScript checking.
- [ ] Run the affected component test suites.
- [ ] Confirm the local page responds and visually inspect the toolbar grouping.
