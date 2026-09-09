# AI Disclosure — Extended

The Snyder Cut of `DISCLOSURE.md`.

This is a longer, more detailed version of `DISCLOSURE.md`.

It is considerably denser than the main disclosure, but I have kept it available in case anyone is interested in reviewing the implementation and decision-making in greater depth.

Both disclosure documents were drafted with AI assistance and subsequently reviewed and edited by me from start to finish.

## Tools and generated work

**Timebox: 8 hours, used in full.** The surface is larger than eight unassisted hours would
produce, and the reason is the tools below, not extra days or hours.

- **Claude Code** wrote the assistant components, hooks, mock controller, stories, tests and the
  first draft of this documentation.
- **Codex** ran review passes over the code and the browser behaviour, implemented agreed
  corrections, and added regression tests.
- **I owned the product and design decisions documented below.** Some came out of my direction or
  my corrections; others came out of AI-assisted implementation and review passes and were
  explicitly reviewed, retained, changed or rejected by me. The role captions above every turn, the
  product mark on every settled turn and the header spinner were all in the build and all removed on
  my call. The waiting state, the counted
  lowercase source label, the clamped question with its gradient, the tooltip on jump to present and
  the preview that flips when there is no room below did not exist until I asked for them, and I
  specified their behaviour — timing, blur direction, what leaves and when — rather than simply
  approving a generated proposal. I also reviewed the code as it went and proposed how it should be
  arranged, including the component props.

  Some of the decisions were refusals. GSAP was proposed and rejected: the motion here is small
  enough for CSS, and a library would have needed its own reduced-motion handling on top of the
  blanket rule that already covers everything. A drag-to-resize composer was scoped out as effort
  that would not have shown up in any required story. A second type family was considered and
  dropped, because the template ships one and the panel has no title surface that would justify a
  display face.

  The one place I reversed myself is worth naming. I set the source chips at 10px, matching what
  Perplexity and ChatGPT use for the same element, and then moved them to 11px: their reader is a
  general audience in a short session, while this one is a clinician working through report drafts
  for hours, and the chip is a control rather than a footnote. That argument is mine, and it is why
  the number in the code disagrees with the convention it started from.

The implementation uses the template's primitives, semantic tokens and sample fixtures.
No dependencies were added and no alternative design system was introduced.
Components, hooks and standalone helpers follow the supplied primitives' `function Name()` declaration
style; this cleanup preserved the primitives as they were.

## Decisions I reviewed and kept

The composer keeps its keyboard hint collapsed until focus enters the control. This leaves more
space for the conversation while reading, then shows the shortcuts where they are useful while
writing. Its bottom edge and Send/Stop stay anchored as it expands upward over 250ms. Focus on the
action keeps the hint open, and leaving the composer preserves the draft. Reduced motion makes
the change instant; the field's accessible description remains available in either state.

I asked for a review of missing requirements, weak interactions and unnecessary complexity, then
prioritized the confirmed issues. The controlled component contract and supplied design system
remain the foundation.

The retained interaction choices are an editable composer during streaming, failures attached to
individual turns, explicit source actions, and spacing-based density. The follow-up work focused
on preserving answers during retry, maintaining keyboard focus and reading position, and making
available actions agree with the visible and accessible instructions.

The detailed component contract and accessibility behaviour live in Storybook's
**Assistant/Overview**.


## Turn chrome: what a turn shows about itself

Four decisions taken together, after asking what each pixel above an answer was actually buying.

**No visible role caption.** Turns used to be captioned "YOU" and "ASSISTANT" in 11px uppercase
tertiary text. The brief asks that role reach assistive tech by accessible name rather than colour,
and the `article`'s `aria-label` already does that — the caption was a third, redundant signal. It
also cost roughly a third of the rail in a dense thread, and was the least readable text in the
panel: 11px, uppercase, tracked out, tertiary tone. The layout carries the role instead, the way
every production assistant does it — a right-aligned bordered bubble for the clinician, full-width
prose for the assistant.

