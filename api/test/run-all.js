//---------------------------------------------------------------------
// api/test/run-all.js — enhanced with hang detection and progress indicators
const { exec, execFile } = require('child_process');

const tests = [
  'api/test/manifest.test.js',
  'api/test/health.test.js',
  'api/test/errorHandler.test.js',
  'api/test/openapi.endpoint.test.js',
  'api/test/ratelimit.unit.test.js',
  'api/test/ratelimit.test.js',
  'api/test/validation.test.js',
  'api/test/validation.sign.test.js',
  'api/test/cors.test.js',
  'api/test/cors.integration.test.js',
  'api/test/verify.cli.test.js',
  'api/test/sdk.node.test.js',
  'api/test/verify.sdk.node.test.js',
];

let progressInterval;

function killTestProcesses(cb) {
  // More targeted kill - only processes that have the test file in command line
  exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (err, stdout) => {
    if (err) return cb();
    
    const lines = stdout.split('\n').slice(1); // Skip header
    const testPids = [];
    
    for (const line of lines) {
      const match = line.match(/^"[^"]*","(\d+)"/);
      if (match) {
        const pid = match[1];
        exec(`wmic process where ProcessId=${pid} get CommandLine /format:csv`, (err, cmdOut) => {
          if (!err && cmdOut.includes('test') && cmdOut.includes('.js')) {
            testPids.push(pid);
          }
        });
      }
    }
    
    if (testPids.length > 0) {
      console.log(`🔄 Cleaning up ${testPids.length} test process(es)...`);
      exec(`taskkill /PID ${testPids.join(' /PID ')} /F`, () => cb());
    } else {
      cb();
    }
  });
}

function startProgressIndicator(testName) {
  let dots = 0;
  console.log(`⏳ Running ${testName}...`);
  
  progressInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    process.stdout.write(`\r⏳ Running ${testName}${''.padEnd(dots, '.')}${''.padEnd(3 - dots, ' ')}`);
  }, 500);
}

function stopProgressIndicator() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
    process.stdout.write('\r'); // Clear the line
  }
}

function runOne(i) {
  if (i >= tests.length) {
    return killTestProcesses(() => { 
      console.log('\n🎉 All tests completed successfully!'); 
      process.exit(0); 
    });
  }
  
  const file = tests[i];
  const testName = file.replace('api/test/', '').replace('.js', '');
  
  console.log(`\n[${i + 1}/${tests.length}] === ${testName.toUpperCase()} ===`);
  
  killTestProcesses(() => {
    startProgressIndicator(testName);
    
    const startTime = Date.now();
    const cp = execFile(process.execPath, [file], { stdio: ['inherit', 'pipe', 'pipe'] });
    
    let output = '';
    let errorOutput = '';
    
    cp.stdout.on('data', (data) => {
      output += data;
      process.stdout.write(data);
    });
    
    cp.stderr.on('data', (data) => {
      errorOutput += data;
      process.stderr.write(data);
    });
    
    // Reduced timeout to 60s and added warning at 45s
    const warningTimer = setTimeout(() => {
      console.log(`\n⚠️  Test ${testName} is taking longer than expected (45s)...`);
      console.log(`💡 If this hangs, the process will be killed in 15s`);
    }, 45000);
    
    const killTimer = setTimeout(() => {
      stopProgressIndicator();
      console.log(`\n💀 Test ${testName} HUNG after 60s - FORCE KILLING`);
      console.log(`📊 Last output: ${output.slice(-200)}`);
      console.log(`🚨 Error output: ${errorOutput.slice(-200)}`);
      
      cp.kill('SIGKILL');
      
      // Give it 2 seconds to die, then exit with error
      setTimeout(() => {
        console.log(`❌ HUNG TEST DETECTED: ${file}`);
        console.log(`🔍 Check for: async operations without await, infinite loops, or network timeouts`);
        process.exit(1);
      }, 2000);
    }, 60000);
    
    cp.on('close', (code) => {
      clearTimeout(warningTimer);
      clearTimeout(killTimer);
      stopProgressIndicator();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (code !== 0) {
        console.log(`❌ Test ${testName} failed with code ${code} (${duration}s)`);
        if (errorOutput) {
          console.log(`🔍 Error details:\n${errorOutput}`);
        }
        process.exit(code);
      }
      
      console.log(`✅ Test ${testName} passed (${duration}s)`);
      runOne(i + 1);
    });
    
    cp.on('error', (error) => {
      clearTimeout(warningTimer);
      clearTimeout(killTimer);
      stopProgressIndicator();
      console.log(`💥 Test ${testName} crashed: ${error.message}`);
      process.exit(1);
    });
  });
}

console.log('🚀 Starting test suite with enhanced monitoring...');
console.log('⚡ Features: 60s timeout, progress indicators, targeted cleanup');
runOne(0);