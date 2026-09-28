"""Prepare and validate the published AI in Indian Finance MarketDeck Brief.
Run from the marketdeck-web repository root.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pymupdf as fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "content/briefs.json"
SOURCE = ROOT / "content/issues/ai-indian-finance-v1.json"
ASSETS = ROOT / "content/issues/ai-in-indian-finance-2026"
ISSUE_ID = "ai-indian-finance-03"
SLUG = "ai-in-indian-finance-2026"


def main() -> None:
    subprocess.run([
        sys.executable,
        str(ROOT / "scripts/render-ai-indian-finance-magazine.py"),
        str(SOURCE),
        str(ASSETS),
    ], check=True)

    doc = fitz.open(ASSETS / "marketdeck-brief-v1.pdf")
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    if len(doc) != 12 or len(source["pages"]) != 12:
        raise RuntimeError("AI in Indian Finance issue must remain 12 pages")

    # Crop only the original explanatory graphics/charts, not surrounding prose.
    crops = {
        2: (38, 205, 557, 468),
        3: (38, 205, 557, 447),
        4: (38, 205, 557, 426),
        5: (38, 205, 557, 466),
        6: (38, 205, 557, 482),
        7: (38, 205, 557, 446),
        8: (38, 205, 557, 480),
        9: (38, 205, 557, 416),
    }
    captions = {
        2: ("Editorial workflow map of five AI use-case lanes in Indian finance, from service to operations.", "MarketDeck editorial schematic; use-case evidence is cited in the surrounding text."),
        3: ("Company-reported FY2026 customer-service metrics from Bajaj Finserv businesses, shown with separate denominators.", "Company-reported operating metrics from Bajaj Finserv Limited; not independent quality scores."),
        4: ("Schematic separating fraud detection and triage from human review and downstream action.", "MarketDeck editorial schematic illustrating a reviewable fraud-control workflow."),
        5: ("Bajaj Finance company-reported FY2026 AI-enabled loan and document-processing metrics alongside a consequence gradient.", "Company-reported operating metrics; AI-enabled does not mean autonomous credit approval."),
        6: ("Matrix of AI and ML use cases documented by SEBI across exchanges, brokers and mutual funds.", "Use cases are summarised from SEBI primary materials cited in the surrounding text."),
        7: ("Selected company-reported operating metrics for voice-to-data, document processing and Axis Bank's internal GenAI deployment.", "Company-reported deployment scale; not investment-performance evidence."),
        8: ("Editorial simplification of RBI FREE-AI: enabling pillars and governance pillars, anchored by seven Sutras.", "MarketDeck schematic based on the RBI FREE-AI committee report; see source S1."),
        9: ("MarketDeck authority ladder from assistive AI to high-impact autonomous financial action.", "Editorial control framework: oversight should increase as authority and consequence rise."),
    }
    for page_index, box in crops.items():
        page = doc[page_index]
        rect = fitz.Rect(*box)
        pix = page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8), clip=rect, alpha=False)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        name = f"figure-{page_index + 1:02d}.webp"
        image.save(ASSETS / name, quality=90, method=6)
        alt, caption = captions[page_index]
        source["pages"][page_index]["figure"] = f"/intelligence/issues/{SLUG}/{name}"
        source["pages"][page_index]["figureAlt"] = alt
        source["pages"][page_index]["figureCaption"] = caption
    SOURCE.write_text(json.dumps(source, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entry = {
        "id": ISSUE_ID,
        "title": "AI in Indian Finance",
        "slug": SLUG,
        "edition": "Fieldnotes 03 · AI in Indian finance",
        "summary": "An evidence-first look at where AI is creating operating value in Indian finance — from service and fraud detection to lending, research and back-office work — and how governance, model risk and human oversight should scale with decision authority.",
        "cover": f"/intelligence/issues/{SLUG}/cover-v1.webp",
        "pdfPath": f"/intelligence/issues/{SLUG}/marketdeck-brief-v1.pdf",
        "pageCount": 12,
        "sourceReviewedAt": "2026-09-28",
        "publicationStatus": "published",
        "approvedAt": "2026-09-28",
        "publishedAt": "2026-09-28",
        "source": "content/issues/ai-indian-finance-v1.json",
        "assets": f"content/issues/{SLUG}",
        "lastUpdated": "2026-09-28",
        "pdfEdition": "1.0",
        "topics": ["ai-quant", "india", "research-craft"],
    }
    existing = next((i for i in manifest["issues"] if i["id"] == ISSUE_ID), None)
    if existing:
        existing.clear()
        existing.update(entry)
    else:
        manifest["issues"].insert(0, entry)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # PDF preflight: page count, links, fields, text density and content bounds.
    links = sum(len(p.get_links()) for p in doc)
    fields = sum(len(list(p.widgets() or [])) for p in doc)
    if links < 80 or fields != 10:
        raise RuntimeError(f"Interactive PDF preflight failed: links={links}, fields={fields}")
    for number, page in enumerate(doc, 1):
        if len(page.get_text().split()) < 70:
            raise RuntimeError(f"Page {number} unexpectedly sparse")
        for word in page.get_text("words"):
            if word[0] < -1 or word[1] < -1 or word[2] > page.rect.width + 1 or word[3] > page.rect.height + 1:
                raise RuntimeError(f"Text outside page bounds on page {number}: {word}")
        for link in page.get_links():
            if link["kind"] == fitz.LINK_GOTO and not (0 <= link["page"] < len(doc)):
                raise RuntimeError(f"Bad internal link on page {number}")
    doc.close()

    subprocess.run(["node", "scripts/build.mjs"], cwd=ROOT, check=True)
    subprocess.run(["node", "scripts/build.mjs", "--review"], cwd=ROOT, check=True)

    public_issue = ROOT / "public/intelligence/issues" / SLUG
    required = [
        public_issue / "marketdeck-brief-v1.pdf",
        public_issue / "marketdeck-brief.pdf",
        public_issue / "cover-v1.webp",
        public_issue / "index.html",
        *[public_issue / f"figure-{i:02d}.webp" for i in range(3, 11)],
    ]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        raise RuntimeError("Missing published assets: " + ", ".join(missing))
    if (public_issue / "marketdeck-brief-v1.pdf").read_bytes() != (ASSETS / "marketdeck-brief-v1.pdf").read_bytes():
        raise RuntimeError("Published PDF does not match approved asset")
    print(f"AI in Indian Finance editorial preparation PASS: 12 pages, {links} links, {fields} fields, 8 HTML figures.")


if __name__ == "__main__":
    main()
