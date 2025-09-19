// Trust Center data loader with explicit error UI and summary table
function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }

function renderJwksSummary(jwks){
  var tbody = document.getElementById('jwks-table');
  if (!tbody || !jwks || !Array.isArray(jwks.keys)) return;
  tbody.innerHTML = '';
  jwks.keys.forEach(function(k){
    var tr = document.createElement('tr');
    tr.innerHTML = '<td style="padding:6px; border-bottom:1px solid var(--border);">'+(k.kid||'')+'</td>'+
                   '<td style="padding:6px; border-bottom:1px solid var(--border);">'+(k.crv||'')+'</td>'+
                   '<td style="padding:6px; border-bottom:1px solid var(--border);">'+(k.alg||'')+'</td>'+
                   '<td style="padding:6px; border-bottom:1px solid var(--border);">'+(k.use||'')+'</td>';
    tbody.appendChild(tr);
  });
}

function renderRotationMeta(text){
  try{
    var lines = text.split(/\r?\n/).filter(Boolean);
    var last = null;
    lines.forEach(function(line){
      try { var obj = JSON.parse(line); if (!last || new Date(obj.ts) > new Date(last.ts)) last = obj; } catch(e){}
    });
    if (last) {
      setText('rotation-meta', 'Last rotation event: '+ last.ts + ' ('+ (last.event||'event') +') for kid '+ (last.kid||'') );
    }
  } catch(e){}
}

async function loadTrust(){
  try{
    var r = await fetch('/.well-known/jwks.json', { cache:'reload' });
    if(!r.ok) throw new Error('JWKS HTTP '+r.status);
    var ct = r.headers.get('content-type')||'';
    var jwks = await r.json();
    setText('jwks-pre', JSON.stringify(jwks, null, 2) + '\n\nContent-Type: '+ct);
    renderJwksSummary(jwks);
  }catch(e){ setText('jwks-pre', 'ERROR: '+ (e && e.message || 'failed')); }

  try{
    var r2 = await fetch('/trust/keys.jsonl', { cache:'no-store' });
    if(!r2.ok) throw new Error('LOG HTTP '+r2.status);
    var ct2 = r2.headers.get('content-type')||'';
    var txt = (await r2.text()).trim();
    setText('log-pre', (txt || '(empty)') + '\n\nContent-Type: '+ct2);
    if (txt) renderRotationMeta(txt);
  }catch(e){ setText('log-pre', 'ERROR: '+ (e && e.message || 'failed')); }
}

document.addEventListener('DOMContentLoaded', loadTrust);