**The Psynth mark instead of a generic sparkle.** The waiting state is marked by the product logo
rather than a stock icon or a spinner. It sits at 20px because the mark is a lattice of 27 dots —
below that it collapses into a smudge and stops reading as a logo. It is `aria-hidden`: the turn is
already named, and the live region already says one is arriving.

The mark appears only during the wait, never on a settled turn — *The mark earns its place by
leaving*, below, is the decision and the reasoning. While it is on screen it sweeps column by column
across the lattice, which is what the paths are grouped for. The keyframes live in `globals.css`
with no fill mode, so the reduced-motion rule collapses them to a static mark rather than freezing
one dimmed.

**No standing footnote.** The composer carried "Drafts only — review before anything reaches the
report" on every screen. A caveat that is always present stops being read; if a host wants one, the
`footnote` prop still takes it, but the panel no longer asserts it by default.

## Reading position

**Jump to present is an icon with a tooltip.** It used to be a full pill reading "Jump to latest",
which covered the last line of the thread — the very line the reader wanted. It is now a round arrow
with the label in a tooltip, and the tooltip answers `focus-within` as well as hover, because one
that only answers the mouse leaves a keyboard user with a bare arrow. The name still reaches
assistive tech through `aria-label`.

**Sending re-pins the thread.** Auto-scroll follows only a reader who is already near the bottom,
which is right for an arriving answer and wrong for a turn the reader just sent: their own question
landed off screen when they had scrolled up. Submitting now scrolls back down, and the motion is
chosen by distance — a streamed chunk moves the bottom by a line or two and is followed instantly,
because animating that jitters, while a jump of half a screen or more animates, so the thread does
not teleport under the reader. Covered by a regression test in `AssistantPanel.test.tsx`.

## The composer is one bar

**Send lives inside the field.** The field and its action used to be two stacked blocks: a bordered
textarea, then a separate row with a labelled button. They are now one bordered surface, so the bar
reads as a single control rather than as a form. The focus ring belongs to the field alone, keyed on
`has-[textarea:focus-visible]` rather than `focus-within`, because tabbing to send should not light
up the whole bar.

**The action is a circle, not a word.** A 32px accent circle with an arrow — the same size and shape
as *Jump to present*, so the panel has one vocabulary for "go there". Dropping the word "Send" costs
nothing: the accessible name is on the button, the keyboard hint beside it already says Enter sends,
and an arrow in an accent circle is the most legible "primary action" in the panel. Streaming swaps
the glyph inside the same circle instead of changing the button's shape, so the control does not
jump under the cursor.

**Disabled does not simply fade.** The primitive's `disabled:opacity-50` reads as disabled in light,
where accent is near-black, but in dark accent is lime and half-opacity lime is still the brightest
thing on screen. Disabled send falls back to `bg-muted` at full opacity instead.

## One signal per state

**The header spinner is gone.** Streaming was announced four ways at once: a header spinner, the
caret, Stop in the composer, and the live region. The spinner was the weakest of them — furthest
from the arriving text, `aria-hidden` so it did nothing for assistive tech, and it left a second
`role="status"` node in the DOM that only stayed quiet because of the wrapper hiding it. The waiting
state now carries that signal beside the answer area, through the mark and its accompanying text.

## Type: widen the gap between reading and metadata

**Message body goes to 16 / 28.** Clinical prose in a narrow rail was set at 14px, which is a UI
size, not a reading size. The turns are the one thing in this panel a clinician actually reads at
length, so they get the reading size and a 1.75 line height to go with it.

**The composer textarea stays at 16px.** Keep `text-base` across breakpoints, focus states and
density variants. This matches the response text and avoids the automatic focus zoom that Safari
on iPhone can trigger for fields with text smaller than 16px. Compact layouts reduce spacing,
not the field's font size. User-controlled page zoom remains available.

