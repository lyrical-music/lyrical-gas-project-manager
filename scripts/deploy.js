const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../');
const appsDir = path.join(rootDir, 'apps');

// コマンドライン引数からプロジェクト名と環境名を取得
const projectName = process.argv[2];
const environment = process.argv[3] || 'dev';

if (!projectName || !environment) {
  throw new Error('Usage: node scripts/deploy.js <project-name> <environment>');
}

const projectPath = path.join(appsDir, projectName);
if (!fs.existsSync(projectPath)) {
  throw new Error(`Project "${projectName}" does not exist in /apps.`);
}

const claspConfigFile = path.join(projectPath, `.clasp-${environment}.json`);
const targetClaspFile = path.join(projectPath, `.clasp.json`);

if (!fs.existsSync(claspConfigFile)) {
  throw new Error(`Environment file "${claspConfigFile}" does not exist.`);
}

try {
  console.log(`Running tests for project: ${projectName}`);
  execSync('npm run test', { stdio: 'inherit' });

  console.log(`Building project: ${projectName}`);
  execSync(`node scripts/build.js ${projectName}`, { stdio: 'inherit' });

  console.log(`Copying ${claspConfigFile} to ${targetClaspFile}...`);
  fs.copyFileSync(claspConfigFile, targetClaspFile);

  console.log(
    `Deploying project "${projectName}" to environment "${environment}" with clasp...`
  );
  execSync('clasp push -f', { stdio: 'inherit', cwd: projectPath });

  console.log('Deployment completed successfully!');
} catch (error) {
  throw new Error(`Deployment failed for project "${projectName}".`);
}
