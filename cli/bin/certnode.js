#!/usr/bin/env node
//---------------------------------------------------------------------
// cli/bin/certnode.js
// CertNode CLI entry point

const { program } = require('commander');
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

program
  .name('certnode')
  .description('CertNode CLI - Receipt verification and project scaffolding')
  .version('1.0.0');

// Verify command
program
  .command('verify')
  .description('Verify a CertNode receipt')
  .requiredOption('-r, --receipt <file>', 'Receipt file (JSON)')
  .requiredOption('-k, --jwks <file|url>', 'JWKS file or URL')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      // Load receipt
      const receiptData = JSON.parse(fs.readFileSync(options.receipt, 'utf8'));

      // Load or fetch JWKS
      let jwks;
      if (options.jwks.startsWith('http')) {
        const jwksManager = new JWKSManager();
        jwks = await jwksManager.fetchFromUrl(options.jwks);
        if (options.verbose) console.log(`Fetched JWKS from: ${options.jwks}`);
      } else {
        jwks = JSON.parse(fs.readFileSync(options.jwks, 'utf8'));
        if (options.verbose) console.log(`Loaded JWKS from: ${options.jwks}`);
      }

      // Verify receipt
      const result = await verifyReceipt({ receipt: receiptData, jwks });

      if (result.ok) {
        console.log('✅ Receipt verification: VALID');
        if (options.verbose) {
          console.log(`Kid: ${receiptData.kid}`);
          if (receiptData.receipt_id) console.log(`Receipt ID: ${receiptData.receipt_id}`);
        }
        process.exit(0);
      } else {
        console.log(`❌ Receipt verification: INVALID`);
        console.log(`Reason: ${result.reason}`);
        process.exit(1);
      }

    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize a new CertNode project')
  .argument('[name]', 'Project name', 'my-certnode-app')
  .option('-t, --template <type>', 'Template type (node|web|express)', 'node')
  .option('--skip-install', 'Skip npm install')
  .action(async (name, options) => {
    try {
      const projectPath = path.resolve(name);

      if (fs.existsSync(projectPath)) {
        console.error(`Directory ${name} already exists`);
        process.exit(1);
      }

      fs.mkdirSync(projectPath, { recursive: true });

      // Copy template files
      const templateDir = path.join(__dirname, '..', 'templates', options.template);
      copyTemplate(templateDir, projectPath, { projectName: name });

      console.log(`✅ Created ${name} with ${options.template} template`);
      console.log(`\nNext steps:`);
      console.log(`  cd ${name}`);
      if (!options.skipInstall) {
        console.log(`  npm install`);
      }
      console.log(`  npm start`);

    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate')
  .alias('gen')
  .description('Generate example files')
  .argument('<type>', 'Type to generate (jwks|receipt|keys)')
  .option('-o, --output <file>', 'Output file')
  .option('-a, --algorithm <alg>', 'Algorithm (ES256|EdDSA)', 'ES256')
  .action(async (type, options) => {
    try {
      switch (type) {
        case 'jwks':
          await generateJWKS(options);
          break;
        case 'receipt':
          await generateReceipt(options);
          break;
        case 'keys':
          await generateKeyPair(options);
          break;
        default:
          console.error(`Unknown type: ${type}`);
          process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Inspect command
program
  .command('inspect')
  .description('Inspect a receipt or JWKS file')
  .argument('<file>', 'File to inspect')
  .option('-f, --format <type>', 'Output format (json|table)', 'table')
  .action(async (file, options) => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));

      if (data.keys) {
        // JWKS file
        console.log(`JWKS file with ${data.keys.length} key(s):`);
        data.keys.forEach((key, i) => {
          console.log(`  Key ${i + 1}: ${key.kty} ${key.crv} (kid: ${key.kid || 'none'})`);
        });
      } else if (data.protected && data.signature) {
        // Receipt file
        const header = JSON.parse(Buffer.from(data.protected, 'base64url').toString());
        console.log(`Receipt (${header.alg}):`);
        console.log(`  Kid: ${data.kid}`);
        console.log(`  Algorithm: ${header.alg}`);
        if (data.payload_jcs_sha256) console.log(`  JCS Hash: ${data.payload_jcs_sha256.slice(0, 16)}...`);
        if (data.receipt_id) console.log(`  Receipt ID: ${data.receipt_id.slice(0, 16)}...`);
        console.log(`  Payload: ${JSON.stringify(data.payload)}`);
      } else {
        console.log('Unknown file format');
      }

    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Helper functions
function copyTemplate(templateDir, targetDir, vars) {
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template not found: ${templateDir}`);
  }

  const files = fs.readdirSync(templateDir);
  for (const file of files) {
    const srcPath = path.join(templateDir, file);
    const destPath = path.join(targetDir, file);

    if (fs.statSync(srcPath).isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyTemplate(srcPath, destPath, vars);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');

      // Replace template variables
      Object.entries(vars).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      fs.writeFileSync(destPath, content);
    }
  }
}

async function generateJWKS(options) {
  const algorithm = options.algorithm;
  let jwk;

  if (algorithm === 'ES256') {
    const { publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'jwk' }
    });
    jwk = { ...publicKey, kid: 'example-key', alg: 'ES256' };
  } else if (algorithm === 'EdDSA') {
    const { publicKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'jwk' }
    });
    jwk = { ...publicKey, kid: 'example-key', alg: 'EdDSA' };
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const jwks = { keys: [jwk] };
  const output = options.output || `example-jwks-${algorithm.toLowerCase()}.json`;

  fs.writeFileSync(output, JSON.stringify(jwks, null, 2));
  console.log(`✅ Generated ${algorithm} JWKS: ${output}`);
}

async function generateReceipt(options) {
  console.log('Receipt generation requires private key - use the full CertNode API for signing');
  console.log('This command generates a template receipt structure:');

  const template = {
    protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6ImV4YW1wbGUta2V5In0",
    payload: {
      document_id: "DOC-" + Date.now(),
      content: "Example document content",
      timestamp: new Date().toISOString()
    },
    signature: "EXAMPLE_SIGNATURE_REPLACE_WITH_ACTUAL",
    kid: "example-key",
    payload_jcs_sha256: "EXAMPLE_HASH_REPLACE_WITH_ACTUAL"
  };

  const output = options.output || 'example-receipt.json';
  fs.writeFileSync(output, JSON.stringify(template, null, 2));
  console.log(`✅ Generated receipt template: ${output}`);
}

async function generateKeyPair(options) {
  const algorithm = options.algorithm;
  let keyPair;

  if (algorithm === 'ES256') {
    keyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'jwk' },
      privateKeyEncoding: { type: 'pkcs8', format: 'jwk' }
    });
  } else if (algorithm === 'EdDSA') {
    keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'jwk' },
      privateKeyEncoding: { type: 'pkcs8', format: 'jwk' }
    });
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const kid = 'key-' + Date.now();
  const publicJwk = { ...keyPair.publicKey, kid, alg: algorithm };
  const privateJwk = { ...keyPair.privateKey, kid, alg: algorithm };

  const publicFile = options.output ? `${options.output}.pub.json` : `${algorithm.toLowerCase()}-public.json`;
  const privateFile = options.output ? `${options.output}.key.json` : `${algorithm.toLowerCase()}-private.json`;

  fs.writeFileSync(publicFile, JSON.stringify(publicJwk, null, 2));
  fs.writeFileSync(privateFile, JSON.stringify(privateJwk, null, 2));

  console.log(`✅ Generated ${algorithm} key pair:`);
  console.log(`  Public: ${publicFile}`);
  console.log(`  Private: ${privateFile}`);
}

program.parse();
//---------------------------------------------------------------------