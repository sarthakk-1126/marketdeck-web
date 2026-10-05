# Homepage product-card preview QA

final result: passed


---

## Books & Investor Methods carousel motion — 2026-10-05

### Source visual truth and implementation evidence

- User-selected attachment: `/workspace/scratch/84c89f25e2c0/upload/image(20261005-104218).png`, 1294 × 462 pixels, including the image-viewer chrome.
- Clean selected concept: `/workspace/scratch/84c89f25e2c0/generated_images/exec-d0950607-3842-4a0a-bdec-bf39345078d1.png`, 1984 × 793 pixels. The component was normalized from a 1900 × 527 trim.
- Browser-rendered implementation: Cloud Browser tab 42 at `http://terminal.local:4173/#research-terminal`, Chrome/CDP, 1348 × 900 CSS viewport, DPR 1. The Books state was selected with the real control and visually inspected.
- Final desktop component capture: `.preview/books-motion-desktop.png`, 1236 × 322 pixels.
- Final mobile component capture: `.preview/books-motion-mobile.png`, 350 × 468 pixels inside a 390 × 844 CSS viewport, DPR 1.
- Combined same-input desktop comparison: `.preview/books-motion-comparison.png`, 1236 × 665 pixels. The selected source is above and the implementation is below. The source component was scaled to the implementation width; the implementation intentionally remains 21px shorter to preserve the approved compact homepage footprint.

The Cloud Browser capture is the runtime source of truth for controls, motion, focus and navigation. The saved desktop/mobile captures use the same production HTML/CSS and generated asset with animations disabled for stable visual comparison. The mobile capture selects the Books state in the capture harness; the actual runtime state change was separately exercised in the Cloud Browser.

### Findings and comparison history

- [P1, fixed] The previous Books artwork was a static generic landscape and did not communicate a library or investment method. It was replaced by an original 1700 × 680 transparent open-book illustration showing IDEA → TEST → APPLY, supporting icons, a checklist and an analytical chart.
- [P1, fixed] The previous 30px transparent chevrons and 6px dots were not discoverable. The final control cluster has labelled `Research Terminal` and `Books` feature selectors, a visible `02 / 02` counter and two 40 × 40 desktop / 36 × 36 mobile outlined arrow buttons with clear accessible names.
- [P2, fixed] The first rendered implementation left too much empty space between copy and illustration. The post-comparison pass enlarged and shifted the book so its scale and visual weight now match the source while retaining the 322px frame and preventing overflow.
- [P2, fixed] The first Books heading inherited the former slide's non-blue emphasis. `Test the thinking.` and the Books kicker now use the homepage blue, matching the selected concept and the existing Research Terminal slide.

The final combined comparison shows no remaining actionable P0/P1/P2 mismatch. Intentional differences are limited to keeping the real homepage component 322px tall, using the existing MarketDeck font/tokens, and replacing the concept's tiny secondary dots with the more explicit labelled feature selector and numeric counter.

### Required fidelity surfaces

| Surface | Result |
| --- | --- |
| Fonts and typography | Existing MarketDeck font stack and optical hierarchy retained. Desktop title is 40px maximum with 1.06 line height; mobile is 28–34px. Labels, body copy, CTA and trust line remain legible with no truncation in final captures. |
| Spacing and layout | Desktop frame is 1236 × 322 at the inspected viewport. Copy and book retain distinct columns; controls occupy the upper-right edge without hiding content. Mobile frame is 350 × 468, arrows remain visible, the book remains readable, and document overflow is false. |
| Colours and tokens | All UI uses existing host variables (`--bg`, `--surface`, `--blue`, `--line`, `--text`, `--muted`) and `color-mix`; no new hardcoded palette or root override. Blue emphasis and restrained glass borders match the selected visual. |
| Image quality and asset fidelity | Original generated asset is 1700 × 680 sRGBA WebP at about 100KB. It uses no official book cover or copied artwork. Repeated cached layers are clipped from the same asset for page, trace and node motion; no CSS/div illustration substitutes the book. |
| Copy and content | Existing Books headline, description, CTA, Learning link and 25-guide trust line are unchanged. Both slides remain crawlable HTML. The new figcaption truthfully identifies an original MarketDeck illustration. |

### Motion, accessibility and interaction verification

