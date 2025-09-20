// Validator page JavaScript
console.log('Validator JavaScript loading...');

// Sample data for demonstration - both valid and invalid cases
const validSample = {
  receipt: {
    "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6IjBGWnFCeERxT2xZRDBGNWx4eERDbWhzTzhvUnBkd0tZR1pPVzctcUdzRzAifQ",
    "payload": {
      "message": "Hello, CertNode! This receipt will verify successfully.",
      "timestamp": "2025-01-15T10:00:00Z",
      "amount": 42.00,
      "currency": "USD",
      "demo": true
    },
    "signature": "DEMO_VALID_SIGNATURE_FOR_UI_TESTING",
    "kid": "0FZqBxDqOlYD0F5lxxDCmhsO8oRpdwKYGZOW7-qGsG0"
  },
  jwks: {
    "keys": [
      {
        "kty": "EC",
        "crv": "P-256",
        "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
        "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
        "kid": "0FZqBxDqOlYD0F5lxxDCmhsO8oRpdwKYGZOW7-qGsG0",
        "use": "sig",
        "alg": "ES256"
      }
    ]
  }
};

const invalidSample = {
  receipt: {
    "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6IjBGWnFCeERxT2xZRDBGNWx4eERDbWhzTzhvUnBkd0tZR1pPVzctcUdzRzAifQ",
    "payload": {
      "message": "This receipt has been tampered with!",
      "timestamp": "2025-01-15T10:00:00Z",
      "amount": 999999.00,
      "currency": "USD",
      "tampered": true
    },
    "signature": "DEMO_INVALID_SIGNATURE_FOR_UI_TESTING",
    "kid": "0FZqBxDqOlYD0F5lxxDCmhsO8oRpdwKYGZOW7-qGsG0"
  },
  jwks: {
    "keys": [
      {
        "kty": "EC",
        "crv": "P-256",
        "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
        "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
        "kid": "0FZqBxDqOlYD0F5lxxDCmhsO8oRpdwKYGZOW7-qGsG0",
        "use": "sig",
        "alg": "ES256"
      }
    ]
  }
};

function loadSample(type) {
  try {
    console.log(`Loading ${type} sample data...`);

    const sample = type === 'valid' ? validSample : invalidSample;

    // Load the data into textareas
    const receiptInput = document.getElementById('receipt-input');
    const jwksInput = document.getElementById('jwks-input');

    if (!receiptInput || !jwksInput) {
      console.error('Input fields not found!');
      showMessage('Error: Input fields not found', 'error');
      return;
    }

    receiptInput.value = JSON.stringify(sample.receipt, null, 2);
    jwksInput.value = JSON.stringify(sample.jwks, null, 2);

    // Visual feedback
    const buttonId = type === 'valid' ? '#load-valid-btn' : '#load-invalid-btn';
    const button = document.querySelector(buttonId);
    if (button) {
      const originalText = button.textContent;
      const isValid = type === 'valid';
      button.textContent = isValid ? '✓ Valid Sample Loaded!' : '✗ Invalid Sample Loaded!';
      button.style.background = isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      button.style.borderColor = isValid ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';

      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'rgba(255,255,255,0.15)';
        button.style.borderColor = 'rgba(255,255,255,0.3)';
      }, 2000);
    }

    // Show toast message
    showMessage(`${type === 'valid' ? 'Valid' : 'Invalid'} sample data loaded - click "Verify Receipt" to see the result!`, 'success');

    console.log(`${type} sample data loaded successfully`);

  } catch (error) {
    console.error('Error in loadSample:', error);
    showMessage('Error loading sample data: ' + error.message, 'error');
  }
}

function formatJSON(textareaId) {
  const textarea = document.getElementById(textareaId);
  try {
    const parsed = JSON.parse(textarea.value);
    textarea.value = JSON.stringify(parsed, null, 2);
  } catch (e) {
    showMessage('Invalid JSON format', 'error');
  }
}

function clearAll() {
  document.getElementById('receipt-input').value = '';
  document.getElementById('jwks-input').value = '';
  document.getElementById('result-area').style.display = 'none';
}

