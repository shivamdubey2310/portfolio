#!/usr/bin/env python3
"""Add a project to the portfolio from its diagram image + README + GitHub URL.

Usage:
  python3 tools/add-project.py --image diagram.png --readme README.md \\
      --github https://github.com/you/repo [options]

What it does (see README.md, "Add or edit a project", for the manual version):
  1. copies the image to project_images/<Name>.png and makes the WebP variants
  2. writes Project_data/<Name>.txt from the README (best effort, review it!)
  3. inserts the card into projects.html (More projects group, or --flagship)
  4. adds the GitHub link to project_links.txt
  5. refreshes the static counts, the footer "Last updated" date and sitemap.xml

Options:
  --name        Project title (default: first "# Heading" of the README)
  --summary     One-sentence card summary (default: first README paragraph, trimmed)
  --alt         Alt text describing the diagram (default is generic: please set it)
  --flagship    Put the card in the Flagship grid instead of "More projects"
  --filters     Comma list for the topic chips: streaming,cdc,medallion,airflow,
                warehouse,nosql,bi-ml (default: detected from the README)
  --tags        Comma list for the tool tags on the card (default: detected)
  --pill        Small label on the card (default: first filter, else "Project")
  --outcome / --metric "24h -> 10 min | Data latency" (repeatable)  card + detail "Results"
  --role --year --status --demo   optional detail-view fields / Live demo button
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
SECTION_MAP = [  # first match wins; order matters
    ('techstack', r'tech|stack|built with|technolog|tools|libraries'),
    ('challenge', r'challenge|problem|motivation|background|goal|objective|why'),
    ('highlights', r'highlight|result|outcome|learning|achievement|impact|key'),
    ('solution', r'solution|approach|how it works|architecture|feature|implement|pipeline|workflow|design|what it does'),
    ('overview', r'overview|about|description|introduction|summary|project'),
]


def slug(name):
    return _mw.slug(name)


def die(msg):
    print('error: ' + msg, file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------- README -> sections
def clean_inline(s):
    s = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', s)                  # images / badges
    s = re.sub(r'\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)', '', s)     # linked badges
    s = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', s)              # links -> text
    s = re.sub(r'<[^>]+>', '', s)                               # html tags
    s = re.sub(r'__([^_]+)__', r'**\1**', s)
    s = re.sub(r'[\U0001F300-\U0001FAFF☀-➿️]', '', s)  # emoji
    return re.sub(r'\s+', ' ', s).strip()


def parse_readme(text):
    """-> (title, intro_lines, {section_key: [lines]}) with lines already in .txt style."""
    title, cur, in_code = None, '_intro', False
    buckets = {'_intro': []}
    for raw in text.splitlines():
        line = raw.rstrip()
        if line.strip().startswith('```'):
            in_code = not in_code
            continue
        if in_code or line.strip().startswith('|') or re.match(r'^\s*[-=_*]{3,}\s*$', line):
            continue
        m = re.match(r'^(#{1,6})\s+(.*)$', line)
        if m:
            heading = clean_inline(m.group(2))
            if len(m.group(1)) == 1 and title is None:
                title = heading
                continue
            key = next((k for k, rx in SECTION_MAP if re.search(rx, heading.lower())), None)
            cur = key or '_other'
            buckets.setdefault(cur, [])
            if key is None:
                buckets[cur].append('- ' + heading + ':')   # keep unknown sections as labelled bullets below
            continue
        b = re.match(r'^(\s*)([-*+]|\d+[.)])\s+(.*)$', line)
        if b:
            indent = '  ' if len(b.group(1)) >= 2 else ''
            body = clean_inline(b.group(3))
            if body:
                buckets.setdefault(cur, []).append(f'{indent}- {body}')
        else:
            body = clean_inline(line)
            if body:
                buckets.setdefault(cur, []).append(body)
    return title, buckets


def detect(text, vocab, limit=None):
    low = text.lower()
    found = [name for name, rx in vocab if re.search(rx, low)]
    return found[:limit] if limit else found


def first_sentence_block(lines, maxlen=230):
    para = next((l for l in lines if not l.startswith('-')), '')
    if len(para) <= maxlen:
        return para
    cut = para[:maxlen]
    end = max(cut.rfind('. '), cut.rfind('; '))
    return (cut[:end + 1] if end > 80 else cut.rsplit(' ', 1)[0] + '…')


def build_txt(name, b, args, tools_found):
    out = [name, '']
    metrics = [m.strip() for m in (args.metric or [])]
    if args.outcome or metrics:
        out += ['Results']
        if args.outcome:
            out.append(args.outcome)
        out += [f'- {m}' for m in metrics]
        out.append('')
    if args.role:
        out += ['My Role', args.role, '']
    info = [f'- Year: {args.year}'] if args.year else []
    info += [f'- Status: {args.status}'] if args.status else []
    if info:
        out += ['Project Info'] + info + ['']

    overview = b.get('overview') or b.get('_intro') or []
    if overview:
        out += ['Overview'] + overview[:4] + ['']
    if b.get('techstack'):
        stack = [l if l.startswith(('-', '  -')) else '- ' + l for l in b['techstack']]
        out += ['Tech Stack'] + stack + ['']
    elif tools_found:
        out += ['Tech Stack', '- Tools: ' + ', '.join(tools_found), '']
    if b.get('challenge'):
        out += ['The Challenge'] + b['challenge'] + ['']
    sol = (b.get('solution') or []) + (b.get('_other') or [])
    if sol:
        out += ['The Solution'] + sol + ['']
    if b.get('highlights'):
        out += ['Key Highlights'] + b['highlights'] + ['']
    if not (args.role or args.year or args.status):
        out += ['# TODO(confirm): optional sections for the detail view. Remove the leading "# " and fill in with facts from the resume.',
                '# My Role', '# <one line: what you owned>', '# Project Info',
                '# - Year: <year>', '# - Status: <Completed | In progress | Production>']
    return '\n'.join(out).rstrip() + '\n'


# ---------------------------------------------------------------- card
def build_card(a):
    e = html.escape
    img_src = './project_images/' + urllib.parse.quote(a['stem'] + '.png', safe="()'!*-._~")
    chips = ''.join(f'<li><strong>{e(v.strip())}</strong><span>{e(l.strip().lower())}</span></li>'
                    for v, _, l in (m.partition('|') for m in a['metrics']) if l.strip())
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
        # end of the flagship grid: the "</div>" right before the "</section>" that precedes <details>
        close = page.rindex('        </div>\n      </section>', 0, more)
    else:
        close = page.index('        </div>\n      </details>', more)
    return page[:close].rstrip('\n') + '\n\n' + card + '\n' + page[close:]


def refresh_counts(page):
    main = [m for m in re.finditer(r'<article class="projectCard[^>]*data-project-card([^>]*)>', page)
            if 'data-other-project' not in m.group(0)]
    other = len(re.findall(r'data-project-card data-other-project', page))
    in_more = len(re.findall(r'data-project-card', page[page.index('<details class="moreProjects"'):page.index('</details>')]))
    page = re.sub(r'Showing \d+ of \d+ projects', f'Showing {len(main)} of {len(main)} projects', page, count=1)
    page = re.sub(r'(<span data-more-count>)\d+(</span>)', rf'\g<1>{in_more}\g<2>', page, count=1)
    return page, len(main), in_more, other


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--image', required=True)
    ap.add_argument('--readme', required=True)
    ap.add_argument('--github', required=True)
    ap.add_argument('--name'); ap.add_argument('--summary'); ap.add_argument('--alt')
    ap.add_argument('--flagship', action='store_true')
    ap.add_argument('--filters'); ap.add_argument('--tags'); ap.add_argument('--pill')
    ap.add_argument('--outcome'); ap.add_argument('--metric', action='append')
    ap.add_argument('--role'); ap.add_argument('--year'); ap.add_argument('--status'); ap.add_argument('--demo')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    global _mw
    _mw = _load_make_webp()
    os.chdir(ROOT)

    if not os.path.isfile(args.image): die(f'image not found: {args.image}')
    if not os.path.isfile(args.readme): die(f'README not found: {args.readme}')
    if not re.match(r'^https://github\.com/[^/]+/[^/]+/?$', args.github): die('--github must look like https://github.com/<user>/<repo>')

    text = open(args.readme, encoding='utf-8', errors='replace').read()
    title, buckets = parse_readme(text)
    name = (args.name or title or '').strip()
    if not name: die('no title found: pass --name "Project name"')
    stem = re.sub(r'\s+', ' ', re.sub(r'[\\/:*?"<>|]', ' ', name)).strip()
    sl = slug(stem)

    page = open('projects.html', encoding='utf-8').read()
    if f'data-slug="{sl}"' in page or os.path.exists(f'Project_data/{stem}.txt'):
        die(f'"{stem}" already exists (slug {sl}). Edit it by hand, or pick another --name.')

    tools_found = detect(text, TOOLS)
    card_tags = [t.strip() for t in args.tags.split(',')] if args.tags else tools_found[:4]
    flt = [f.strip() for f in args.filters.split(',') if f.strip()] if args.filters else \
          [fid for fid, _, rx in FILTERS if re.search(rx, text.lower())][:3]
    bad = [f for f in flt if f not in {x[0] for x in FILTERS}]
    if bad: die(f'unknown filter(s) {bad}; use: ' + ', '.join(x[0] for x in FILTERS))
    pill = args.pill or next((lbl for fid, lbl, _ in FILTERS if flt and fid == flt[0]), 'Project')
    summary = args.summary or first_sentence_block(buckets.get('overview') or buckets.get('_intro') or [])
    summary = re.sub(r'\*\*([^*]+)\*\*|`([^`]+)`', lambda m: m.group(1) or m.group(2), summary)  # card text is plain
    if not summary: die('no summary found: pass --summary "One sentence"')
    alt = args.alt or f'Architecture diagram of the {name} project.'
    search = ' '.join(dict.fromkeys(re.sub(r'[^\w&/.+# -]', ' ', ' '.join([name] + card_tags + tools_found)).split()))

    txt = build_txt(name, buckets, args, tools_found)

    if args.dry_run:
        print(f'--- would write Project_data/{stem}.txt ---\n{txt}')
        print(f'--- card goes in: {"Flagship" if args.flagship else "More projects"} | pill={pill} | filters={flt} | tags={card_tags}')
        return

    # 1. image + webp
    dest = f'project_images/{stem}.png'
    if os.path.abspath(args.image) != os.path.abspath(dest):
        from PIL import Image
        Image.open(args.image).save(dest, 'PNG')
    s2, tw, th, fw, fh = _mw.make_webp(dest)
    assert s2 == sl
    # 2. detail text
    open(f'Project_data/{stem}.txt', 'w', encoding='utf-8').write(txt)
    # 3. card + counts + dates
    card = build_card(dict(stem=stem, slug=sl, name=name, github=args.github.rstrip('/'), filters=flt, search=search,
                           demo=args.demo, fw=fw, fh=fh, tw=tw, th=th, alt=alt, pill=pill, summary=summary,
                           tags=card_tags, outcome=args.outcome, metrics=args.metric or []))
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
    print(f'  image   project_images/{stem}.png (+ web/{sl}-*.webp)')
    print(f'  detail  Project_data/{stem}.txt   <- review: auto-converted from the README')
    print(f'  card    filters={flt or "none"} pill="{pill}" tags={card_tags}')
    todo = []
    if not args.alt: todo.append('write real alt text for the diagram (--alt, or edit the <img alt> in projects.html)')
    if not (args.role and args.year and args.status): todo.append('fill My Role / Year / Status in the .txt (facts from your resume only)')
    if not args.outcome: todo.append('optionally add an outcome / metrics (--outcome, --metric) only if the resume supports them')
    print('  next    ' + '\n          '.join(todo) if todo else '')
    print('  preview python3 -m http.server 8000  ->  http://localhost:8000/projects.html#' + sl)


if __name__ == '__main__':
    main()
