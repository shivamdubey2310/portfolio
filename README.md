# Shivam Dubey — Portfolio

Static portfolio (plain HTML/CSS/JS, hosted on GitHub Pages) for **Shivam Dubey**, a working **Data Engineer** at Bizfy Solutions (intern since Mar 2026, full-time since Sep 2026), based in Indore, India and open to Data Engineer roles worldwide.

## What's on the site

**`index.html`**
- Hero with bio, resume / LinkedIn buttons and key stats (role, 50M+ daily records, 99.9% reliability, -45% query latency, DP-700)
- Featured projects
- **Experience**: Data Engineer (Sep 2026 – present) and Data Engineer Intern (Mar – Aug 2026), newest first
- Skills (Languages, Cloud & Platforms, Databases, Data Modeling, Big Data & ETL, DevOps & Tools, Problem Solving)
- Certifications (with dates and credential links), Education, Leadership, Contact

**`projects.html`**: all 14 projects plus 5 "Other Projects". Clicking a card opens a modal built from a `.txt` file.

## Project data format

Each project card on `projects.html` has a matching file in `Project_data/` (or `Other_project_data/`), named exactly like the card's `data-project` value. `assets/projects.js` fetches and parses it. The parser recognises these section headers on their own line:

`Overview`, `Tech Stack`, `The Challenge`, `The Solution`, `Key Highlights`, `Links`

- First line = title (skipped; the modal shows it separately).
- `Tech Stack` and `The Solution` items are `- Label: value` lines (every line needs the leading `-`).
- `Key Highlights` items are `- ` bullets. Put a measurable outcome as the first bullet, labelled `Results:`, and only when it is backed by the resume.
- Thumbnails go in `project_images/` (or `Other_project_images/`) as `<project name>.png`.

## Content rules

- Facts come from the resume (`ShivamDubey.pdf`); `details.md` mirrors them. Don't add metrics that aren't there.
- Employer clients, internal systems and data sources are never named.
- The phone number is not published.
- `ShivamDubey.pdf` is linked as-is; it is not regenerated here.
- Canonical LinkedIn: https://www.linkedin.com/in/shivam-dubey20

## Open items (`TODO(confirm)` in the HTML source)

- LeetCode and HackerRank profile URLs (commented-out links in the Problem Solving card)
- Exact wording of the "5+ HackerRank badges" claim
- What (if anything) a "Learning" card should say in the hero panel

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
