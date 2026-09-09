# AI disclosure

**Timebox: 8 hours, used in full.** AI assistance contributed substantially to the implementation.

## Tools and responsibility

- **Claude Code** generated the assistant components, hooks, mock controller, stories, tests and
  the first documentation draft.
- **Codex** reviewed the code and browser behaviour, implemented agreed corrections, added
  regression tests and helped edit the documentation.
- **I directed the product and visual design**, reviewed the implementation and proposed changes
  to its structure and component props. Some decisions started with me; others emerged during
  AI-assisted reviews and were explicitly retained, changed or rejected by me.
- The local **transitions.dev skill** informed motion patterns, adapted to the existing CSS and
  tokens. No dependencies or alternative design system were added.

## Decisions I owned

**Keep the answer central.** I removed visible role captions, the logo on settled turns and the
header spinner. User bubbles and assistant prose remain visually distinct, each message has an
accessible role label, and the product mark appears only while waiting for the first text.
I requested that waiting state to make the simulated delay visible and stoppable.

**Protect reading space.** I requested the expandable long-question treatment so a pasted prompt
would not bury its answer, and the tooltip on Jump to present. The composer keeps its action
anchored and reveals keyboard hints on focus. Auto-scroll follows a reader near the bottom;
sending a question returns to the latest turn.

**Make sources easier to inspect.** I requested the counted, lowercase source label and excerpt
previews that can open above the chips when space below is limited. Previewing helps identify a
source; clicking reports the selection to the host. The optional `excerpt` field supports this
without inventing content for sources that have none.

**Prioritize reading over density.** I chose 16px message text with 28px line height and revised
source labels from 10px to 11px because they are controls used during sustained reading. Their
hit areas remain separate from the text size. Compact density changes spacing, not type size.

**Keep the scope bounded.** I rejected GSAP, a draggable composer and a second font family.
CSS covered the intended motion, and the other additions did not help demonstrate the required
stories. The template's font fallback remains in use; loading its declared webfont would require
another visual pass.

## Implementation and review

The panel is controlled: the host owns messages, status and input value. Story-only mocks own
simulation state and are excluded from the public exports. The supplied sample fixtures remain
the basis of the conversations and sources.

`Text` gained a `size` prop while preserving its default. The caption size has a shared token and
is registered with tailwind-merge. Heading and textarea styling is overridden locally in the
panel. `useFakeStream` gained optional word batches while retaining character streaming by default.

I prioritized review findings around concurrent submissions, retrying older failures without
losing later answers, stopping before the first token, stale content during the waiting phase,
and preserving focus and reading position. Regression tests cover these interactions.

The component API, state behaviour and keyboard interactions are documented in Storybook's
**Assistant/Overview**.

## Verification and limits

- **61 tests pass**, including the required interactions and regressions for retry, stop, focus,
  scrolling and streaming. TypeScript and the Storybook build also pass.
- Verification included a clean checkout with `npm ci`, followed by tests and the Storybook build.
- Chrome checks exercised suggestions, retry, partial-response stop, composer growth and Jump to
  present. Axe checks across the five required stories in both themes reported zero violations.
- Browser checks also covered contrast, control sizes, forced colours and reduced motion. Some
  checks preceded the final typography and motion refinements; they are not a complete visual
  audit of the final revision.
- A short NVDA spot check covered turn announcements, message roles and the composer's label and
  hint. It was not a full screen-reader audit, and no other browser/screen-reader pairing was tested.

These checks establish coverage for the exercised cases, not complete accessibility or usability.
The waiting labels and answers are simulated; they do not represent backend processing stages.

## With more time

I would complete an end-to-end NVDA pass, test VoiceOver and JAWS, and validate whether users want
completed answers announced automatically or prefer reading them from the log. I would also add
coverage for component states not exercised by the stories and repeat the visual review after
final changes, especially spacing between turns, the empty state and dark-theme surfaces.

I would also promote spacing to tokens. The kit ships colour, radius and a family, but no spacing
scale, so density currently lives in utilities spread across the components rather than in one
place — the same decision the colour tokens already centralise.

---

**Optional further reading.** [DISCLOSURE-EXTENDED.md](./DISCLOSURE-EXTENDED.md) is the long version:
the reasoning behind each visual and interaction decision, what was rejected and why, and the full
verification notes. Nothing in it is needed to review this submission, this page is the disclosure.
