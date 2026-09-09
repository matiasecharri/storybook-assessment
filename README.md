# Psynth design engineer assessment

Take-home for a **design engineer** role: product UI craft plus design-system work (API, states, a11y, Storybook docs).

**Timebox: 6–8 hours.** Stop at 8. Three solid required stories beat eight half-finished ones. If you run out of time, say so in the README of your fork — we do not penalize work outside this contract.

Use this repository as a GitHub **template** (or fork it). Do not send a zip.

---

## The task

Psynth is a clinical reporting product. A clinician is inside a report (for example a neuropsychological evaluation) with the editor on the left and an **assistant panel** on the right.

The panel is about **420px wide** and viewport height. The clinician uses it to:

- ask a question about the case
- request a rewrite of a section
- inspect sources (a document, a report section, a session note)

They need to watch the answer arrive, stop a stream, and retry if a turn fails — without leaving the report.

> As a clinician, I want to ask the assistant to clarify a finding or rewrite a section, watch the answer arrive, and retry if it fails — without leaving the report.

There is **no production screenshot** in this repo on purpose. Propose the look and the component API using the tokens and primitives we shipped. Treat the primitive stories (`Primitives/*` in Storybook) as the documentation bar.

### What “done” looks like

A reviewer clones your repo, runs two commands, and can use the assistant as a **system of components** in Storybook:

```bash
npm install
npm test          # must stay green, including the tests you add
npm run storybook # http://localhost:6006 — this is the deliverable
```

Storybook is the deliverable; there is no separate demo page.

---

## What to build

Export these four from `src/assistant/index.ts`. You may add helpers (`CitationList`, `RetryBanner`, …). Reviewers only require the four.

| Component | Responsibility |
| --- | --- |
| `AssistantPanel` | Shell: header + scrollable thread + composer. **Controlled** props only. No global store. |
| `AssistantMessage` | One turn: user vs assistant, streaming, error, optional citations. |
| `Composer` | Input + send / stop. Disabled / stop state matches `status`. |
| `SuggestionChips` | Empty-state prompts. Choosing a chip is a submit path. |

Suggested types live in `src/assistant/types.ts`. You may extend them. Do not drop `user` / `assistant` or the status values.

`AssistantPanel` is controlled. Equivalent prop names are fine if the behavior matches:

| Prop | Role |
| --- | --- |
| `messages` | Thread so far |
| `status` | `idle` \| `streaming` \| `error` |
| `value` / `onValueChange` | Composer text |
| `onSubmit` / `onStop` | Send the current value / stop the stream |
| `onRetry(messageId)` | Retry a failed assistant turn |
| `onSuggestionSelect(prompt)` | Chip → prompt |
| `onCitationClick(citation)` | Source chip / link |

Mock streaming with `useFakeStream` from `src/fixtures` (or your own equivalent). Stories can keep panel state in the story file with `useState` — do not add Redux/Zustand for this.

Reuse `src/fixtures` (`sampleMessages`, `denseThread`, `errorMessage`, `sampleCitations`, `sampleSuggestions`, `clinician`). Do not invent real patient data.

---

## Required Storybook stories

Titles are **fixed** so we can compare submissions. Put them on `AssistantPanel` (or a thin wrapper that renders the panel).

| Title | What the reviewer must see |
| --- | --- |
| `Assistant/Panel/Empty` | Welcome + suggestion chips, no history, composer enabled |
| `Assistant/Panel/Streaming` | Assistant text growing; composer shows stop / is not submitting |
| `Assistant/Panel/Error` | Failed turn + retry; composer usable |
| `Assistant/Panel/WithCitations` | Answer with clickable sources (`document` / `section` / `note`) |
| `Assistant/Panel/DenseThread` | 8–12 messages; the thread scrolls; header and composer stay put |

Each of those stories needs:

- autodocs
- a short “when to use this” description
- at least one useful control (`status`, density, or content)

Stories for `AssistantMessage`, `Composer`, and `SuggestionChips` are expected; their titles are not locked.

---

## Tests you must add

`npm test` must stay green. Add tests under `src/assistant/` that cover:

