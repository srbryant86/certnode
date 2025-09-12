function securityHeaders(req,res){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  const isProd=(process.env.NODE_ENV==='production'); const xf=(req.headers['x-forwarded-proto']||'').toLowerCase();
  if(isProd && xf==='https'){ res.setHeader('Strict-Transport-Security','max-age=63072000; includeSubDomains; preload'); }
}
module.exports={securityHeaders};