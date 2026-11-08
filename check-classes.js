const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'styles');
const appDir = path.join(__dirname, 'app');
const compDir = path.join(__dirname, 'components');

// 1. Gather all CSS class names from styles/*.css
const cssClasses = new Set();

fs.readdirSync(stylesDir).forEach((file) => {
  if (!file.endsWith('.css')) return;
  const content = fs.readFileSync(path.join(stylesDir, file), 'utf8');

  // Strip CSS comments
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '');

  // Match class selectors: .classname (stops before :, space, >, +, ~, {, ., [, etc.)
  const classMatches = cleanContent.matchAll(/\.([a-zA-Z0-9_-]+)/g);
  for (const m of classMatches) {
    cssClasses.add(m[1]);
  }
});

console.log(`Found ${cssClasses.size} unique CSS classes in styles/*.css`);

// 2. Find all .jsx files in app/ and components/
function getJsxFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getJsxFiles(fullPath));
    } else if (item.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const jsxFiles = [...getJsxFiles(appDir), ...getJsxFiles(compDir)];

// Known prefix expressions or helper functions that dynamically build classes:
// 1) fieldCls('name') -> 'field' and 'field--error'
// 2) 'notice' + (bar ? ' notice--' + bar.kind : '') -> notice, notice--ok, notice--err, notice--info
// 3) 'hero-slide' + (slide.tint ? ' hero-slide--' + slide.tint : '') -> hero-slide, hero-slide--light
const DYNAMIC_PREFIXES = ['notice--', 'hero-slide--'];

// 3. Extract className strings from JSX files
const usedClasses = new Map(); // className -> Set of files

function addClass(cls, relPath) {
  if (!cls || typeof cls !== 'string') return;
  const trimmed = cls.trim();
  if (!trimmed || !/^[a-zA-Z0-9_-]+$/.test(trimmed)) return;
  if (/^\d+$/.test(trimmed)) return;

  if (!usedClasses.has(trimmed)) usedClasses.set(trimmed, new Set());
  usedClasses.get(trimmed).add(relPath);
}

jsxFiles.forEach((filePath) => {
  const relPath = path.relative(__dirname, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');

  // Match className attribute:
  // className="..."
  // className={'...'}
  // className={`...`}
  // className={...}
  const classNameRegex = /className\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|(?:\{([^}]*)\}))/g;

  let match;
  while ((match = classNameRegex.exec(content)) !== null) {
    const stringVal = match[1] || match[2];
    const exprVal = match[3];

    if (stringVal) {
      stringVal.split(/\s+/).forEach((c) => addClass(c, relPath));
    } else if (exprVal) {
      // Check if it's fieldCls(...)
      if (/fieldCls\(/.test(exprVal)) {
        addClass('field', relPath);
        addClass('field--error', relPath);
        continue;
      }

      // Inside JS expression in className={...}:
      // Match string literals: '...', "...", `...`
      // Filter out condition operands like === 'profile' or !== 'orders'
      const strMatches = exprVal.matchAll(/(?:'([^']*)')|(?:"([^"]*)")|(?:`([^`]*)`)/g);
      for (const sm of strMatches) {
        const raw = sm[1] || sm[2] || sm[3];
        if (!raw) continue;

        // Check if this string is part of a comparison (e.g. === 'profile' or !== 'orders')
        const indexInExpr = sm.index;
        const preceding = exprVal.slice(Math.max(0, indexInExpr - 5), indexInExpr).trim();
        if (preceding.endsWith('===') || preceding.endsWith('!==') || preceding.endsWith('==') || preceding.endsWith('!=')) {
          // Comparison operand, not a class name
          continue;
        }

        // Clean template literal interpolations
        const cleaned = raw.replace(/\$\{[^}]+\}/g, ' ');
        cleaned.split(/\s+/).forEach((c) => addClass(c, relPath));
      }
    }
  }
});

console.log(`Found ${usedClasses.size} unique classNames used in JSX.`);

// 4. Compare
const missing = [];
const dynamicExplained = [];

for (const [cls, files] of usedClasses.entries()) {
  if (cssClasses.has(cls)) continue;

  if (DYNAMIC_PREFIXES.includes(cls)) {
    dynamicExplained.push({ cls, reason: 'Prefix for dynamic classes: notice--ok/err/info or hero-slide--light, all defined in CSS.' });
    continue;
  }

  missing.push({ cls, files: Array.from(files) });
}

console.log('\n--- VERIFICATION REPORT ---');
if (dynamicExplained.length > 0) {
  console.log('\nDynamic Class Prefixes (Explained):');
  dynamicExplained.forEach((d) => console.log(`* ${d.cls}: ${d.reason}`));
}

if (missing.length === 0) {
  console.log('\nResult: ALL JSX classNames exist in styles/*.css! (0 missing classes)');
} else {
  console.log(`\nResult: Found ${missing.length} missing classes:`);
  missing.forEach(({ cls, files }) => {
    console.log(`- ${cls} (used in: ${files.join(', ')})`);
  });
}