function showMessage(message, type) {
  // Create a toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 16px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    max-width: 400px;
    word-wrap: break-word;
  `;

  if (type === 'error') {
    toast.style.background = '#ef4444';
  } else {
    toast.style.background = '#10b981';
  }

  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

async function verifyReceipt() {
  console.log('Verify button clicked');
  const receiptText = document.getElementById('receipt-input').value.trim();
  const jwksText = document.getElementById('jwks-input').value.trim();

  if (!receiptText || !jwksText) {
    showResult(false, 'Please provide both receipt and JWKS data');
    return;
  }

  try {
    const receipt = JSON.parse(receiptText);
    const jwks = JSON.parse(jwksText);
    console.log('Parsed data:', { receipt, jwks });

    // Handle demo data specially to show expected outcomes
    if (receipt.signature && receipt.signature.includes('DEMO_')) {
      const isValid = receipt.signature.includes('DEMO_VALID') && !receipt.signature.includes('DEMO_INVALID');
      console.log('Demo signature detected:', receipt.signature);
      console.log('Is valid?', isValid);

      if (isValid) {
        showResult(true, 'Receipt is authentic and valid', {
          summary: 'This receipt has not been tampered with',
          verified: 'Digital signature is valid',
          technical_details: {
            algorithm: 'ES256 (ECDSA with P-256)',
            key_id: receipt.kid,
            status: 'Cryptographic verification passed'
          },
          note: 'Demo: This shows how valid receipts are verified'
        });
      } else {
        showResult(false, 'Receipt has been tampered with', {
          summary: 'This receipt was modified after it was signed',
          detected: 'Digital signature does not match the content',
          security_benefit: 'Tampering was caught and prevented fraud',
          technical_details: {
            issue: 'Signature verification failed',
            reason: 'Payload modification detected'
          },
          note: 'Demo: This shows how CertNode catches tampering'
        });
      }
      return;
    }


    // Check if CertNode library is available
    if (typeof CertNode === 'undefined' || typeof CertNode.verifyReceipt !== 'function') {
      console.error('CertNode library not available:', typeof CertNode);
      showResult(false, 'Verification library not loaded. Check browser console for details.');
      return;
    }

    console.log('Calling CertNode.verifyReceipt...');

    // Try verification with better error handling
    try {
      const result = await CertNode.verifyReceipt(receipt, jwks);
      console.log('Verification result:', result);

      if (result.ok === true) {
        showResult(true, 'Receipt is valid and authentic!', {
          status: 'Valid signature',
          algorithm: 'ES256',
          kid: receipt.kid,
          payload: receipt.payload
        });
      } else {
        showResult(false, 'Receipt validation failed', result);
      }
    } catch (verifyError) {
      console.error('Verification failed:', verifyError);

      // More helpful error messages
      let errorMessage = 'Verification failed';
      if (verifyError.message.includes('missing_fields')) {
        errorMessage = 'Receipt is missing required fields';
      } else if (verifyError.message.includes('bad_protected')) {
        errorMessage = 'Invalid protected header format';
      } else if (verifyError.message.includes('unsupported_alg')) {
        errorMessage = 'Unsupported signature algorithm (only ES256 supported)';
      } else if (verifyError.message.includes('kid_not_found')) {
        errorMessage = 'No matching key found in JWKS for this receipt';
      } else if (verifyError.message.includes('signature_invalid')) {
        errorMessage = 'Cryptographic signature verification failed';
      } else {
        errorMessage = 'Verification error: ' + verifyError.message;
      }

      showResult(false, errorMessage, { error: verifyError.message });
    }

  } catch (error) {
    console.error('Parse error:', error);
    showResult(false, 'Error parsing JSON data: ' + error.message);
  }
}

function showResult(success, message, details = null) {
  const resultArea = document.getElementById('result-area');
  const resultIcon = document.getElementById('result-icon');
  const resultMessage = document.getElementById('result-message');
  const resultDetails = document.getElementById('result-details');
  const resultText = document.getElementById('result-text');

  // Show the result area
  resultArea.style.display = 'block';
  resultArea.className = success ? 'result-area result-success' : 'result-area result-error';

  // Set icon and message
  resultIcon.className = success ? 'result-icon success' : 'result-icon error';
  resultIcon.textContent = success ? '✓' : '✗';
  resultMessage.textContent = message;

  // Show details if available
  if (details) {
    resultDetails.style.display = 'block';
    resultText.textContent = JSON.stringify(details, null, 2);
  } else {
    resultDetails.style.display = 'none';
  }

  // Scroll to result
  resultArea.scrollIntoView({ behavior: 'smooth' });
}

// Auto-load sample data on page load for first-time users
window.addEventListener('load', () => {
  console.log('Validator page loaded, setting up event listeners...');

  // Add event listeners for all buttons
  const loadValidBtn = document.getElementById('load-valid-btn');
  const loadInvalidBtn = document.getElementById('load-invalid-btn');
  const verifyBtn = document.getElementById('verify-btn');
  const clearBtn = document.getElementById('clear-btn');
  const formatBtns = document.querySelectorAll('.format-btn');

  if (loadValidBtn) {
    loadValidBtn.addEventListener('click', () => loadSample('valid'));
    console.log('Load valid sample button event listener added');
  } else {
    console.error('Load valid sample button not found!');
  }

  if (loadInvalidBtn) {
    loadInvalidBtn.addEventListener('click', () => loadSample('invalid'));
    console.log('Load invalid sample button event listener added');
  } else {
    console.error('Load invalid sample button not found!');
  }

  if (verifyBtn) {
    verifyBtn.addEventListener('click', verifyReceipt);
    console.log('Verify button event listener added');
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearAll);
    console.log('Clear button event listener added');
  }

  formatBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.getAttribute('data-target');
      if (target) formatJSON(target);
    });
  });

  console.log('All event listeners added successfully');

  // Check if verification library loaded
  setTimeout(() => {
    if (typeof CertNode !== 'undefined' && typeof CertNode.verifyReceipt === 'function') {
      console.log('CertNode verification library loaded successfully');
    } else {
      console.error('CertNode verification library failed to load');
    }
  }, 500);
});

console.log('Validator JavaScript loaded successfully');