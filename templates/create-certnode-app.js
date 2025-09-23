#!/usr/bin/env node

/**
 * Create CertNode App CLI
 * Quick scaffold tool for CertNode integration templates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMPLATES = {
  'react': {
    name: 'React + TypeScript',
    description: 'React application with CertNode hooks and TypeScript',
    path: 'react/basic',
    dependencies: ['react', 'typescript', '@certnode/react'],
    scripts: {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    }
  },
  'vue': {
    name: 'Vue 3 + Composition API',
    description: 'Vue 3 application with Composition API and TypeScript',
    path: 'vue/basic',
    dependencies: ['vue', 'typescript', '@certnode/vue'],
    scripts: {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    }
  },
  'nextjs': {
    name: 'Next.js Full-Stack',
    description: 'Next.js application with API routes and SSR',
    path: 'nextjs/basic',
    dependencies: ['next', 'react', '@certnode/react'],
    scripts: {
      'dev': 'next dev',
      'build': 'next build',
      'start': 'next start'
    }
  },
  'express': {
    name: 'Express.js API',
    description: 'Express.js API with CertNode authentication middleware',
    path: 'express/basic',
    dependencies: ['express', '@certnode/sdk'],
    scripts: {
      'dev': 'nodemon src/app.js',
      'start': 'node src/app.js',
      'test': 'jest'
    }
  },
  'fastify': {
    name: 'Fastify API',
    description: 'High-performance Fastify API with plugins',
    path: 'fastify/basic',
    dependencies: ['fastify', '@certnode/sdk'],
    scripts: {
      'dev': 'nodemon src/app.js',
      'start': 'node src/app.js',
      'test': 'tap'
    }
  },
  'cloudflare-workers': {
    name: 'Cloudflare Workers',
    description: 'Edge computing with Cloudflare Workers',
    path: 'cloudflare-workers/basic',
    dependencies: ['@cloudflare/workers-types', '@certnode/sdk'],
    scripts: {
      'dev': 'wrangler dev',
      'deploy': 'wrangler publish',
      'test': 'jest'
    }
  },
  'vercel': {
    name: 'Vercel Functions',
    description: 'Serverless functions optimized for Vercel',
    path: 'vercel/basic',
    dependencies: ['@vercel/node', '@certnode/sdk'],
    scripts: {
      'dev': 'vercel dev',
      'build': 'vercel build',
      'deploy': 'vercel'
    }
  },
  'aws-lambda': {
    name: 'AWS Lambda',
    description: 'AWS Lambda functions with API Gateway',
    path: 'aws-lambda/basic',
    dependencies: ['aws-lambda', '@certnode/sdk'],
    scripts: {
      'build': 'sam build',
      'deploy': 'sam deploy',
      'local': 'sam local start-api'
    }
  },
  'react-native': {
    name: 'React Native',
    description: 'Cross-platform mobile app',
    path: 'react-native/basic',
    dependencies: ['react-native', '@certnode/react-native'],
    scripts: {
      'start': 'react-native start',
      'ios': 'react-native run-ios',
      'android': 'react-native run-android'
    }
  }
};

class CertNodeCLI {
  constructor() {
    this.args = process.argv.slice(2);
    this.command = this.args[0];
    this.projectName = this.args[1];
    this.template = this.getTemplateFromArgs();
  }

  getTemplateFromArgs() {
    const templateIndex = this.args.findIndex(arg => arg === '--template' || arg === '-t');
    return templateIndex !== -1 ? this.args[templateIndex + 1] : 'react';
  }

  showHelp() {
    console.log(`
🔐 Create CertNode App

Usage:
  npx create-certnode-app <project-name> [options]
  npm init certnode-app <project-name> [options]

Options:
  -t, --template <template>    Template to use (default: react)
  -h, --help                   Show this help message
  -v, --version                Show version number
  --list-templates             List all available templates

Available Templates:
${Object.entries(TEMPLATES).map(([key, template]) =>
  `  ${key.padEnd(20)} ${template.description}`
).join('\n')}

Examples:
  npx create-certnode-app my-app
  npx create-certnode-app my-api --template express
  npx create-certnode-app my-worker --template cloudflare-workers

For more information, visit: https://certnode.io/docs/templates
    `);
  }

  listTemplates() {
    console.log('\n🚀 Available CertNode Templates:\n');

    const categories = {
      'Frontend': ['react', 'vue', 'nextjs'],
      'Backend': ['express', 'fastify'],
      'Cloud/Serverless': ['cloudflare-workers', 'vercel', 'aws-lambda'],
      'Mobile': ['react-native']
    };

    Object.entries(categories).forEach(([category, templates]) => {
      console.log(`\x1b[36m${category}:\x1b[0m`);
      templates.forEach(templateKey => {
        const template = TEMPLATES[templateKey];
        if (template) {
          console.log(`  \x1b[32m${templateKey.padEnd(20)}\x1b[0m ${template.description}`);
        }
      });
      console.log();
    });

    console.log('Usage: npx create-certnode-app my-app --template <template-name>');
  }

  async createProject(options = {}) {
    // Support both CLI usage and programmatic usage
    const projectName = options.name || this.projectName;
    const templateType = options.template || this.template;

    if (!projectName) {
      console.error('\x1b[31mError: Project name is required\x1b[0m');
      if (!options.name) this.showHelp();
      process.exit(1);
    }

    if (!TEMPLATES[templateType]) {
      console.error(`\x1b[31mError: Template "${templateType}" not found\x1b[0m`);
      console.log('\nAvailable templates:');
      Object.keys(TEMPLATES).forEach(key => {
        console.log(`  ${key}`);
      });
      process.exit(1);
    }

    const template = TEMPLATES[templateType];
    const projectPath = options.directory
      ? path.resolve(options.directory)
      : path.resolve(process.cwd(), projectName);

    console.log(`\n🚀 Creating ${template.name} project: ${projectName}\n`);

    // Check if directory already exists
    if (fs.existsSync(projectPath)) {
      console.error(`\x1b[31mError: Directory "${projectName}" already exists\x1b[0m`);
      process.exit(1);
    }

    try {
      // Create project directory
      fs.mkdirSync(projectPath, { recursive: true });

      // Copy template files
      await this.copyTemplate(template.path, projectPath, templateType, projectName);

      // Update package.json with project name
      await this.updatePackageJson(projectPath, projectName, template);

      // Install dependencies
      console.log('📦 Installing dependencies...');
      process.chdir(projectPath);

      try {
        execSync('npm install', { stdio: 'inherit' });
      } catch (error) {
        console.warn('⚠️  npm install failed, you may need to run it manually');
      }

      // Show success message
      this.showSuccess(template, projectName);

    } catch (error) {
      console.error('\x1b[31mError creating project:\x1b[0m', error.message);

      // Cleanup on failure
      if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true });
      }

      process.exit(1);
    }
  }

  async copyTemplate(templatePath, destinationPath, templateType = null, projectName = null) {
    const templateDir = path.join(__dirname, templatePath);

    if (!fs.existsSync(templateDir)) {
      // If template doesn't exist locally, create a basic one
      console.log('📋 Creating basic template structure...');
      await this.createBasicTemplate(destinationPath, templateType || this.template, projectName);
      return;
    }

    console.log('📋 Copying template files...');
    await this.copyDir(templateDir, destinationPath);
  }

  async copyDir(src, dest) {
    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const files = fs.readdirSync(src);
      for (const file of files) {
        if (file === 'node_modules' || file === '.git') continue;

        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        await this.copyDir(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  async createBasicTemplate(projectPath, templateType, projectName = null) {
    const template = TEMPLATES[templateType];
    const name = projectName || this.projectName;

    // Create basic package.json
    const packageJson = {
      name: name,
      version: '1.0.0',
      description: `CertNode ${template.name} application`,
      main: templateType.includes('node') || templateType === 'express' || templateType === 'fastify' ? 'src/index.js' : undefined,
      scripts: template.scripts,
      dependencies: template.dependencies.reduce((acc, dep) => {
        acc[dep] = 'latest';
        return acc;
      }, {}),
      keywords: ['certnode', 'receipt-verification', templateType],
      author: '',
      license: 'MIT'
    };

    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create basic README
    const readme = `# ${name}

A CertNode ${template.name} application.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Documentation

- [CertNode Documentation](https://certnode.io/docs)
- [${template.name} Template Guide](https://certnode.io/docs/templates/${templateType})

## Support

- [GitHub Issues](https://github.com/certnode/certnode/issues)
- [Community Discussions](https://github.com/certnode/certnode/discussions)
`;

    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);

    // Create basic source structure based on template type
    if (templateType === 'express' || templateType === 'fastify') {
      fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(projectPath, 'src', 'index.js'),
        '// CertNode API server\nconsole.log("CertNode server starting...");\n'
      );
    } else if (templateType === 'react' || templateType === 'vue') {
      fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(projectPath, 'src', 'App.tsx'),
        '// CertNode React application\nexport default function App() { return <div>CertNode App</div>; }\n'
      );
    }

    // Create .env.example
    const envExample = `# CertNode Configuration
CERTNODE_API_URL=https://api.certnode.io
CERTNODE_JWKS_URL=https://api.certnode.io/.well-known/jwks.json

# Development
NODE_ENV=development
`;

    fs.writeFileSync(path.join(projectPath, '.env.example'), envExample);
  }

  async updatePackageJson(projectPath, projectName, template) {
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.name = projectName;
      packageJson.description = `${template.description} - ${projectName}`;

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }

  showSuccess(template, projectName = null) {
    const name = projectName || this.projectName;
    console.log(`
\x1b[32m✅ Success!\x1b[0m Created ${name} using ${template.name}

📁 Project directory: ${name}

Next steps:
  1. \x1b[36mcd ${name}\x1b[0m
  2. \x1b[36mcp .env.example .env\x1b[0m
  3. \x1b[36mnpm run dev\x1b[0m

📚 Documentation:
  • Template Guide: https://certnode.io/docs/templates/${this.template}
  • CertNode Docs: https://certnode.io/docs
  • Examples: https://certnode.io/examples

🆘 Need help?
  • GitHub Issues: https://github.com/certnode/certnode/issues
  • Community: https://github.com/certnode/certnode/discussions

Happy coding! 🚀
    `);
  }

  run() {
    switch (this.command) {
      case '--help':
      case '-h':
      case 'help':
        this.showHelp();
        break;

      case '--version':
      case '-v':
        console.log('create-certnode-app version 1.0.0');
        break;

      case '--list-templates':
        this.listTemplates();
        break;

      default:
        if (!this.command || this.command.startsWith('-')) {
          this.showHelp();
        } else {
          this.projectName = this.command;
          this.createProject();
        }
        break;
    }
  }
}

// Run the CLI
if (require.main === module) {
  const cli = new CertNodeCLI();
  cli.run();
}

module.exports = CertNodeCLI;