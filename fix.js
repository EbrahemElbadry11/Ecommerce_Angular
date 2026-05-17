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
  
  // Fix max-width: ;
  // In our previous script, we replaced 'width: XXXpx' with 'max-width: ; width: 100%;'
  // But wait, what was XXX? We can look at the original files, or look at height if it matches!
  // Actually, we can just `git restore` the files that we messed up in the last commit,
  // BUT we don't want to revert the `:host-context(.dark-mode)` changes.
  
  // It's easier to just git restore the specific files and then rerun the dark mode fix, 
  // because we only ran TWO scripts.
});