- Ambient motion is restrained and CSS-only: 4px book float, 2px page breath, one moving evidence trace and sequential IDEA/TEST/APPLY node pulses. Pointer depth remains bounded to 1.8° / 2.4°.
- Motion runs only when the active slide is visible. It stops offscreen, on an inactive slide, while the user hovers or focuses the carousel, when the tab is hidden, under the global motion pause, and under `prefers-reduced-motion`.
- Cloud Browser runtime reported `awsAtlasFloat` and `awsAtlasTrace` while visible. The global Disable motion control changed the body to `motion-paused` and the atlas animation to `none`; motion was restored afterward.
- Next from Books wrapped to Research Terminal. ArrowRight on the focused carousel returned to Books. The active selector and `02 / 02` counter updated together. Existing touch swipe handling remains intact.
- Desktop arrows measured 40 × 40 CSS pixels. Mobile arrows render at 36 × 36 with the always-visible count; labelled selectors collapse to protect the compact phone layout.
- Browser DOM exposed both feature buttons, previous/next accessible names, both crawlable slide headings and destinations. Focus outlines use the existing blue token.
- Cloud Browser console review found no page-origin errors. Logged errors came only from the browser's own extension metadata bridge, outside MarketDeck.

### Automated and scope verification

- Production build: passed.
- Targeted Learning/carousel tests: 12/12 passed.
- Full suite: 140/143, exactly matching clean `origin/main` at 140/143. The three inherited failures are the missing review-build draft fixture, the stale analytics allowlist, and the pre-existing product-art preview assertion.
- Syntax checks and `git diff --check`: passed.
- Final desktop and 390px mobile captures: no horizontal overflow.
- Portfolio Analysis section markup is byte-identical to `origin/main`; `portfolio-flagship.css` and `portfolio-flagship.js` are unchanged.
- No authentication, calculations, platform core, analytics payloads, sitemap, deployment configuration or VPS files changed.

### Follow-up polish

No blocking follow-up remains. A future carousel with more than two features may replace the fixed `02` total with registry-derived text, but doing that now would add complexity without user value.

final result: passed

## Scope and source visual truth

User-selected playable-preview attachment: `/workspace/scratch/adf03b8116c5/upload/image(20261004-175404).png`, 1099 × 802, with viewer overlays. The clean original of that exact displayed concept is `/workspace/scratch/adf03b8116c5/generated_images/exec-91523bad-6147-4b62-a4db-949c9198ccb7.png`, 1488 × 1057. Both were opened; the clean original was used for comparisons without viewer overlays.

User constraints: modify only the five research-stack cards, retain current colours, keep cards compact and preserve all other homepage content. The earlier deployment hold was lifted by the user's explicit instruction to check, merge and deploy.

## Browser-rendered evidence and normalization

Cloud browser, local preview, actual homepage inside same-origin QA frames. Desktop frame: 1440 × 1100 CSS pixels, DPR 1; full browser capture 1440 × 1136. Frame scrollbar takes 15 CSS pixels. Phone frames: 390 × 844 and 320 × 844, DPR 1, corresponding content widths 375 and 305. These are browser responsive viewport checks, not claims of physical-device testing.

- Initial implementation capture: `.preview/cards-desktop-before.jpg`.
- Final desktop capture: `.preview/cards-desktop-final.jpg`.
- Full card-grid comparison: `.preview/cards-comparison-final.jpg`.
- Focused Charting comparison: `.preview/cards-charting-comparison-final.jpg`.
- Phone screenshots: `.preview/cards-phone-390.jpg`, `.preview/cards-phone-390-lower.jpg`, `.preview/cards-phone-320-payoff.jpg`.
- Combined phone evidence: `.preview/cards-phone-evidence.jpg`.
- No-JavaScript capture: `.preview/cards-nojs-full.jpg`.

The final reference grid was cropped at x=80–1409/y=274–1046; actual grid at x=56–1370/y=393–1128. Reference was scaled uniformly to actual grid width for a combined side-by-side comparison. Focused Charting cards were also compared at matched width. These comparisons were opened and inspected together. Surrounding section heading and copy intentionally stay as the current site renders them, rather than taking the generated concept's different heading layout. Final state: Growth, Price with an inspected crosshair, Long call at ₹250, Earnings excerpt 00:42, BTC.

## Findings and comparison history

[P2, fixed] Inherited article padding added a second layer of spacing, producing 441px top cards and 380px lower cards, plus a legacy accent stripe. The first rendered comparison showed excessive blank space. Card-only `padding:0` and disabling the inherited pseudo-elements fixed it. Final top cards are 389px; lower cards 328px; combined grid 735px. The post-fix full and focused comparisons show no remaining actionable P0/P1/P2 findings.

Earlier browser access was blocked while selecting an internal browser error page. A fresh allowed HTTP tab successfully loaded the running preview. Browser verification and actual captures then completed; the earlier blocked result is superseded by this pass.

