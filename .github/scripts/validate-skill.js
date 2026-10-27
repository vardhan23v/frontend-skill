#!/usr/bin/env node
// CI validation for the create-frontend skill. No dependencies.
//   - SKILL.md frontmatter follows the Agent Skills spec (name matches the folder, description present and
//     under 1024 characters, license/compatibility/metadata.version present)
//   - every theme in references/themes.md passes scripts/check-contrast.js in both modes
//   - the compact appendix in SKILL.md carries exactly the same hex values as the reference
//   - the project → theme tables in SKILL.md, themes.md and README.md only name themes that exist
//   - relative links in the markdown files point at files that exist
//   - CHANGELOG.md has an entry for metadata.version
//   - the delivery references, workflow templates and verification script are present
//   - verify.sh is executable and parses under `sh -n`
//   - the workflow templates parse as YAML (system Ruby; skipped with a warning when unavailable)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const skillDir = path.join(root, 'create-frontend');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const errors = [];
const fail = (m) => errors.push(m);

// ---------- frontmatter
const skill = read('create-frontend/SKILL.md');
const fm = /^---\n([\s\S]*?)\n---\n/.exec(skill);
if (!fm) fail('SKILL.md: no YAML frontmatter');
const front = fm ? fm[1] : '';
const field = (k) => { const m = new RegExp(`^${k}:\\s*"?([^"\\n]*)"?\\s*$`, 'm').exec(front); return m ? m[1].trim() : null; };
const name = field('name');
if (name !== path.basename(skillDir)) fail(`SKILL.md: name "${name}" must equal the folder name "${path.basename(skillDir)}"`);
if (name && !/^[a-z0-9-]{1,64}$/.test(name)) fail(`SKILL.md: name "${name}" must be lowercase letters, digits and hyphens, at most 64 characters`);
const description = field('description');
if (!description) fail('SKILL.md: description missing');
else if (description.length > 1024) fail(`SKILL.md: description is ${description.length} characters; the spec allows 1024`);
if (!field('license')) fail('SKILL.md: license missing');
if (!field('compatibility')) fail('SKILL.md: compatibility missing');
const version = (/^metadata:\n(?:[ \t]+[^\n]*\n)*?[ \t]+version:\s*"?([^"\n]+)"?/m.exec(front) || [])[1];
if (!version) fail('SKILL.md: metadata.version missing');

// ---------- themes from the reference CSS blocks
const CSS_TO_KEY = { background: 'background', foreground: 'foreground', surface: 'surface', muted: 'muted', 'muted-foreground': 'mutedForeground', border: 'border', input: 'input', primary: 'primary', 'primary-foreground': 'primaryForeground', accent: 'accent', 'accent-foreground': 'accentForeground', ring: 'ring', danger: 'danger', 'danger-foreground': 'dangerForeground', success: 'success', 'success-foreground': 'successForeground', warning: 'warning', 'warning-foreground': 'warningForeground' };
const KEYS = Object.values(CSS_TO_KEY);
const ref = read('create-frontend/references/themes.md');
const themes = {};
const sectionRe = /^## (.+?) `([a-z0-9-]+)`\n([\s\S]*?)(?=^## )/gm;
let m;
while ((m = sectionRe.exec(ref + '\n## end\n'))) {
  const [, title, slug, body] = m;
  const block = (sel) => {
    const b = new RegExp(`^${sel.replace('.', '\\.')} \\{\\n([\\s\\S]*?)^\\}`, 'm').exec(body);
    if (!b) { fail(`themes.md ${slug}: no ${sel} block`); return null; }
    const t = {};
    for (const line of b[1].split('\n')) {
      const d = /^\s+--([a-z-]+):\s*(.+);$/.exec(line);
      if (!d) { if (line.trim()) fail(`themes.md ${slug} ${sel}: unparseable line "${line.trim()}"`); continue; }
      if (CSS_TO_KEY[d[1]]) { if (!/^#[0-9a-f]{6}$/.test(d[2])) fail(`themes.md ${slug} ${sel}: --${d[1]} is "${d[2]}", not a lowercase 6-digit hex`); t[CSS_TO_KEY[d[1]]] = d[2]; }
    }
    for (const k of KEYS) if (!t[k]) fail(`themes.md ${slug} ${sel}: missing --${Object.keys(CSS_TO_KEY).find(c => CSS_TO_KEY[c] === k)}`);
    return t;
  };
  themes[slug] = { title, light: block(':root'), dark: block('.dark') };
}
const slugs = Object.keys(themes);
if (slugs.length < 1) fail('themes.md: no theme sections found');

const checker = path.join(skillDir, 'scripts', 'check-contrast.js');
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'cf-validate-'));
for (const slug of slugs) {
  const t = themes[slug];
  if (!t.light || !t.dark) continue;
  const f = path.join(tmp, `${slug}.json`);
  fs.writeFileSync(f, JSON.stringify({ light: t.light, dark: t.dark }));
  try { execFileSync('node', [checker, f], { encoding: 'utf8' }); }
  catch (e) {
    const rep = JSON.parse(e.stdout || '{}');
    const bad = Object.entries(rep.modes || {}).flatMap(([mode, rows]) => rows.filter(r => !r.ok && r.kind !== 'info').map(r => `${mode} ${r.pair} ${r.ratio}<${r.required}`));
    fail(`themes.md ${slug}: check-contrast.js failed: ${bad.join('; ') || (rep.invalidHex || []).join(', ') || e.message}`);
  }
}

