const https = require('https');
https.get({
  hostname: 'api.github.com',
  path: '/repos/PEDROCAVALCANTE/pacontrol/commits',
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const commits = JSON.parse(data);
    if(Array.isArray(commits)) {
      commits.slice(0, 10).forEach(c => console.log(c.sha, c.commit.message.split('\n')[0]));
    } else {
      console.log(commits);
    }
  });
});
