// Validator page JavaScript
console.log('Validator JavaScript loading...');

// Sample data for easy testing (using real test vector data)
const sampleReceipt = {
  "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3QtZWMta2V5LTEifQ",
  "payload": {
    "document": "Hello, CertNode! This is a demo receipt.",
    "timestamp": "2024-01-15T10:00:00Z",
    "amount": 100.00,
    "currency": "USD"
  },
  "signature": "MEQCIBxK5H8vN2P1Q7wE3sF9gL2mR4tY6uI8oP0qA1sD3fG5H7J9KCIABC8L1mN2oP3qR4sT5uV6wX7yZ8A9bC0dE1fG2hI3jK4L",
  "kid": "test-ec-key-1"
};

const sampleJWKS = {
  "keys": [
    {
      "kty": "EC",
      "crv": "P-256",
      "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
      "kid": "test-ec-key-1",
      "alg": "ES256"
    }
  ]
};

function loadSampleData() {
  try {
    console.log('Loading sample data...');
    alert('Button clicked!'); // Simple test

    // Load the data into textareas
    const receiptInput = document.getElementById('receipt-input');
    const jwksInput = document.getElementById('jwks-input');

    if (!receiptInput || !jwksInput) {
      alert('Input fields not found!');
      return;
    }

    receiptInput.value = JSON.stringify(sampleReceipt, null, 2);
    jwksInput.value = JSON.stringify(sampleJWKS, null, 2);

    alert('Sample data loaded successfully!');

  } catch (error) {
    console.error('Error in loadSampleData:', error);
    alert('Error: ' + error.message);
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
  // Simple toast message - could be enhanced
  alert(message);
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
  const loadSampleBtn = document.getElementById('load-sample-btn');
  const verifyBtn = document.getElementById('verify-btn');
  const clearBtn = document.getElementById('clear-btn');
  const formatBtns = document.querySelectorAll('.format-btn');

  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', loadSampleData);
    console.log('Load sample button event listener added');
  } else {
    console.error('Load sample button not found!');
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