document.addEventListener(''DOMContentLoaded'', function(){
  const $ = (s) => document.querySelector(s);
  function formatCurrency(amount){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0}).format(amount); }
  function getBaseCostByRevenue(revenue){ const revenueCosts={ 'under-10m':500000,'10m-100m':2000000,'100m-1b':10000000,'over-1b':50000000 }; return revenueCosts[revenue]||1000000; }
  function trackCalculation(data){ fetch('/api/track-lead',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'compliance-calculation', ...data, timestamp:new Date().toISOString(), page:'compliance-calculator' }) }).catch(()=>{}); }

  async function calculateRisk(){
    const industry=$('#industry').value; const companySize=$('#company-size').value; const revenue=$('#annual-revenue').value; const dataVolume=parseInt($('#data-volume').value)||0; const currentCost=parseInt($('#current-audit-cost').value)||0; const complianceStaff=parseFloat($('#compliance-staff').value)||0;
    const regs=[]; ['sox','hipaa','gdpr','pci','iso','other-reg'].forEach(id=>{ const el=$('#'+id); if(el && el.checked) regs.push(id); });
    if(!industry||!companySize||!revenue||regs.length===0){
      if (typeof showToast === 'function') {
        showToast('Please fill in all required fields', 'error');
      } else {
        alert('Please fill in all required fields');
      }
      return;
    }
    let baseCost=getBaseCostByRevenue(revenue);
    const industryMultipliers={financial:2.5, healthcare:2.2, technology:1.8, manufacturing:1.5, retail:1.4, government:3.0, other:1.0};
    const sizeMultipliers={startup:0.3, small:0.6, medium:1.0, large:1.8};
    const regMultipliers={ sox:25000000, hipaa:15000000, gdpr:20000000, pci:5000000, iso:2000000, 'other-reg':3000000 };
    let regulationPenalties=0; regs.forEach(r=> regulationPenalties += regMultipliers[r]||0);
    const totalFailureCost=(baseCost + regulationPenalties) * (industryMultipliers[industry]||1) * (sizeMultipliers[companySize]||1);
    const staffCost = complianceStaff * 150000; const totalCurrentSpend = currentCost + staffCost;
    const protectedValue = totalFailureCost * 0.95; const certNodeCost = 25000; const roiRatio = Math.round(protectedValue / certNodeCost);
    $('#failure-cost').textContent = formatCurrency(totalFailureCost);
    $('#current-spend').textContent = formatCurrency(totalCurrentSpend);
    $('#protected-value').textContent = formatCurrency(protectedValue);
    $('#roi-ratio').textContent = `${roiRatio}:1`;
    $('#results').style.display='block'; document.getElementById('results').scrollIntoView({behavior:'smooth'});
    trackCalculation({industry,companySize,revenue,regulations:regs,failureCost:totalFailureCost,currentSpend:totalCurrentSpend,roiRatio});
  }

  function requestEnterpriseDemo(){ window.location.href='/#enterprise-contact'; }

  const calcBtn = document.getElementById('calculate-risk'); if(calcBtn) calcBtn.addEventListener('click', calculateRisk);
  const reqBtn = document.getElementById('request-enterprise-demo'); if(reqBtn) reqBtn.addEventListener('click', (e)=>{ e.preventDefault(); requestEnterpriseDemo(); });
});
