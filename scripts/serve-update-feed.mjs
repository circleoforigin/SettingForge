import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';

const feedRoot = path.resolve(process.argv[2] || 'release/update-feed');
const port = Number(process.env.SETTINGFORGE_UPDATE_PORT || 8099);
const mimeTypes = new Map([
  ['.blockmap', 'application/octet-stream'],
  ['.exe', 'application/vnd.microsoft.portable-executable'],
  ['.yml', 'text/yaml; charset=utf-8'],
]);

function isWithinRoot(candidate) {
  const relative = path.relative(feedRoot, candidate);
  return relative === '' || (
    !relative.startsWith(`..${path.sep}`) &&
    relative !== '..' &&
    !path.isAbsolute(relative)
  );
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const decodedPath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const candidate = path.resolve(feedRoot, decodedPath);

    if (!decodedPath || !isWithinRoot(candidate)) {
      response.writeHead(404).end('Not found.');
      return;
    }

    const file = await stat(candidate);
    if (!file.isFile()) throw new Error('Not a file.');

    const contentType = mimeTypes.get(path.extname(candidate)) ||
      'application/octet-stream';
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Length': file.size,
      'Content-Type': contentType,
    });
    createReadStream(candidate).pipe(response);
  } catch {
    response.writeHead(404).end('Not found.');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${feedRoot} at http://127.0.0.1:${port}/`);
});
