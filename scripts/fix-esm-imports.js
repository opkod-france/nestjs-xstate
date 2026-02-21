const fs = require('fs');
const path = require('path');

const ESM_DIR = path.join(__dirname, '..', 'dist', 'esm');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Add .js to relative imports that don't already end with a known extension
  const extensionPattern = /\.(js|mjs|cjs|json|node)$/;

  content = content.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, importPath, suffix) => {
      if (extensionPattern.test(importPath)) return match;
      return `${prefix}${importPath}.js${suffix}`;
    },
  );
  content = content.replace(
    /(import\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, importPath, suffix) => {
      if (extensionPattern.test(importPath)) return match;
      return `${prefix}${importPath}.js${suffix}`;
    },
  );
  fs.writeFileSync(filePath, content);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.js')) {
      fixFile(fullPath);
    }
  }
}

walk(ESM_DIR);
console.log('Fixed ESM imports with .js extensions');