// ---------- appendix in SKILL.md must equal the reference
const appendixStart = skill.indexOf('## Appendix: theme tokens');
if (appendixStart < 0) fail('SKILL.md: appendix "## Appendix: theme tokens" missing');
else {
  const rows = skill.slice(appendixStart).split('\n').filter(l => /^\| .+ \| (light|dark) \| #/.test(l));
  const seen = new Set();
  for (const row of rows) {
    const cells = row.split('|').map(s => s.trim()).filter(Boolean);
    const [title, mode, ...hex] = cells;
    const slug = slugs.find(s => themes[s].title === title);
    if (!slug) { fail(`SKILL.md appendix: theme "${title}" is not in themes.md`); continue; }
    seen.add(slug);
    const expected = KEYS.map(k => themes[slug][mode][k]);
    if (hex.length !== expected.length) { fail(`SKILL.md appendix ${title} ${mode}: ${hex.length} values, expected ${expected.length}`); continue; }
    expected.forEach((v, i) => { if (hex[i] !== v) fail(`SKILL.md appendix ${title} ${mode}: ${KEYS[i]} is ${hex[i]}, reference has ${v}`); });
  }
  for (const s of slugs) if (!seen.has(s)) fail(`SKILL.md appendix: theme "${themes[s].title}" missing`);
}

// ---------- project → theme tables only name real themes
const titles = slugs.map(s => themes[s].title);
const checkTable = (file, text, header, themeCell) => {
  const i = text.indexOf(header);
  if (i < 0) { fail(`${file}: table starting "${header}" not found`); return; }
  const rows = text.slice(i).split('\n').slice(2);
  for (const row of rows) {
    if (!row.startsWith('|')) break;
    const cell = row.split('|')[themeCell] || '';
    const named = titles.filter(t => cell.includes(t));
    if (!named.length) fail(`${file}: table row "${row.trim().slice(0, 60)}" names no known theme`);
  }
};
checkTable('SKILL.md', skill, '| Project | Theme |', 2);
checkTable('themes.md', ref, '| Project | Theme |', 2);
const readme = read('README.md');
checkTable('README.md', readme, '| Theme | Picked for | Character |', 1);

// ---------- relative links
for (const file of ['README.md', 'create-frontend/SKILL.md', 'create-frontend/references/themes.md', 'create-frontend/references/accessibility.md', 'create-frontend/references/github-delivery.md', 'create-frontend/references/observability.md', 'create-frontend/references/quality-gates.md', 'create-frontend/references/security-headers.md', 'create-frontend/references/motion.md', 'create-frontend/references/design-directions.md', 'CHANGELOG.md']) {
  const text = read(file);
  const linkRe = /\]\(([^)\s#]+)(#[^)]*)?\)/g;
  let l;
  while ((l = linkRe.exec(text))) {
    const target = l[1];
    if (/^[a-z]+:/.test(target)) continue;
    const resolved = path.resolve(path.dirname(path.join(root, file)), target);
    if (!fs.existsSync(resolved)) fail(`${file}: link to missing file "${target}"`);
  }
}

// ---------- delivery files
const required = [
  'create-frontend/references/github-delivery.md',
  'create-frontend/references/security-headers.md',
  'create-frontend/references/observability.md',
  'create-frontend/references/accessibility.md',
  'create-frontend/references/quality-gates.md',
  'create-frontend/assets/github/ci.yml',
  'create-frontend/assets/github/pages.yml',
  'create-frontend/scripts/verify.sh',
];
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { fail(`${file}: required file is missing`); continue; }
  if (fs.statSync(full).size < 200) fail(`${file}: file is suspiciously short`);
  if (file.endsWith('.md')) {
    const text = fs.readFileSync(full, 'utf8');
    if (!/^# .+/m.test(text)) fail(`${file}: no level-one heading`);
    if (!/SKILL\.md/.test(text)) fail(`${file}: does not refer back to SKILL.md`);
  }
}

const verify = path.join(skillDir, 'scripts', 'verify.sh');
if (fs.existsSync(verify)) {
  if (!(fs.statSync(verify).mode & 0o111)) fail('create-frontend/scripts/verify.sh: not executable (chmod +x)');
  try { execFileSync('sh', ['-n', verify], { encoding: 'utf8' }); }
  catch (e) { fail(`create-frontend/scripts/verify.sh: sh -n failed: ${String(e.stderr || e.message).trim()}`); }
}

// The workflows are copied into generated projects; a YAML syntax error is a broken template.
const workflows = ['create-frontend/assets/github/ci.yml', 'create-frontend/assets/github/pages.yml'];
let ruby = true;
try { execFileSync('ruby', ['-e', 'exit 0'], { stdio: 'ignore' }); }
catch { ruby = false; }
for (const file of workflows) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const key of ['name:', 'on:', 'jobs:']) {
    if (!new RegExp(`^${key}`, 'm').test(text)) fail(`${file}: missing top-level "${key}"`);
  }
  if (ruby) {
    try { execFileSync('ruby', ['-ryaml', '-e', 'YAML.load_file(ARGV[0])', path.join(root, file)], { encoding: 'utf8', stdio: 'pipe' }); }
    catch (e) { fail(`${file}: YAML parse failed: ${String(e.stderr || e.message).trim()}`); }
  } else if (process.env.CI) {
    fail(`${file}: cannot parse YAML; Ruby is required in CI`);
  }
}

