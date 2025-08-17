#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(projectRoot, 'reports');

const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', 'reports', 'archive']);
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.md', '.mde', '.html', '.txt']);
const MEDIA_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico', '.mp4', '.mov', '.avi', '.mp3', '.wav', '.pdf', '.ttf', '.otf', '.woff', '.woff2', '.heic', '.heif', '.xlsx']);
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css']);

/** Utilities **/
function isBinaryExt(ext) {
  return MEDIA_EXTENSIONS.has(ext.toLowerCase());
}

function isTextExt(ext) {
  return TEXT_EXTENSIONS.has(ext.toLowerCase());
}

function hashFile(filePath) {
  const hash = crypto.createHash('sha1');
  const stream = fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on('data', (d) => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function walk(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.git')) continue;
      const full = path.join(current, e.name);
      const rel = path.relative(projectRoot, full).replaceAll('\\', '/');
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        stack.push(full);
      } else if (e.isFile()) {
        out.push({ full, rel, size: fs.statSync(full).size, ext: path.extname(e.name) });
      }
    }
  }
  return out;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeCSV(filePath, rows) {
  const csv = rows.map(r => r.map(v => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
    return s;
  }).join(',')).join('\n');
  fs.writeFileSync(filePath, csv);
}

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function extractImports(code) {
  const results = [];
  const importRegex = /import\s+(?:[^'"\n]+\s+from\s+)?["']([^"']+)["']/g;
  const requireRegex = /require\(\s*["']([^"']+)["']\s*\)/g;
  const dynamicImportRegex = /import\(\s*["']([^"']+)["']\s*\)/g;
  for (const m of code.matchAll(importRegex)) results.push(m[1]);
  for (const m of code.matchAll(requireRegex)) results.push(m[1]);
  for (const m of code.matchAll(dynamicImportRegex)) results.push(m[1]);
  return results;
}

function topLevelDirs(relPath) {
  const seg = relPath.split('/');
  return seg.length ? seg[0] : '';
}

function countLines(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

/** Main **/
(async () => {
  ensureDir(reportsDir);
  const files = walk(projectRoot);

  // file-inventory.csv
  const inventoryRows = [['path','bytes','ext','is_media']];
  for (const f of files) {
    inventoryRows.push([f.rel, f.size, f.ext, isBinaryExt(f.ext) ? '1' : '0']);
  }
  writeCSV(path.join(reportsDir, 'file-inventory.csv'), inventoryRows);

  // large-assets.csv (>10MB)
  const large = files.filter(f => f.size > 10 * 1024 * 1024);
  const largeRows = [['path','bytes','ext']];
  for (const f of large) largeRows.push([f.rel, f.size, f.ext]);
  writeCSV(path.join(reportsDir, 'large-assets.csv'), largeRows);

  // duplicates.csv (same hash and size)
  const sizeBuckets = new Map();
  for (const f of files) {
    if (!sizeBuckets.has(f.size)) sizeBuckets.set(f.size, []);
    sizeBuckets.get(f.size).push(f);
  }
  const dupCandidates = [...sizeBuckets.values()].filter(arr => arr.length > 1).flat();
  const hashes = new Map();
  for (const f of dupCandidates) {
    const h = await hashFile(f.full);
    const key = `${f.size}:${h}`;
    if (!hashes.has(key)) hashes.set(key, []);
    hashes.get(key).push(f);
  }
  const dupRows = [['bytes','hash','count','paths']];
  for (const [key, arr] of hashes) {
    if (arr.length > 1) {
      const [bytes, hash] = key.split(':');
      dupRows.push([bytes, hash, arr.length, arr.map(a => a.rel).join(' | ')]);
    }
  }
  writeCSV(path.join(reportsDir, 'duplicates.csv'), dupRows);

  // LOC by folder (aggregate)
  const locByFolder = new Map();
  for (const f of files) {
    if (!CODE_EXTENSIONS.has(f.ext)) continue;
    const text = readTextSafe(f.full);
    const loc = countLines(text);
    const dir = topLevelDirs(f.rel);
    locByFolder.set(dir, (locByFolder.get(dir) || 0) + loc);
  }
  const locRows = [['folder','loc']];
  for (const [folder, loc] of locByFolder) locRows.push([folder, loc]);
  writeCSV(path.join(reportsDir, 'loc-by-folder.csv'), locRows);

  // Dead files detection (heuristic)
  // Entry roots: app/, components/, hooks/, lib/, utils/, styles/, public/, types/
  // Consider as candidates: code files not under app/ and not referenced anywhere.
  const codeFiles = files.filter(f => CODE_EXTENSIONS.has(f.ext) || ['.json', '.md'].includes(f.ext));
  const codeTextCache = new Map();
  for (const f of codeFiles) {
    if (CODE_EXTENSIONS.has(f.ext) || f.ext === '.json') {
      codeTextCache.set(f.rel, readTextSafe(f.full));
    }
  }
  // Build import graph (relative file refs only)
  const importIndex = new Map(); // file -> set(imports)
  const allImports = new Map(); // import string -> set(files that import)
  for (const f of codeFiles) {
    if (!(CODE_EXTENSIONS.has(f.ext))) continue;
    const code = codeTextCache.get(f.rel) ?? readTextSafe(f.full);
    const imports = extractImports(code);
    importIndex.set(f.rel, new Set(imports));
    for (const imp of imports) {
      if (!allImports.has(imp)) allImports.set(imp, new Set());
      allImports.get(imp).add(f.rel);
    }
  }
  // Helper to see if a file is referenced by path or basename
  function isReferenced(f) {
    const base = path.basename(f.rel);
    // 1) exact relative path match in imports (without extension or with)
    const relNoExt = f.rel.replace(new RegExp(`${f.ext.replace('.', '\\.')}$`), '');
    const candidates = new Set([
      f.rel,
      './' + f.rel,
      '../' + f.rel,
      relNoExt,
      './' + relNoExt,
      '../' + relNoExt,
      base,
      base.replace(f.ext, ''),
    ]);
    for (const cand of candidates) {
      if (allImports.has(cand)) return true;
    }
    // 2) text search across code for basename (for assets)
    for (const [, text] of codeTextCache) {
      if (text && base.length > 3 && text.includes(base)) return true;
    }
    return false;
  }

  const deadRows = [['path','reason','confidence']];
  for (const f of files) {
    const top = topLevelDirs(f.rel);
    if (top === 'app' || top === 'public' || top === 'styles') continue; // likely used
    if (CODE_EXTENSIONS.has(f.ext) || isBinaryExt(f.ext) || f.ext === '.json' || f.ext === '.md') {
      const referenced = isReferenced(f);
      if (!referenced) {
        deadRows.push([f.rel, 'not imported or referenced by text search', 'low']);
      }
    }
  }
  writeCSV(path.join(reportsDir, 'dead-files.csv'), deadRows);

  // deps-audit.txt (unused deps + sizes by on-disk installed size approximation not included)
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const declared = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };
  const importedPkgs = new Set();
  // detect bare module imports (e.g., 'react', '@scope/pkg/sublib')
  const bareRe = /from\s+["'](@[^"'\/]+\/[A-Za-z0-9_.\-]+|[A-Za-z0-9_.\-]+)(?:\/[A-Za-z0-9_.\-\/]+)?["']|require\(\s*["'](@[^"'\/]+\/[A-Za-z0-9_.\-]+|[A-Za-z0-9_.\-]+)["']/g;
  for (const [rel, text] of codeTextCache) {
    if (!text) continue;
    for (const m of text.matchAll(bareRe)) {
      if (!m[1]) continue;
      // Reduce subpath imports to package root
      let name = m[1];
      if (name.startsWith('@')) {
        const parts = name.split('/');
        name = parts.slice(0, 2).join('/');
      } else {
        name = name.split('/')[0];
      }
      importedPkgs.add(name);
    }
  }
  const unused = Object.keys(declared).filter(d => !importedPkgs.has(d));
  const depsAudit = [];
  depsAudit.push('# Dependencies Audit');
  depsAudit.push('');
  depsAudit.push('Declared dependencies/devDependencies:');
  for (const [name, ver] of Object.entries(declared)) depsAudit.push(`- ${name}@${ver}`);
  depsAudit.push('');
  depsAudit.push('Detected imported packages:');
  for (const name of [...importedPkgs].sort()) depsAudit.push(`- ${name}`);
  depsAudit.push('');
  depsAudit.push('Potentially unused packages (heuristic):');
  for (const name of unused) depsAudit.push(`- ${name}`);
  depsAudit.push('');
  depsAudit.push('Note: This is heuristic and may include false positives/negatives.');
  fs.writeFileSync(path.join(reportsDir, 'deps-audit.txt'), depsAudit.join('\n'));

  console.log('Report generated in /reports');
})();
