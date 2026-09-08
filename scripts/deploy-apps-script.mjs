import fs from 'node:fs/promises';

const required = [
  'GAS_SCRIPT_ID',
  'GAS_DEPLOYMENT_ID',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_REFRESH_TOKEN'
];
for (const k of required) {
  if (!process.env[k]) throw new Error(`Missing required environment variable: ${k}`);
}

const scriptId = process.env.GAS_SCRIPT_ID;
const deploymentId = process.env.GAS_DEPLOYMENT_ID;
const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
const sourcePath = process.env.GAS_SOURCE_PATH || 'apps-script/zzzzzzzz_CloneSellLikeWeb.gs';
const targetName = process.env.GAS_TARGET_NAME || 'zzzzzzzz_CloneSellLikeWeb';
const manifestFileName = process.env.GAS_MANIFEST_FILE || 'appsscript';

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${url} -> ${res.status}: ${text.slice(0, 1200)}`);
  return data;
}

const tokenBody = new URLSearchParams({
  client_id: clientId,
  client_secret: clientSecret,
  refresh_token: refreshToken,
  grant_type: 'refresh_token'
});
const tokenData = await jsonFetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: {'content-type': 'application/x-www-form-urlencoded'},
  body: tokenBody
});
const accessToken = tokenData.access_token;
if (!accessToken) throw new Error('Google OAuth did not return an access token.');
const authHeaders = {
  authorization: `Bearer ${accessToken}`,
  'content-type': 'application/json'
};

// Safety rule: read the WHOLE current Apps Script project first and replace only one file.
// This preserves every other .gs/.html file exactly as-is.
const current = await jsonFetch(`https://script.googleapis.com/v1/projects/${encodeURIComponent(scriptId)}/content`, {
  headers: {authorization: `Bearer ${accessToken}`}
});
if (!Array.isArray(current?.files)) throw new Error('Apps Script project content is missing files[].');

const source = await fs.readFile(sourcePath, 'utf8');
const files = current.files.map(f => ({...f}));
const index = files.findIndex(f => f.name === targetName);
if (index < 0) throw new Error(`Target Apps Script file not found: ${targetName}. Refusing to create it automatically.`);
if (files[index].type !== 'SERVER_JS') throw new Error(`Target ${targetName} is not SERVER_JS. Refusing deployment.`);
files[index].source = source;

await jsonFetch(`https://script.googleapis.com/v1/projects/${encodeURIComponent(scriptId)}/content`, {
  method: 'PUT',
  headers: authHeaders,
  body: JSON.stringify({files})
});

const description = `GitHub ${process.env.GITHUB_SHA || 'manual'} - Sell Like Clone`;
const version = await jsonFetch(`https://script.googleapis.com/v1/projects/${encodeURIComponent(scriptId)}/versions`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({description})
});
if (!version?.versionNumber) throw new Error('Apps Script version creation did not return versionNumber.');

await jsonFetch(`https://script.googleapis.com/v1/projects/${encodeURIComponent(scriptId)}/deployments/${encodeURIComponent(deploymentId)}`, {
  method: 'PUT',
  headers: authHeaders,
  body: JSON.stringify({
    deploymentConfig: {
      versionNumber: version.versionNumber,
      manifestFileName,
      description
    }
  })
});

console.log(`Deployed ${targetName} to Apps Script version ${version.versionNumber}; deployment ${deploymentId}.`);