**Source chips go to 11 / 16, and the reference products are the reason they are not smaller.**
Chips are metadata — which document an answer leaned on — so they should recede behind the answer
itself; a 16/11 spread does that far better than the old 14/12. Perplexity and ChatGPT set the same
element at 10px or below, and for their reader that is right: general audience, short sessions,
density worth buying. Three things make this panel different. The reader is a clinician working
through report drafts for hours, across a wider age range than a consumer product assumes. The chip
is a **control**, not a footnote — if you have to squint to decide whether to click it, it has
failed at its only job. And the consequence is not symmetric: a misread citation in a search product
costs a moment of curiosity, while here the source is what makes a clinical claim auditable. 11px
is the smallest size that still reads as an invitation rather than as fine print.

They keep `text-primary` rather than a quieter tone, because small type needs the contrast: measured
at 9.45:1 on `bg-subtle`.

**The size is a token, not a number.** The shipped set defines a family but no type scale, so the
panel's smallest text was seven arbitrary pixel values scattered across five files. They are now one
`--text-caption` step, named for its role the way every other token here is — `bg-subtle`, not
`gray-100`. Three details were needed to make it behave like a step Tailwind ships rather than like
a number in a trench coat, and each one was a real defect until it was fixed:

- **It is in `rem`.** Every step Tailwind emits is; a size in `px` ignores a reader who has raised
  their browser's default font size, and this is the text they are most likely to have raised it for.
- **It carries its own line height.** A `--text-*` step declared without one emits *no*
  `line-height` at all — the compiled rule was `.text-caption{font-size:11px}` and nothing else — so
  four of its six call sites were silently inheriting the leading of whatever contained them.
- **It is registered with tailwind-merge.** `text-*` is ambiguous in Tailwind (size *or* colour) and
  the merge tells them apart from a list of known sizes, so an unregistered custom step is filed as a
  colour: it left a primitive's own `text-sm` standing *and* evicted the tone class beside it.

## What changed in the shipped primitives

The template says to compose its primitives, not to replace them. None was replaced, and exactly one
was edited — additively — while the two the panel disagrees with were left alone and overridden at
the call site instead:

**`Text` gained a `size` prop, and its existing size is still the default.** `body` (16/28), `label`
(12/16) and `caption` (11/16) existed before this as class overrides repeated at each call site —
`text-base leading-7` appeared three times in one file. That put the type scale in the consumers
instead of in the component, which is the opposite of what a kit is for. The names describe the role
rather than a rung on a ramp, matching how the colour tokens are named. Nothing that already used
`Text` moves, because `default` is unchanged.

**`Heading` was not touched, and its `h3` still ships `uppercase tracking-wide`.** The panel opts out
locally: its one call site, the suggested-prompts label, passes `normal-case tracking-normal`.
Uppercase destroys word shape at the size that can least afford it, which is the panel's own type
rule, but that is a preference of this surface and not a defect in the kit — a section label
elsewhere in the product may well want to shout. Changing a shared default to settle one consumer's
argument is the wrong trade, so the override stays where the disagreement is.

**`Textarea` was not touched either.** The composer overrides its 14px to 16px, because Safari on
iPhone zooms into a focused field under that size and does not zoom back out. The primitive keeps its
default — a text field is not always beside prose, and the kit should not assume this panel's case —
and the reason for the override sits as a comment in `Composer.tsx`, where someone deleting the class
would actually read it.

Two files outside `src/primitives/` were extended the same way, and both are additive:

- **`cn.ts`** registers `text-caption` with tailwind-merge. Without it a custom `text-*` step is
  filed as a colour, which left a primitive's own size class standing and evicted the tone class
  beside it. The behaviour for every shipped class is unchanged.
- **`useFakeStream`** gained `wordsPerChunk`. It revealed one character per tick, which reads as a
  typewriter rather than as a model, and made a full answer take long enough that the required
  streaming story was tedious to watch. The default preserves the original behaviour.
- **`globals.css`** grew by the keyframes and the two utility classes the panel's motion needs,
  plus the `--text-caption` step. It defines no colours.