// ---------- the skill promises delivery in the workflow itself
for (const [label, needle] of [
  ['eight verification categories', 'Eight categories.'],
  ['WCAG 2.2', 'WCAG 2.2'],
  ['delivery reference', 'references/github-delivery.md'],
  ['security headers reference', 'references/security-headers.md'],
  ['observability reference', 'references/observability.md'],
  ['quality gates reference', 'references/quality-gates.md'],
  ['verify script', 'scripts/verify.sh'],
]) {
  if (!skill.includes(needle)) fail(`SKILL.md: missing ${label} ("${needle}")`);
}

// README must not claim an older version than the frontmatter.
const readmeVersion = /\*\*Version:\*\*\s*([0-9]+\.[0-9]+\.[0-9]+)/.exec(readme);
if (!readmeVersion) fail('README.md: no "**Version:** x.y.z" line');
else if (version && readmeVersion[1] !== version) fail(`README.md: version ${readmeVersion[1]} does not match metadata.version ${version}`);

// ---------- changelog has the version
if (version && !read('CHANGELOG.md').includes(`## ${version} `)) fail(`CHANGELOG.md: no "## ${version}" entry for metadata.version`);

// ---------- result
if (errors.length) { console.error(errors.map(e => ` ✗ ${e}`).join('\n')); process.exit(1); }
console.log(` ✓ frontmatter ok (name ${name}, version ${version}, description ${description.length} chars)`);
console.log(` ✓ ${slugs.length} themes pass check-contrast.js in both modes`);
console.log(' ✓ SKILL.md appendix matches the reference');
console.log(' ✓ theme tables and relative links resolve');
console.log(' ✓ delivery references, workflow templates and verify.sh present');
console.log(` ✓ verify.sh executable and sh -n clean${ruby ? ', workflow YAML parses' : ' (Ruby not found; YAML parse skipped)'}`);
