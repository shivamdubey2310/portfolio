#!/usr/bin/env python3
"""Add a project to the portfolio from its diagram image + your finished description .txt + GitHub URL.

Usage:
  python3 tools/add-project.py --image diagram.png --text "My Project.txt" \\
      --github https://github.com/you/repo --alt "What the diagram shows" [options]

--text is the description file in the site's format (see README.md, ".txt format"). It is copied
as-is to Project_data/<Name>.txt, so write it however you like (e.g. with AI). The first line is the
project name. These parts are also reused for the card:
  Overview        first paragraph -> card summary (override with --summary)
  Results         first plain line -> card outcome, "- value | label" lines -> metric chips
  Tech Stack /    tool names found in the text -> card tags (override with --tags) and
  whole text      the topic filters (override with --filters)

What it does:
  1. copies the image to project_images/<Name>.png and makes the WebP variants
  2. copies the description to Project_data/<Name>.txt
  3. inserts the card into projects.html (More projects group, or --flagship)
  4. adds the GitHub link to project_links.txt
  5. refreshes the static counts, the footer "Last updated" date and sitemap.xml

Options:
  --name        Project name (default: first line of the .txt)
  --summary     One-sentence card summary
  --alt         Alt text describing the diagram (default is generic: please set it)
  --flagship    Put the card in the Flagship grid instead of "More projects"
  --filters     Comma list for the topic chips: streaming,cdc,medallion,airflow,
                warehouse,nosql,bi-ml (default: detected)
  --tags        Comma list for the tool tags on the card (default: detected, max 4)
  --pill        Small label on the card (default: first filter, else "Project")
  --demo        Live demo URL (shows a "Live demo" button in the detail view)
  --dry-run     Print what would change, write nothing
"""
import argparse, datetime, html, os, re, sys, urllib.parse

