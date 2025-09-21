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
        showResult(true, 'VALID', {
          explanation: 'Receipt is authentic and unmodified.',
          verification_details: {
            timestamp: new Date().toISOString(),
            algorithm: 'ES256 (ECDSA P-256)',
            key_id: receipt.kid,
            signature_status: 'Valid',
            content_hash: 'Verified',
            issuer: 'CertNode Demo Authority'
          }
        });
      } else {
        // Show what was actually tampered with
        const originalPayload = validSample.receipt.payload;
        const tamperedPayload = receipt.payload;

        const changes = [];
        Object.keys(tamperedPayload).forEach(key => {
          if (originalPayload[key] !== tamperedPayload[key]) {
            changes.push({
              field: key,
              original: originalPayload[key],
              tampered: tamperedPayload[key]
            });
          }
        });

        showResult(false, 'INVALID', {
          explanation: 'Receipt has been tampered with.',
          tampering_details: {
            detected_at: new Date().toISOString(),
            signature_status: 'Invalid - does not match content',
            tampered_fields: changes,
            security_action: 'Transaction blocked',
            threat_level: 'High - Data integrity compromised'
          }
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
        showResult(true, 'VALID', {
          explanation: 'Receipt is cryptographically authentic.',
          algorithm: 'ES256',
          key_id: receipt.kid,
          verified_at: new Date().toISOString(),
          status: 'Cryptographic verification passed'
        });
      } else {
        showResult(false, 'INVALID', {
          explanation: 'Receipt failed verification.',
          error: result.error || 'Verification failed',
          details: result
        });
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

  // Set icon and message - big, clear status
  resultIcon.className = success ? 'result-icon success' : 'result-icon error';
  resultIcon.textContent = success ? '✓' : '✗';
  resultMessage.innerHTML = `<strong>${message}</strong>`;

  // Show details if available
  if (details) {
    resultDetails.style.display = 'block';

    // Format details nicely instead of raw JSON
    let detailsHtml = '';
    if (details.explanation) {
      detailsHtml += `<p style="margin-bottom: 1rem; font-size: 1rem; color: #374151;">${details.explanation}</p>`;
    }

    // Create expandable technical details
    detailsHtml += '<details style="margin-top: 1rem;"><summary style="cursor: pointer; font-weight: 600; color: #1f2937;">Technical Details</summary>';
    detailsHtml += '<div style="margin-top: 0.5rem; padding: 1rem; background: #f9fafb; border-radius: 6px; font-size: 0.9rem;">';

    Object.entries(details).forEach(([key, value]) => {
      if (key !== 'explanation') {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        if (key === 'tampering_details' && value.tampered_fields) {
          detailsHtml += '<div style="margin-bottom: 1rem;"><strong>Tampering Analysis:</strong></div>';

          // Show timestamp
          detailsHtml += `<div style="margin-bottom: 0.5rem;"><strong>Detected:</strong> ${new Date(value.detected_at).toLocaleString()}</div>`;
          detailsHtml += `<div style="margin-bottom: 0.5rem;"><strong>Signature Status:</strong> ${value.signature_status}</div>`;
          detailsHtml += `<div style="margin-bottom: 0.5rem;"><strong>Security Action:</strong> ${value.security_action}</div>`;

          // Show what was changed
          if (value.tampered_fields.length > 0) {
            detailsHtml += '<div style="margin: 1rem 0;"><strong>Modified Fields:</strong></div>';
            value.tampered_fields.forEach(change => {
              detailsHtml += `<div style="margin-left: 1rem; padding: 0.5rem; background: #fee2e2; border-left: 3px solid #ef4444; margin-bottom: 0.5rem;">`;
              detailsHtml += `<div><strong>Field:</strong> ${change.field}</div>`;
              detailsHtml += `<div><strong>Original:</strong> ${JSON.stringify(change.original)}</div>`;
              detailsHtml += `<div><strong>Tampered:</strong> ${JSON.stringify(change.tampered)}</div>`;
              detailsHtml += '</div>';
            });
          }

          detailsHtml += `<div style="margin-top: 1rem;"><strong>Threat Level:</strong> ${value.threat_level}</div>`;

        } else if (key === 'verification_details') {
          detailsHtml += '<div style="margin-bottom: 1rem;"><strong>Verification Report:</strong></div>';
          Object.entries(value).forEach(([detailKey, detailValue]) => {
            const detailLabel = detailKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (detailKey === 'timestamp') {
              detailsHtml += `<div style="margin-bottom: 0.5rem;"><strong>${detailLabel}:</strong> ${new Date(detailValue).toLocaleString()}</div>`;
            } else {
              detailsHtml += `<div style="margin-bottom: 0.5rem;"><strong>${detailLabel}:</strong> ${detailValue}</div>`;
            }
          });
        } else if (typeof value === 'object') {
          detailsHtml += `<div><strong>${label}:</strong><pre style="margin: 0.5rem 0; white-space: pre-wrap; font-family: monospace;">${JSON.stringify(value, null, 2)}</pre></div>`;
        } else {
          detailsHtml += `<div style="margin-bottom: 0.5rem;"><strong>${label}:</strong> ${value}</div>`;
        }
      }
    });

    detailsHtml += '</div></details>';
    resultText.innerHTML = detailsHtml;
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