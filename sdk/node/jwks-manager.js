// sdk/node/jwks-manager.js
// Minimal JWKS cache/refresh helper (no deps). Optional utility.

const https = require('https');

function b64u(buf) { return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''); }
function canonicalJson(value){ if(value===null||typeof value==='number'||typeof value==='boolean')return JSON.stringify(value); if(typeof value==='string')return JSON.stringify(value); if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']'; if(value&&typeof value==='object'){const keys=Object.keys(value).sort(); return '{'+keys.map(k=>JSON.stringify(k)+':'+canonicalJson(value[k])).join(',')+'}';} return JSON.stringify(value); }
function sha256(buf){ const crypto=require('crypto'); return crypto.createHash('sha256').update(buf).digest(); }
function jwkThumbprint(jwk){ const json=canonicalJson({crv:jwk.crv,kty:jwk.kty,x:jwk.x,y:jwk.y}); return b64u(sha256(Buffer.from(json,'utf8'))); }

class JWKSManager {
  constructor({ ttlMs = 5*60*1000, fetcher } = {}) {
    this.ttlMs = ttlMs;
    this.fetcher = fetcher; // optional custom fetcher(url, headers) -> { status, headers, body }
    this.cache = null;      // { jwks, fetchedAt, etag, lastModified }
  }

  getFresh() {
    if (!this.cache) return null;
    const age = Date.now() - this.cache.fetchedAt;
    return age <= this.ttlMs ? this.cache.jwks : null;
  }

  setFromObject(jwks) {
    this.cache = { jwks, fetchedAt: Date.now(), etag: null, lastModified: null };
    return jwks;
  }

  // Compute thumbprints for all keys
  thumbprints(jwks = null) {
    const obj = jwks || (this.cache && this.cache.jwks);
    if (!obj || !Array.isArray(obj.keys)) return [];
    const tps = [];
    for (const k of obj.keys) {
      if (!k || k.kty !== 'EC' || k.crv !== 'P-256' || !k.x || !k.y) continue;
      try { tps.push(jwkThumbprint(k)); } catch {}
    }
    return tps;
  }

  async fetchFromUrl(url) {
    const headers = {};
    if (this.cache && this.cache.etag) headers['If-None-Match'] = this.cache.etag;
    if (this.cache && this.cache.lastModified) headers['If-Modified-Since'] = this.cache.lastModified;

    const doFetch = this.fetcher || ((u, h) => new Promise((resolve, reject) => {
      const req = https.request(u, { method: 'GET', headers: h }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
      });
      req.on('error', reject); req.end();
    }));

    const res = await doFetch(url, headers);
    if (res.status === 304 && this.cache) {
      // Not modified; extend validity
      this.cache.fetchedAt = Date.now();
      return this.cache.jwks;
    }
    if (res.status !== 200) throw new Error(`JWKS fetch failed: HTTP ${res.status}`);

    let jwks;
    try { jwks = JSON.parse(res.body); } catch (e) { throw new Error('Invalid JWKS JSON'); }
    this.cache = {
      jwks,
      fetchedAt: Date.now(),
      etag: res.headers['etag'] || null,
      lastModified: res.headers['last-modified'] || null
    };
    return jwks;
  }
}

module.exports = { JWKSManager };

