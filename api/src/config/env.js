const MAX_MB=1;
function toInt(v,d){const n=Number(v);return Number.isFinite(n)?Math.floor(n):d}
function csv(v){return String(v||'').split(',').map(s=>s.trim()).filter(Boolean)}
function validate(){
  const NODE_ENV=process.env.NODE_ENV||'development';
  const PORT=toInt(process.env.PORT,3000);
  const MAX_BODY_BYTES=toInt(process.env.MAX_BODY_BYTES, MAX_MB*1024*1024);
  const RATE_LIMIT_RPM=toInt(process.env.RATE_LIMIT_RPM,120);
  const API_ALLOWED_ORIGINS=csv(process.env.API_ALLOWED_ORIGINS||'');
  if(PORT<=0||PORT>65535) throw new Error('env_invalid:PORT');
  if(MAX_BODY_BYTES<1024||MAX_BODY_BYTES>10*1024*1024) throw new Error('env_invalid:MAX_BODY_BYTES');
  if(RATE_LIMIT_RPM<=0||RATE_LIMIT_RPM>10000) throw new Error('env_invalid:RATE_LIMIT_RPM');
  return {NODE_ENV,PORT,MAX_BODY_BYTES,RATE_LIMIT_RPM,API_ALLOWED_ORIGINS};
}
const cfg=validate(); module.exports={cfg,validate};