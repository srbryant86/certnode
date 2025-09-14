import { createHash } from 'node:crypto';
import https from 'node:https';

const url = process.argv[2];
if (!url) { console.error('Usage: node tools/generate-sri.js <url>'); process.exit(1); }

https.get(url, (res) => {
  if (res.statusCode !== 200) { console.error('HTTP', res.statusCode); process.exit(1); }
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    const sri = 'sha384-' + createHash('sha384').update(buf).digest('base64');
    const snippet =
`<script type="module"
        src="${url}"
        integrity="${sri}"
        crossorigin="anonymous"></script>`;
    console.log(snippet);
  });
}).on('error', (e) => { console.error(e); process.exit(1); });