`Button`, `IconButton`, `Input`, `Card` and `Spinner` are untouched, as are the colour tokens.

**One thing I found and deliberately did not fix: the family in the token never loads.**
`--font-sans` names `'Source Sans 3'`, but nothing in the template requests it — no `@font-face`, no
stylesheet link, no font package. Every panel here therefore renders in the fallback, which is
`ui-sans-serif` / `system-ui`, and so does every type measurement in this document.

Shipping it is two lines. I left it alone for two reasons. The declaration carries a complete
fallback chain, so what renders today is a working decision rather than a broken one — and it is the
same decision every reader of this template gets, including whoever reviews it. And a real webfont
has different metrics from the fallback: x-height, advance width and cap height all move, which
would put every size, leading and spacing figure I measured back in question at the point where
there was no longer time to re-verify them by eye. Reshipping an unverified type scale is a worse
outcome than a verified one set in the fallback.

If the intent is that the family should load, `@fontsource-variable/source-sans-3` is the
self-hosted way to do it, and the whole ramp should be walked through again afterwards rather than
assumed to survive.

**The chips keep a 24px target.** Shrinking the label would have taken the pill to about 23px tall,
under the WCAG 2.2 minimum target size, so the height is held by `min-h-6` and vertical padding
instead. Type size and hit size are separate decisions and were separated here.

## A long question does not get to bury its answer

**The user bubble clamps at eight lines** — 224px at 16/28 — fades the clipped line into the
bubble's own background, and offers **Show more**. A pasted multi-part question used to push the
answer it was about off the screen, which inverts the point of the panel: you ask in order to read
the reply.

**Only the user's turn clamps.** The assistant's answer is the thing a clinician came to read, so
clamping it would hide the deliverable. The asymmetry is the same one that governs the rest of the
turn: the question is an input the reader already knows, the answer is not.

**The clipping is visual only.** The full text stays in the DOM, so a screen reader gets the whole
question either way; `aria-expanded` and `aria-controls` say what the control does and what it acts
on. Nothing is ever hidden from assistive tech to save space.

**Opening it is a movement, not a cut.** The bubble snapped to its new height, which teleported the
answer below it and cost the reader their place on the page. It now travels to a measured height
over 300ms, with the gradient fading out as it goes rather than veiling the last line mid-travel,
and the chevron turning on the same clock. The height is measured rather than left `auto` because
`auto` is not an animatable value — `scrollHeight` is read on every resize, so a rail that changes
width re-measures instead of animating to a stale number. The global `prefers-reduced-motion` rule
already kills every transition, so this needed no opt-out of its own.

**Expanded lives in the component, not the host.** It is presentation state — nothing about the
conversation changes when a reader opens a bubble — so putting it in `messages` would have made the
host responsible for a scroll decision. This is the one piece of state `AssistantMessage` owns, and
the boundary is worth stating: the host owns what was said, the component owns how much of it is
currently on screen.

**Overflow is measured, not assumed.** The toggle only appears when the text really is clipped, and
a `ResizeObserver` re-measures when the rail changes width — the same sentence takes a different
number of lines at 420px and at 320px. Measurement is skipped while the bubble is open, because an
open bubble always fits and would otherwise erase the control that closes it.

`DenseThread` seeds one such question so the behaviour is visible without hunting for it, and
`Assistant/Message` has a `LongQuestion` story for it in isolation. The text is composed from the
shipped sample prompts — nothing invented.

## Sources answer "how much grounding" before you read one

**The group label counts, and stops shouting.** It used to read `SOURCES` — uppercase, tracked out,
and saying nothing a reader could not already see from the chips underneath it. It now reads
`3 sources`, in lowercase. The count is the useful half: it tells you how much an answer leaned on
before you read a single chip, which is the first thing a clinician checking an assertion wants to
know. Singular is handled, so one source does not read as `1 sources`.

