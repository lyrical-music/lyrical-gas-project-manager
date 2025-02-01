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

if (!fs.existsSync(projectPath)) {
  throw new Error(`Project "${targetApp}" does not exist in /apps`);
}

if (!fs.existsSync(rollupConfig)) {
  throw new Error(`Rollup config not found for project "${targetApp}".`);
}

try {
  console.log(`Building project: ${targetApp}`);
  execSync(`rollup --no-treeshake -c ${rollupConfig}`, {
    stdio: 'inherit',
    cwd: projectPath,
  });
  console.log(`Build completed for project: ${targetApp}`);
} catch (error) {
  throw new Error(`Build failed for project: ${targetApp}`);
}