sys.dont_write_bytecode = True  # keep tools/__pycache__ out of the repo

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def _load_make_webp():
    import importlib.util
    spec = importlib.util.spec_from_file_location('make_webp_mod', os.path.join(HERE, 'make-webp.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------------------------------------------------------------- vocab
# (display name, regex) in the order tags should be preferred on the card.
TOOLS = [
    ('Microsoft Fabric', r'microsoft fabric|\bfabric\b'), ('Apache Airflow', r'airflow'),
    ('Azure Data Factory', r'azure data factory|\badf\b'), ('Databricks', r'databricks'),
    ('Delta Lake', r'delta lake|\bdelta\b'), ('Synapse Analytics', r'synapse'),
    ('PySpark', r'pyspark|\bspark\b'), ('Kafka', r'kafka'), ('dbt', r'\bdbt\b'),
    ('Snowflake', r'snowflake'), ('BigQuery', r'bigquery'), ('Redshift', r'redshift'),
    ('AWS', r'\baws\b|\bs3\b|glue|lambda'), ('Azure', r'\bazure\b'), ('GCP', r'\bgcp\b|google cloud'),
    ('PostgreSQL', r'postgres'), ('MySQL', r'mysql'), ('SQL Server', r'sql server|t-sql'),
    ('MongoDB', r'mongo'), ('Power BI', r'power ?bi'), ('Streamlit', r'streamlit'),
    ('Docker', r'docker'), ('Bash', r'\bbash\b|shell script'), ('Cron', r'\bcron\b'),
    ('Pandas', r'pandas'), ('SQLAlchemy', r'sqlalchemy'), ('Python', r'python'), ('SQL', r'\bsql\b'),
]
FILTERS = [  # chip id, pill label, regex
    ('streaming', 'Streaming', r'streaming|real-?time|kafka|eventstream'),
    ('cdc', 'CDC', r'\bcdc\b|change data capture|change tracking'),
    ('medallion', 'Medallion', r'medallion|bronze'),
    ('airflow', 'Airflow', r'airflow|\bdag\b'),
    ('warehouse', 'Warehouse', r'warehouse|star schema|dimensional'),
    ('nosql', 'NoSQL', r'mongo|nosql|cassandra|dynamodb'),
    ('bi-ml', 'BI / ML', r'power ?bi|tableau|machine learning|mllib|dashboard|\bml\b'),
]
HEADERS = {'Overview', 'Tech Stack', 'The Challenge', 'The Solution', 'Key Highlights', 'Results',
           'My Role', 'Project Info'}


def die(msg):
    print('error: ' + msg, file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------- .txt -> card bits
def plain(s):
    """Card text is plain: drop **bold** and `code` markers."""
    return re.sub(r'\*\*([^*]+)\*\*|`([^`]+)`', lambda m: m.group(1) or m.group(2), s).strip()


def parse_txt(text):
    """-> (title, {section: [lines]}) using the same section headers as assets/projects.js."""
    title, section, secs = None, None, {}
    for raw in text.splitlines():
        t = raw.strip()
        if not t:
            continue
        if title is None:
            title = t
            continue
        if t.startswith('#'):
            continue
        if t in HEADERS or t.startswith('Links'):
            section = t.split()[0] if t.startswith('Links') else t
            secs.setdefault(section, [])
            continue
        if section:
            secs[section].append(t)
    return title, secs


def trim(para, maxlen=230):
    para = plain(para)
    if len(para) <= maxlen:
        return para
    cut = para[:maxlen]
    end = max(cut.rfind('. '), cut.rfind('; '))
    return cut[:end + 1] if end > 80 else cut.rsplit(' ', 1)[0] + '…'


def card_results(secs):
    """Results section -> (outcome sentence, [(value, label)])."""
    outcome, chips = '', []
    for l in secs.get('Results', []):
        if l.startswith('-'):
            v, _, lab = l[1:].partition('|')
            if lab.strip():
                chips.append((plain(v), plain(lab).lower()))
        elif not outcome:
            outcome = plain(l)
    return outcome, chips


# ---------------------------------------------------------------- card
def build_card(a):
    e = html.escape
    img_src = './project_images/' + urllib.parse.quote(a['stem'] + '.png', safe="()'!*-._~")
    chips = ''.join(f'<li><strong>{e(v)}</strong><span>{e(l)}</span></li>' for v, l in a['chips'])
    parts = [
        f'          <article class="projectCard reveal" data-delay="1" data-project-card data-search="{e(a["search"])}" '
        f'data-project="{e(a["stem"])}" data-slug="{a["slug"]}" data-github="{e(a["github"])}" '
        f'data-tags="{" ".join(a["filters"])}"' + (f' data-demo="{e(a["demo"])}"' if a['demo'] else '') +
        f' data-full-w="{a["fw"]}" data-full-h="{a["fh"]}">',
        '            <div class="projectThumbnail">',
        '              <picture>',
        f'                <source type="image/webp" srcset="./project_images/web/{a["slug"]}-640.webp" />',
        f'                <img src="{img_src}" alt="{e(a["alt"])}" width="{a["tw"]}" height="{a["th"]}" loading="lazy" decoding="async" />',
        '              </picture>',
        '            </div>',
        '            <div class="projectContent">',
        '              <div class="cardTop">',
        f'                <h3><button type="button" class="projectOpen" aria-haspopup="dialog">{e(a["name"])}</button></h3>',
        f'                <span class="pill">{e(a["pill"])}</span>',
        '              </div>',
    ]
    if a['outcome']:
        parts.append(f'              <p class="outcome">{e(a["outcome"])}</p>')
    if chips:
        parts.append(f'              <ul class="metricChips">{chips}</ul>')
    parts += [
        f'              <p class="meta">{e(a["summary"])}</p>',
        '              <div class="tags">' + ''.join(f'<span class="tag">{e(t)}</span>' for t in a['tags']) + '</div>',
        '              <div class="cardActions">',
        f'                <a class="projectGithubLink" href="{e(a["github"])}" target="_blank" rel="noopener noreferrer" '
        f'aria-label="{e(a["name"])} on GitHub (opens in a new tab)">GitHub ↗</a>',
        '              </div>',
        '            </div>',
        '          </article>',
    ]
    return '\n'.join(parts) + '\n'


def insert_card(page, card, flagship):
    more = page.index('<details class="moreProjects"')
    if flagship:
        close = page.rindex('        </div>\n      </section>', 0, more)   # end of the flagship grid
    else:
        close = page.index('        </div>\n      </details>', more)
    return page[:close].rstrip('\n') + '\n\n' + card + '\n' + page[close:]


def refresh_counts(page):
    n_main = len([m for m in re.finditer(r'<article class="projectCard[^>]*data-project-card[^>]*>', page)
                  if 'data-other-project' not in m.group(0)])
    n_other = len(re.findall(r'data-project-card data-other-project', page))
    more = page[page.index('<details class="moreProjects"'):page.index('</details>')]
    n_more = len(re.findall(r'data-project-card', more))
    page = re.sub(r'Showing \d+ of \d+ projects', f'Showing {n_main} of {n_main} projects', page, count=1)
    page = re.sub(r'(<span data-more-count>)\d+(</span>)', rf'\g<1>{n_more}\g<2>', page, count=1)
    return page, n_main, n_more, n_other


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--image', required=True)
    ap.add_argument('--text', required=True, help='your finished description .txt')
    ap.add_argument('--github', required=True)
    ap.add_argument('--name'); ap.add_argument('--summary'); ap.add_argument('--alt')
    ap.add_argument('--flagship', action='store_true')
    ap.add_argument('--filters'); ap.add_argument('--tags'); ap.add_argument('--pill'); ap.add_argument('--demo')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    mw = _load_make_webp()
    image, text_path = os.path.abspath(args.image), os.path.abspath(args.text)
    os.chdir(ROOT)

    if not os.path.isfile(image): die(f'image not found: {args.image}')
    if not os.path.isfile(text_path): die(f'description not found: {args.text}')
    if not re.match(r'^https://github\.com/[^/]+/[^/]+/?$', args.github):
        die('--github must look like https://github.com/<user>/<repo>')

    text = open(text_path, encoding='utf-8', errors='replace').read()
    title, secs = parse_txt(text)
    name = (args.name or title or '').strip()
    if not name: die('the .txt is empty: its first line must be the project name (or pass --name)')
    stem = re.sub(r'\s+', ' ', re.sub(r'[\\/:*?"<>|]', ' ', name)).strip()
    sl = mw.slug(stem)

    page = open('projects.html', encoding='utf-8').read()
    if f'data-slug="{sl}"' in page or os.path.exists(f'Project_data/{stem}.txt'):
        die(f'"{stem}" already exists (slug {sl}). Edit it by hand, or pick another --name.')

    low = text.lower()
    tools_found = [n for n, rx in TOOLS if re.search(rx, low)]
    card_tags = [t.strip() for t in args.tags.split(',') if t.strip()] if args.tags else tools_found[:4]
    flt = [f.strip() for f in args.filters.split(',') if f.strip()] if args.filters else \
          [fid for fid, _, rx in FILTERS if re.search(rx, low)][:3]
    bad = [f for f in flt if f not in {x[0] for x in FILTERS}]
    if bad: die(f'unknown filter(s) {bad}; use: ' + ', '.join(x[0] for x in FILTERS))
    pill = args.pill or next((lbl for fid, lbl, _ in FILTERS if flt and fid == flt[0]), 'Project')
    overview = [l for l in secs.get('Overview', []) if not l.startswith('-')]
    summary = args.summary or (trim(overview[0]) if overview else '')
    if not summary: die('no summary: add an "Overview" section to the .txt or pass --summary "One sentence"')
    outcome, chips = card_results(secs)
    alt = args.alt or f'Architecture diagram of the {name} project.'
    search = ' '.join(dict.fromkeys(re.sub(r'[^\w&/.+# -]', ' ', ' '.join([name] + card_tags + tools_found)).split()))

    if args.dry_run:
        print(f'would add "{name}" (slug {sl}) to {"Flagship" if args.flagship else "More projects"}')
        print(f'  summary : {summary}')
        print(f'  outcome : {outcome or "-"}   chips: {chips or "-"}')
        print(f'  pill    : {pill}   filters: {flt or "none"}   tags: {card_tags}')
        return

    # 1. image + webp
    dest = f'project_images/{stem}.png'
    if image != os.path.abspath(dest):
        from PIL import Image
        Image.open(image).save(dest, 'PNG')
    s2, tw, th, fw, fh = mw.make_webp(dest)
    assert s2 == sl
    # 2. description, copied as written
    with open(f'Project_data/{stem}.txt', 'w', encoding='utf-8') as f:
        f.write(text.rstrip() + '\n')
    # 3. card + counts + dates
    card = build_card(dict(stem=stem, slug=sl, name=name, github=args.github.rstrip('/'), filters=flt, search=search,
                           demo=args.demo, fw=fw, fh=fh, tw=tw, th=th, alt=alt, pill=pill, summary=summary,
                           tags=card_tags, outcome=outcome, chips=chips))
    page = insert_card(page, card, args.flagship)
    page, n_main, n_more, n_other = refresh_counts(page)
    today = datetime.date.today()
    page = re.sub(r'(Last updated <time datetime=")[^"]*(">)[^<]*(</time>)',
                  rf'\g<1>{today.isoformat()}\g<2>{today.day} {today.strftime("%b %Y")}\g<3>', page, count=1)
    open('projects.html', 'w', encoding='utf-8').write(page)
    # 4. links list + sitemap
    with open('project_links.txt', 'a', encoding='utf-8') as f:
        f.write(f'\n{name} - {args.github}\n')
    sm = open('sitemap.xml', encoding='utf-8').read()
    sm = re.sub(r'(projects\.html</loc>\s*<lastmod>)[^<]*(</lastmod>)', rf'\g<1>{today.isoformat()}\g<2>', sm)
    open('sitemap.xml', 'w', encoding='utf-8').write(sm)

    print(f'Added "{name}" ({sl}) to {"Flagship" if args.flagship else "More projects"}. '
          f'Site now has {n_main} projects ({n_more} under More) + {n_other} other resources.')
    print(f'  card    filters={flt or "none"} pill="{pill}" tags={card_tags}')
    if not args.alt:
        print('  todo    write real alt text for the diagram (--alt, or edit the <img alt> in projects.html)')
    print('  preview python3 -m http.server 8000  ->  http://localhost:8000/projects.html#' + sl)


if __name__ == '__main__':
    main()