The computed label is also the list's accessible name, so a screen reader gets the same fact rather
than a bare noun. A host can still pass `label` to override the whole string.

**The chips tighten to 4 / 6.** They were carrying 6px of vertical and 8–10px of horizontal
padding, which at 11px type made them read as buttons competing with the answer instead of as
metadata under it. `min-h-6` still holds the tap target: measured at 26px tall, above the WCAG 2.2
minimum, because padding shrank from the side that had room rather than from the side that did not.
Type size and hit size stay separate decisions.

## A source preview, because clicking answered only half the question

**Two questions, one gesture.** A chip told you *which* source an answer leaned on and
`onCitationClick` took you there. Nothing told you *what the source says*, so verifying an
assertion meant leaving the panel to find out you had opened the wrong one. Hovering or focusing a
chip now previews a passage; clicking still means "open it in the report". The preview answers *is
this the right source*, the click answers *take me there*.

**The blocker was the contract, not the UI.** `Citation` was `{ id, title, kind }` — there was no
content to preview. It gains an optional `excerpt`, which the brief explicitly allows. This is the
gap that was listed under "with more time"; extending the type deliberately is the point, not a
workaround.

**Only where the data backs it.** A citation without an `excerpt` previews nothing and carries no
description — the same rule already applied to `onRetry` and `onCitationClick`. One of the three
sample sources deliberately has none, so the stories cover the degraded case too.

**Hover was the wrong trigger on its own.** Hover-only content is invisible to keyboard and touch,
so the preview opens on focus as well. WCAG 2.1 SC 1.4.13 also asks that such content be
dismissible, hoverable and persistent: Escape closes it through a document listener, because a
reader who is only hovering has nothing focused for React to hear; and the card renders inside the
hover region so the pointer can travel onto it without dismissing it. It spans the list rather than
the chip, because a popover anchored to a 160px chip has nowhere to go in a 420px rail.

**The card picks its side before it renders.** It used to always open downward, which fails badly
near the bottom of the thread: the card is inside the log's `overflow`, so it is not merely covered
there, it is clipped — and reaching it means scrolling, which moves the pointer off the chip and
closes the very thing you were reaching for. The side is now chosen from the room actually left
inside the scrolling ancestor, before the card mounts, so it never flips in front of the reader.
Downward stays the default because that is the reading direction; upward wins only when downward
does not fit and upward is genuinely roomier.

**One stable card while comparing sources.** Moving between citations keeps the preview open on
the same side and preserves its minimum height. The intent is to maintain a stable reading area
while exploring sources attached to the same answer. Only the content changes, with a 6px slide
and fade over 150ms: advancing through citation order enters from the right, returning enters
from the left. Hover and keyboard focus share this behaviour. Rapid changes show the latest
source without queuing transitions; Escape still dismisses immediately. With reduced motion,
the content switches instantly. These are design choices, not a measured usability claim.

**Assistive tech does not depend on a hover it cannot produce.** The passage is attached to the
chip through `aria-describedby` at all times, not only while the card is open, and the card itself
is `aria-hidden` so it is never announced twice. A screen reader hears the excerpt on focus whether
or not anything visual happened.

**The excerpts live in the harness, not in the fixtures.** An excerpt is host data — the product
reads it out of the report — so `src/fixtures/` stays exactly as the template shipped it and the
mock supplies the passages, the same way it supplies the thread.

## The mark earns its place by leaving

**The thinking animation makes the interaction closer to a real use case.** I added it because
users do not receive an instant answer in a real interaction. It gives visible feedback during
the wait, so they know their request is being processed and something is happening.

**It used to sit on every settled turn.** Perplexity and ChatGPT do not do that, and they are right:
once an answer is on screen, the bubble and the prose already say who spoke, so a logo repeated down
the thread is decoration. Worse, it was the thing being repeated most often in the panel.

