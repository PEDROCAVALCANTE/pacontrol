const https = require('https');
const fs = require('fs');
const extract = require('extract-zip');
const path = require('path');

const url = 'https://github.com/PEDROCAVALCANTE/pacontrol/archive/f6ece82308071418fbf78952f595a577da5ff342.zip';
const file = fs.createWriteStream('repo_restore.zip');

async function doExtract() {
  console.log('Downloaded');
  await extract(path.resolve('repo_restore.zip'), { dir: path.resolve('restore_dir') });
  console.log('Extracted');
}

https.get(url, (response) => {
  if (response.statusCode === 301 || response.statusCode === 302) {
    https.get(response.headers.location, (res) => {
        res.pipe(file);
        file.on('finish', () => { file.close(); doExtract(); });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => { file.close(); doExtract(); });
  }
});
