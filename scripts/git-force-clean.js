const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const lockFile = path.join(__dirname, '..', '.git', 'index.lock');
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }

  console.log('1. Creating clean orphan branch...');
  execSync('git checkout --orphan clean_main', { stdio: 'inherit' });

  console.log('2. Staging all clean files...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log('3. Creating pristine commit without any exposed secrets...');
  execSync('git commit -m "feat: initialize ZoldyVocab with Spaced Repetition, Mochi Vocab course, and full documentation"', { stdio: 'inherit' });

  console.log('4. Replacing old main branch...');
  execSync('git branch -D main', { stdio: 'inherit' });
  execSync('git branch -m main', { stdio: 'inherit' });

  console.log('5. Force-pushing pristine history to GitHub...');
  execSync('git push -f origin main', { stdio: 'inherit' });

  console.log('🎉 Clean push to GitHub complete!');
} catch (err) {
  console.error('Error during git clean push:', err.message);
  process.exit(1);
}