**Now it appears only during the wait, and leaves when there is text to read.** That is the one
moment it carries information — the panel is working and has nothing to show yet — and the moment
the first token lands it hands over to the answer itself. Removing it from settled turns costs
nothing: the article is still named for assistive tech, and the layout still separates the roles.

**A word describes the wait, and it changes.** *Thinking* → *Reading the report* → *Checking
sources* → *Drafting*, one per second, each arriving from the right and leaving to the left under a
blur. The rotation is the point: a static label reads as frozen after two seconds, a changing one
reads as progress. It is CSS, so the blanket reduced-motion rule applies — except that these two
keyframes need `forwards` to hold their end state, which that rule cannot undo, so they are switched
off explicitly instead and the words simply swap.

**The mark pulses rather than blinks.** The loop was opacity only — a point brightened, dimmed, and
the next one took over. At 20px that reads as flicker, not as motion. Each point now also swells to
1.25× as it peaks, so the loop reads as one thing travelling around the lattice. `transform-box:
fill-box` is what makes that work: without it every path scales from the SVG's origin instead of its
own centre and the points fly off the mark. The scale is bounded by the geometry rather than by
taste — the widest point is 24 units across and the columns sit 38 apart, so 1.25× still clears its
neighbours.

**Assistive tech gets one stable sentence.** The rotating words are `aria-hidden` and a single
`sr-only` line stands in for them. Announcing a new word every second on top of the live region
already saying the turn is arriving would be noise, not information.

**The fixture now waits before answering.** The mock replied instantly, which no transport does, so
the state this indicator exists for never occurred outside a hand-built story. `thinkingMs` (1.5s by
default, a story control down to 0) is the gap between sending and the first token.

Three things fell out of adding it, all of which were latent:

- **The pending turn rendered the previous answer.** `useFakeStream` holds its text until
  `start()` clears it, so during the wait the new turn showed the last answer in full, then blanked,
  then typed the same words out again. The turn is now empty until its own stream begins. It only
  became visible because the wait put a gap where there had been none.

- **Stop had no meaning during the wait.** `useFakeStream` only settles a stream it already started,
  so stopping while thinking did nothing and the panel would have waited forever. The controller
  now abandons the turn itself, and cancelling the wait releases the start guard with it —
  otherwise a turn retried under the same id refuses to schedule a second time.
- **The turn only settled if a render happened to catch the stream mid-flight.** A stream that
  starts and finishes inside one tick is batched into a single render, so that intermediate state
  may never be observed, and the turn would hang at `streaming` forever with its full text on
  screen. It now tracks which turn actually reached `start()` instead of watching for a passing
  state. This was already true before the wait existed; deferring the start is simply what made it
  reproducible.
## Motion is a rhythm, not a feature

**Every transition here exists to preserve continuity rather than decorate the interface.** A panel
where elements appear, resize and swap without transition asks the eye to re-find things it had
already found. Each animation in this build is doing that job — the bubble travels to its open
height so the answer below it does not teleport, a source chip's preview rises rather than
materialises, the composer's hint grows out of zero height instead of shoving the thread, the
waiting word slides out as the next slides in so the change reads as a replacement rather than as a
flicker. None of them
are there to be noticed.

**They are bounded, and the bound is deliberate.** Every duration sits between 150ms and 320ms.
Below that a transition reads as a glitch; above it the interface feels like it is negotiating.
The shipped `--duration-quick` (150ms) and `--ease-smooth-out` anchor the fast end, and nothing
invented for this build exceeds 320ms. The one exception is the mark's pulse at 1.6s, which is not
a transition between states but an ambient loop — it is allowed to be slow because it runs beside
the waiting text rather than replacing it.

**They animate what the compositor can animate.** Opacity and transform almost everywhere, which
keeps the thread smooth while text is streaming into it. Two of them animate height instead, because
the alternative was not animating at all: `auto` has no interpolatable value, so the bubble goes to a
measured pixel height and the composer's hint uses a `0fr → 1fr` grid row. Those are the only two,
and both are on elements that are not resizing while a stream is arriving.

