const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const appsDir = path.resolve(__dirname, '../apps');

// コマンドライン引数からプロジェクト名を取得
const targetApp = process.argv[2];

if (!targetApp) {
  throw new Error('Usage: node scripts/build.js <project-name>');
}

const projectPath = path.join(appsDir, targetApp);
const rollupConfig = path.join(projectPath, 'rollup.config.mjs');
const appScriptJson = path.join(projectPath, 'appsscript.json');
const distDir = path.join(projectPath, 'dist');

if (!fs.existsSync(projectPath)) {
  throw new Error(`Project "${targetApp}" does not exist in /apps`);
}

if (!fs.existsSync(rollupConfig)) {
  throw new Error(`Rollup config not found for project "${targetApp}".`);
}

try {
  console.log(`Cleaning dist directory for project: ${targetApp}`);
  execSync(`rimraf ${distDir}`, { stdio: 'inherit' });

  console.log(`Bundling project: ${targetApp}`);
  execSync(`node scripts/bundle.js ${targetApp}`, { stdio: 'inherit' });

  if (fs.existsSync(appScriptJson)) {
    console.log(
      `Copying appsscript.json to dist directory for project: ${targetApp}`
    );
    fs.copyFileSync(appScriptJson, path.join(distDir, 'appsscript.json'));
  }

  console.log(`Build completed for project: ${targetApp}`);
} catch (error) {
  throw new Error(`Build failed for project: ${targetApp}`);
}
