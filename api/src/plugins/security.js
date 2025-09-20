function securityHeaders(req,res){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  // Legacy header disabled by default; enable only if explicitly requested
  if (String(process.env.LEGACY_X_XSS_PROTECTION||'') === '1') {
    res.setHeader('X-XSS-Protection','1; mode=block');
  }
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  // Apply a conservative CSP for API/JSON endpoints; static site CSP is handled by vercel.json
  try {
    const accept = String(req.headers['accept']||'');
    const url = String(req.url||'');
    const apiLike = /\/(api|v1|metrics|health)/.test(url) || accept.includes('application/json');
    if (apiLike) {
      res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    }
  } catch(_) {}
  const isProd=(process.env.NODE_ENV==='production'); const xf=(req.headers['x-forwarded-proto']||'').toLowerCase();
  if(isProd && xf==='https'){ res.setHeader('Strict-Transport-Security','max-age=63072000; includeSubDomains; preload'); }
}
module.exports={securityHeaders};