**Motion itself carries no unique information.** Every state stays available through text and
accessible semantics — the live region, `aria-expanded`, accessible names — so removing every
animation makes nothing unknowable; the motion only emphasises what is already said. That is what
makes the blanket `prefers-reduced-motion` rule safe — it disables every animation and transition in
the build, and the panel loses nothing but its manners.

## Verification of this revision

**What this section covers, and what it does not.** `npm test`, `npm run typecheck` and
`npm run build-storybook` were re-run after the last change and are green, and `npm ci` was run
against the current checkout. The browser work below — the axe runs, the measured
contrast and target sizes, the Chrome interaction checks — was carried out before the final pass on
type and motion. The values that pass through a colour or a hit area are unaffected by that pass, so
they still hold; what has not been re-observed in a browser since is the rendered result of the
`--text-caption` line height, the `Show more` transition and the panel's `h3` case override. They are
covered by tests and by the compiled CSS, not by a fresh visual audit.

The motion pass used the supplied local transitions.dev skill as a reference for icon swaps,
anchored previews and tooltips, adapted to the existing Tailwind layout and tokens. It also
disabled CSS motion completely under reduced motion and guarded explicit smooth-scroll calls.
The selected interactions and their rationale are described above.

- `npm test`: **61 tests pass**, including the required cases, controller concurrency and retry
  ordering, stop before the first token, StrictMode startup, keyboard focus, resize behaviour, the
  submit re-pin, the long-question clamp, the source preview with its placement flip, and the
  composing phase with stop during it.
- `npm run typecheck` and `npm run build-storybook -- --quiet` pass.
- Chrome checks exercised suggestion submission, retry during another turn, retry of an older
  failure, stop with partial text, focus after actions, composer growth and Jump to present.
- Axe 4.13 was run against all five required stories in both themes — ten runs, zero violations.
  It found two on the way and both are fixed: `Show more` was a 20px tap target, under the WCAG 2.2
  AA minimum of 24, and the story's source inspector sat outside any landmark. Axe passing does not
  establish accessibility, so the checks below cover what it cannot see.
- Target size checked on every control: 24px minimum, held by `min-h-6` on `Show more`; source
  chips render at ~26px tall, close at 36px. None under 24.
- Contrast measured on every text under 12px, both themes: 11px source chips 9.45:1, 11px group
  label and 12px hints 5.01:1 light / 4.69:1 dark. All above 4.5.
- Browser emulation confirmed the focus outline with forced colours and the reduced-motion
  behaviour. A narrow viewport and long composer input did not produce horizontal overflow.
- A short NVDA pass on this revision listened to the required flows: the turn announcements, the
  roles in the log and the composer's label and hint. It was a spot check rather than a full
  screen-reader audit, and no other browser and screen-reader pairing was tried.
- Commands ran on Windows. They were also re-run against a clean checkout — fresh directory,
  `npm ci` from the committed lockfile, no reused `node_modules` — and `npm test` and
  `npm run build-storybook` pass there too.

## With more time

**Screen readers, past the spot check.** NVDA end to end rather than sampled, then VoiceOver and
JAWS, since they disagree about how much of a live region they repeat. The live region announces
completion while the answer is read from the log on demand; whether to announce the settled answer
automatically is the open question, and it needs a real user rather than my opinion.

**Deeper tests on the components themselves.** The current suite proves the panel's behaviour and
the required interactions. What it does not cover as thoroughly is each component on its own terms —
`AssistantMessage` and `Composer` have states reachable from a host that no story exercises, and
those deserve their own cases rather than being verified through the panel that composes them.

**A pass on the visual finish.** The panel is correct and consistent before it is beautiful, and
with more time I would spend it on the second: rhythm between turns, the weight of the empty state,
how the surfaces sit in dark. The constraint is that none of it may cost accessibility — every
change would go back through the same contrast, target-size and reduced-motion checks, because a
more modern panel that reads worse for someone using it eight hours a day is not an improvement.
