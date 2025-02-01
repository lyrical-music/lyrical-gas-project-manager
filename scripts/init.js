const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawnSync } = require('child_process');
const rimraf = require('rimraf');

const appsDir = path.resolve(__dirname, '../apps');

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve =>
    rl.question(query, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

function getClaspAccountInfo() {
  try {
    const output = execSync('clasp login --status', {
      stdio: 'pipe',
    }).toString();
    return output;
  } catch (err) {
    throw new Error(
      'clasp is not logged in. Run `clasp login` to authenticate.'
    );
  }
}

async function confirmAccount(accountInfo) {
  console.log('Current clasp account information:');
  console.log(accountInfo);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const confirmation = await askQuestion(
      'Is this the correct account? (Y/n): '
    );
    const normalized = confirmation.trim().toLowerCase();

    if (normalized === '' || normalized === 'y') {
      return true;
    }

    if (normalized === 'n') {
      return false;
    }

    console.log('Invalid input. Please enter "Y" (yes) or "N" (no).');
  }
}

function cleanUpDirectory(directory) {
  if (fs.existsSync(directory)) {
    console.log(`Cleaning up directory: ${directory}`);
    rimraf.sync(directory);
  }
}

function pullProject(scriptId, projectPath) {
  console.log(`Checking for existing Apps Script project with ID: ${scriptId}`);

  const claspConfig = {
    scriptId,
    rootDir: './dist',
  };

  fs.writeFileSync(
    path.join(projectPath, '.clasp.json'),
    JSON.stringify(claspConfig, null, 2)
  );

  const pullResult = spawnSync('npx', ['clasp', 'pull'], {
    cwd: projectPath,
    encoding: 'utf-8',
    stdio: 'inherit',
  });

  if (pullResult.error) {
    throw new Error(
      `Failed to pull existing Apps Script project: ${pullResult.error.message}`
    );
  }

  console.log('Pulled existing Apps Script project successfully.');
}

function createGoogleSheetsProject(title) {
  console.log('Creating a new Google Sheets project...');

  const result = spawnSync(
    'npx',
    [
      'clasp',
      'create',
      '--type',
      'sheets',
      '--rootDir',
      'dist',
      '--title',
      title,
    ],
    { encoding: 'utf-8' }
  );

  if (result.error) {
    throw new Error('Error during clasp create: ' + result.error.message);
  }

  const output = result.stdout || result.stderr;
  console.log('Clasp create output:\n', output);

  const sheetsLink = output.match(/Google Sheet: ([^\n]*)/);
  const scriptLink = output.match(/Google Sheets Add-on script: ([^\n]*)/);
  const sheetId = result.stdout.match(/id=([^\n]*)/)[1];
  const scriptId = result.stdout.match(
    /https:\/\/script.google.com\/d\/([^\n]*)\/edit/
  )[1];

  fs.writeFileSync(
    path.join(appsDir, title, 'appsscript.json'),
    JSON.stringify(
      {
        timeZone: 'Asia/Tokyo',
        dependencies: {},
        exceptionLogging: 'STACKDRIVER',
        runtimeVersion: 'V8',
      },
      null,
      2
    )
  );

  const claspConfig = {
    scriptId: scriptId,
    rootDir: './dist',
    parentId: sheetId,
  };

  fs.writeFileSync(
    path.join(appsDir, title, '.clasp.json'),
    JSON.stringify(claspConfig, null, 2)
  );

  return {
    sheetLink: sheetsLink ? sheetsLink[1] : null,
    scriptLink: scriptLink ? scriptLink[1] : null,
  };
}

function writeReadme(projectPath, links) {
  const { sheetLink, scriptLink } = links;
  const content = `
# Project Documentation

## Links

- Google Sheets: ${sheetLink || 'Not found'}
- Google Apps Script: ${scriptLink || 'Not found'}

  `;

  fs.writeFileSync(path.join(projectPath, 'README.md'), content.trim());
  console.log('README.md has been created with the project links.');
}

async function initProject() {
  console.log('Starting project initialization...');
  let projectPath;

  try {
    const accountInfo = getClaspAccountInfo();
    const isAccountCorrect = await confirmAccount(accountInfo);

    if (!isAccountCorrect) {
      console.log('Please login with a different account.');
      console.log('Run the following command: clasp login');
      return;
    }

    const projectName = await askQuestion('Enter the project name: ');
    if (!projectName) {
      throw new Error('Project name cannot be empty.');
    }
    projectPath = path.join(appsDir, projectName);

    if (fs.existsSync(projectPath)) {
      throw new Error(`Project "${projectName}" already exists.`);
    }
    fs.mkdirSync(projectPath, { recursive: true });
    console.log(`Project directory created at ${projectPath}`);

    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(
        {
          extends: '../../config/tsconfig.base.json',
          compilerOptions: {
            rootDir: '../../',
          },
          include: ['src/**/*', 'rollup.config.mjs'],
        },
        null,
        2
      )
    );

    fs.writeFileSync(
      path.join(projectPath, 'rollup.config.mjs'),
      `import baseConfig from '../../config/rollup.base.mjs';

export default {
  ...baseConfig,
  input: {
    index: 'src/index.ts',
  },
};
`
    );

    fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(projectPath, 'src/index.ts'),
      `function main() { console.log('Hello, world!'); }
`
    );

    const scriptId = await askQuestion(
      'If you have an existing Script ID, enter it here (leave blank to create a new one): '
    );

    let links = { sheetLink: null, scriptLink: null };

    if (scriptId) {
      console.log(`Using existing Script ID: ${scriptId}`);
      try {
        pullProject(scriptId, projectPath);
        links.scriptLink = `https://script.google.com/d/${scriptId}/edit`;
      } catch (err) {
        console.error(
          'No existing Apps Script project found. Creating a new one...'
        );
        links = createGoogleSheetsProject(projectName, projectPath);
      }
    } else {
      const useSheets = await askQuestion(
        'No Spreadsheet ID provided. Do you want to create a new Google Sheets project? (Y/n): '
      );

      if (useSheets.toLowerCase() === 'y' || useSheets.trim() === '') {
        links = createGoogleSheetsProject(projectName, projectPath);
      } else {
        console.log('Skipping Google Sheets project creation.');
      }
    }

    if (links.sheetLink || links.scriptLink) {
      writeReadme(projectPath, links);
    }

    console.log(`Project "${projectName}" initialized successfully!`);
  } catch (err) {
    console.error('Error during initialization:', err.message);
    if (projectPath) {
      cleanUpDirectory(projectPath);
    }
    throw err;
  }
}

initProject().catch(err => {
  console.error(err.message);
});
