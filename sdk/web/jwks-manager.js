// sdk/web/jwks-manager.js
// Minimal JWKS cache/refresh helper for browsers (ESM compatible in bundlers).

function canonicalJson(value){ if(value===null||typeof value==='number'||typeof value==='boolean')return JSON.stringify(value); if(typeof value==='string')return JSON.stringify(value); if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']'; if(value&&typeof value==='object'){const keys=Object.keys(value).sort(); return '{'+keys.map(k=>JSON.stringify(k)+':'+canonicalJson(value[k])).join(',')+'}';} return JSON.stringify(value); }
async function sha256(bytes){ const hash = await crypto.subtle.digest('SHA-256', bytes); return new Uint8Array(hash); }
function strToBytes(s){ return new TextEncoder().encode(s); }
function b64u(bytes){ const bin=String.fromCharCode(...bytes); return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''); }

function jwkThumbprint(jwk){
  const json = canonicalJson({crv:jwk.crv,kty:jwk.kty,x:jwk.x,y:jwk.y});
  return sha256(strToBytes(json)).then(buf => b64u(buf));
}

export class JWKSManager {
  constructor({ ttlMs = 5 * 60 * 1000 } = {}) {
    this.ttlMs = ttlMs;
    this.cache = null; // { jwks, fetchedAt, etag, lastModified }
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

  async fetchFromUrl(url) {
    const headers = {};
    if (this.cache && this.cache.etag) headers['If-None-Match'] = this.cache.etag;
    if (this.cache && this.cache.lastModified) headers['If-Modified-Since'] = this.cache.lastModified;
    const res = await fetch(url, { headers, credentials: 'omit', cache: 'no-cache' });
    if (res.status === 304 && this.cache) {
      this.cache.fetchedAt = Date.now();
      return this.cache.jwks;
    }
    if (!res.ok) throw new Error(`JWKS fetch failed: HTTP ${res.status}`);
    const jwks = await res.json();
    this.cache = {
      jwks,
      fetchedAt: Date.now(),
      etag: res.headers.get('etag'),
      lastModified: res.headers.get('last-modified')
    };
    return jwks;
  }

  async thumbprints(jwks = null) {
    const obj = jwks || (this.cache && this.cache.jwks);
    if (!obj || !Array.isArray(obj.keys)) return [];
    const arr = [];
    for (const k of obj.keys) {
      if (!k || k.kty !== 'EC' || k.crv !== 'P-256' || !k.x || !k.y) continue;
      try { arr.push(await jwkThumbprint(k)); } catch {}
    }
    return arr;
  }
}

export default { JWKSManager };

