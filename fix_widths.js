const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.css'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  // Replace fixed width over 400px with max-width and 100% width
  // But be careful not to match 'max-width: NNNpx'
  const regex = /([^a-zA-Z0-9_-])width:\s*([4-9]\d{2,}|\d{4,})px/g;
  
  let newContent = content.replace(regex, (match, prefix, num) => {
    // If it's preceded by 'max-' or 'min-', ignore it
    if (prefix === '-') return match;
    changed = true;
    return `${prefix}max-width: ${num}px; width: 100%`;
  });

  // Specifically for category-list overflow issue
  if (f.includes('category-list.component.css')) {
    if (newContent.includes(':host-context(.dark-mode) .card-icon-img {') || newContent.includes('body.dark-mode .card-icon-img {')) {
        newContent = newContent.replace(/(:host-context\(\.dark-mode\)|body\.dark-mode)\s*\.card-visual\s*\{[\s\S]*?\}\s*(:host-context\(\.dark-mode\)|body\.dark-mode)\s*\.card-icon-img\s*\{[\s\S]*?\}/, 
        ':host-context(.dark-mode) .card-visual {\n  background: linear-gradient(135deg, rgba(224, 120, 64, 0.22), rgba(74, 222, 128, 0.18)) !important;\n}');
        changed = true;
    }
  }
  
  if (changed) {
    console.log('Fixed widths in: ' + f);
    fs.writeFileSync(f, newContent);
  }
});
