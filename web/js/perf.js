// Lightweight Core Web Vitals logging without external deps
(function(){
  function log(name, value){ try { console.log('[web-vitals]', name, Math.round(value*100)/100); } catch(e){} }

  // TTFB
  try {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && typeof nav.responseStart === 'number') log('TTFB', nav.responseStart);
  } catch(e){}

  // FCP
  try {
    if ('PerformanceObserver' in window) {
      var poPaint = new PerformanceObserver(function(list){
        list.getEntries().forEach(function(e){ if (e.name === 'first-contentful-paint') log('FCP', e.startTime); });
      });
      poPaint.observe({ type: 'paint', buffered: true });
    }
  } catch(e){}

  // LCP
  try {
    if ('PerformanceObserver' in window) {
      var lcpVal = 0;
      var poLcp = new PerformanceObserver(function(list){
        var entries = list.getEntries();
        var last = entries[entries.length - 1];
        if (last) lcpVal = last.startTime;
      });
      poLcp.observe({ type: 'largest-contentful-paint', buffered: true });
      window.addEventListener('pagehide', function(){ if (lcpVal) log('LCP', lcpVal); }, { once: true });
    }
  } catch(e){}

  // CLS
  try {
    var cls = 0;
    if ('PerformanceObserver' in window) {
      var poCls = new PerformanceObserver(function(list){
        list.getEntries().forEach(function(e){ if (!e.hadRecentInput) cls += e.value; });
      });
      poCls.observe({ type: 'layout-shift', buffered: true });
      window.addEventListener('pagehide', function(){ log('CLS', cls); }, { once: true });
    }
  } catch(e){}

  // FID
  try {
    if ('PerformanceObserver' in window && PerformanceEventTiming) {
      var poFis = new PerformanceObserver(function(list){
        var e = list.getEntries()[0];
        if (e) log('FID', e.processingStart - e.startTime);
      });
      poFis.observe({ type: 'first-input', buffered: true });
    }
  } catch(e){}
})();