## Required fidelity surfaces

| Surface | Result |
| --- | --- |
| Fonts and typography | Existing Inter/Segoe UI family, 24px desktop titles, 23px mobile titles, 13px leads, restrained category labels. Legible without truncation in the tested views. Current site product copy is retained. |
| Spacing and layout | Three upper/two lower cards on desktop, one column on phones. 22/24px desktop and 19/20px phone content padding. 390px cards: 316–341px tall; 320px cards: 316–383px, with F&O chips deliberately wrapping. No page or card overflow at either phone width. |
| Colours and tokens | Existing surface/background, homepage blue #59a7f5, slate text and borders. Muted selected controls adapt the more saturated concept to the current palette. Active border communicates focus without card travel. |
| Image quality and assets | Original icon sprite retained. Existing artwork remains in the no-JavaScript fallback. Real canvas plots use local fictional samples and calculated piecewise-linear payoff; no decorative approximations or fake live imagery. |
| Copy and content | Current product names/categories/leads/Explore links preserved. Fictional companies, illustrative excerpts and sample chart data are identified directly in the cards. F&O strike, premium, expiry and per-unit assumptions are visible. |

Intentional adaptations: compact charts and no y-axis clutter; accurate option payoff instead of the mock's smooth illustrative curve; Commentary displays excerpts without a pretend audio player; all charts use the site's blue rather than the mock's orange crypto line. These honor the current-colour/compactness requirement and avoid implying live feeds or audio that does not exist.

## Primary browser interactions checked

- Growth → Quality changed metric to ROCE and reordered Zenith/Nova/Apex; Low debt reordered 0.1×/0.3×/0.6×. Growth restored original rows.
- Price/Volume switched selected state and plot; End selected sample 63 and 30 Sep volume 29.5M; Home selected 01 Jul 18.0M on the narrow phone frame. Pointer click selected sample 32.
- Covered call at ₹350 showed capped ₹20/unit with purchase assumption; Long put at ₹150 and Long call at ₹350 showed ₹80/unit. At-the-money call correctly shows −₹20 premium loss.
- Earnings timestamp 02:18 changed the excerpt; Filings changed timestamps into Note 1/Note 2, and Note 2 changed the filing excerpt.
- ETH changed the accessible chart description and sample label; BTC restored the other series. All five Explore hrefs match their existing application destinations.
- Phone filter, F&O slider, source/excerpt and crypto controls exercised. Controls remain visible; narrow F&O wrapping is intentional.
- No-JavaScript sandbox: zero enhanced cards, hidden demo controls, five original artwork images, all 15 original feature labels and five Explore links remain.
- Default motion remains on (`aria-pressed=false` on Disable motion). Existing manual pause was exercised during desktop accessibility verification; card controls continue working while paused. New plots have no idle animation; reduced-motion stylesheet rules remain present. Physical touch hardware and a separate OS preference toggle were not available.
- Browser console inspected: no page-origin/product-preview errors. The browser extension logged metadata-transport errors; those are outside the application. Expected sandbox script-block messages belong only to the deliberate no-JavaScript test.

## Automated and scope verification

Production and review builds pass. New tests 4/4 pass; full suite 100/102 versus base main 96/98. The identical two pre-existing failures are the stale analytics script allowlist and old artwork assertions. Syntax and diff checks pass. Exact normalized comparison confirms markup outside the card grid is unchanged apart from loading the two new assets. Global CSS/JS, original overview CSS, bots, portfolio assets and product destinations are unchanged. No new dependencies, LLM, paid feeds, polling, API or VPS changes.

## Release checklist

- [x] Source and implementation opened and compared in combined full/focused inputs.
- [x] Excess inherited padding fixed and final evidence inspected.
- [x] Desktop, 390px, 320px, keyboard/pointer, no-JavaScript and motion-pause checks.
- [x] Production build, calculation tests, baseline comparison and scope verification.
- [ ] Merge the exact reviewed head and verify the production workflow and served assets.

P3 follow-up: optional finer chart axis labels can be revisited only if users need them. No additional layout work is required for this release.


---

## Research Terminal compact folio — 2026-10-05

The current homepage-only folio QA and all five required fidelity surfaces are recorded in [the detailed report](docs/qa/research-folio-20261005.md). Source visual, rendered desktop/phone/tablet captures, full and focused comparisons, fixed P2 history, interaction checks, console review and baseline test comparison are included. Desktop frame: 322px. Typical phone frame: 388–407px. Portfolio markup and assets are byte-identical.

final result: passed
