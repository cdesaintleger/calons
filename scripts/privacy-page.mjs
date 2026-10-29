import {readFile,writeFile} from 'node:fs/promises';
const article=await readFile('src/privacy-policy.html','utf8');
await writeFile('public/privacy.html',`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Confidentialité — Calons</title><style>body{font:17px/1.6 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px}h1{line-height:1.2}h2{font-size:1.25em;margin-top:1.6em}a{color:inherit}</style><main>${article}</main></html>\n`);