1. **Composer** — submit via **click** and via **Enter**; while `status="streaming"`, show stop and do not submit.
2. **SuggestionChips** — activating a chip calls `onSuggestionSelect` with that prompt.
3. **Error retry** — retry calls `onRetry` with the failed message id.
4. **Role** — assistant vs user is exposed to assistive tech (accessible name / role, not color alone).

We do not require Storybook play functions, Chromatic, or E2E.

---

## Constraints

- Use the tokens and primitives in this template. Compose them. Do not install another design system (no shadcn/MUI/Chakra add).
- PHI-safe: sample fixtures only. Copy and `aria` must not pretend to be a real patient.
- Keyboard, visible focus, `prefers-reduced-motion`.
- Light and dark (Storybook theme toolbar).
- AI tools are allowed. Fill `DISCLOSURE.md` — empty “I used Cursor” is not enough.

## Out of scope

Do **not** spend the timebox on: backend, auth, persistence, microphone, a markdown editor, apply-to-document, prompt library.

Extra features do not count above the required stories and tests.

---

## What is already in this repo

| Path | What it is |
| --- | --- |
| `src/tokens/` | Semantic color/radius tokens, light + dark via `data-theme` |
| `src/primitives/` | `Button`, `IconButton`, `Input`, `Textarea`, `Text`, `Heading`, `Card`, `Spinner` — with documented stories |
| `src/fixtures/` | PHI-safe sample report, messages, citations, `useFakeStream` |
| `src/assistant/types.ts` | Suggested message model. **No assistant UI yet — that is your work.** |
| `DISCLOSURE.md` | Stub you replace |

---

## What you deliver

Send us the **GitHub repo URL** of your template/fork. Before you send it, this checklist should be true:

- [ ] `npm install && npm test && npm run storybook` works on a clean clone
- [ ] `src/assistant/index.ts` exports `AssistantPanel`, `AssistantMessage`, `Composer`, `SuggestionChips`
- [ ] The five story titles above exist and match the table
- [ ] The four test cases above exist under `src/assistant/` and `npm test` is green
- [ ] `DISCLOSURE.md` lists tools, what **you** decided, what the model generated, and what you would change with more time
- [ ] Optional: a short note in this README (your fork) if you stopped at 8 hours

We review for about 20–30 minutes: `npm test`, the five stories (light and dark), `DISCLOSURE.md`, and `src/assistant/index.ts`.

---

## Notes on this submission

**Timebox: 8 hours, used in full.** The surface here is larger than eight unassisted
hours would produce; the reason is that the work was done with Claude Code and Codex.
`DISCLOSURE.md` sets out what each tool did and which calls were mine.

### Where to look

| Path | What |
| --- | --- |
| `src/assistant/index.ts` | Public surface: `AssistantPanel`, `AssistantMessage`, `Composer`, `SuggestionChips`, plus the `CitationList` helper and the types |
| `Assistant/Overview` (Storybook) | The contract, the states table, and the accessibility decisions in one page |
| `src/assistant/mocks/` | Story-only harness. Fakes streaming with `useFakeStream` and owns thread state the way the product would — **not** exported from `index.ts` |
| `src/assistant/*/*.test.tsx` | Required interactions plus controller, focus and scroll regression checks |

Start with the five stories under `Assistant/Panel`. `thread` selects the fixture conversation,
`density` changes spacing, and `streamSpeedMs` sets the response speed. Changing the thread or speed
restarts the simulation. The harness updates `messages`, `value` and `status` as you interact;
the props table documents the controlled panel itself.

Try a new question from Error while the old failure remains, then retry it after the new answer
finishes. DenseThread includes paragraphs and citations: scroll up, expand the composer, and use
Jump to present to check how reading position and keyboard focus behave.

WithCitations exposes the `onCitationClick` callback inside Storybook, so you can see which
source a chip reports without leaving the story.

See `Assistant/Overview` for the component contract and accessibility behaviour, and
[DISCLOSURE.md](./DISCLOSURE.md) for AI assistance, verification and remaining limitations.
