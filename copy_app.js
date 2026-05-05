const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      if(!fs.existsSync(destPath)) {
        copyFile(srcPath, destPath);
      }
    }
  }
}

const restoreApp = path.resolve('restore_dir/pacontrol-f6ece82308071418fbf78952f595a577da5ff342/app');
const targetApp = path.resolve('app');

copyDir(restoreApp, targetApp);
