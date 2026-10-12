#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pickProfile } = require('./pickProfile');
const buildProfile = require('./buildProfile');

function parseCliArgs(args) {
  const options = {
    source: 'auto',
    filterName: null,
    pickDefault: false,
    pickFirst: false,
    targetDir: null,
    alwaysBuild: false,
    dryRun: false,
    useFzf: false,
    excludeLocal: true,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-b' || arg === '--build') {
      options.alwaysBuild = true;
    } else if (arg === '-w' || arg === '--windows') {
      options.source = 'windows';
    } else if (arg === '-l' || arg === '--linux') {
      options.source = 'linux';
    } else if (arg === '-d' || arg === '--default') {
      options.pickDefault = true;
    } else if (arg === '--first') {
      options.pickFirst = true;
    } else if (arg === '-n' || arg === '--name') {
      options.filterName = args[++i];
    } else if (arg === '-t' || arg === '--target') {
      options.targetDir = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--fzf') {
      options.useFzf = true;
    } else if (!arg.startsWith('-') && !options.targetDir) {
      options.targetDir = arg;
    }
  }

  return options;
}

function printHelp() {
  const helpText = `Usage: node src/scripts/copyProfile.js [options] [target_path]

Copy contents of local development profile (./profile) into a selected Firefox profile.
Uses interactive keyboard picker by default to select the target profile.

Options:
  -b, --build           Force running buildProfile before copying
  -w, --windows         Select from Windows Firefox profiles (WSL)
  -l, --linux           Select from Linux Firefox profiles
  -d, --default         Copy to default profile directly without prompting
  -n, --name <pattern>  Copy to profile matching name directly
  -t, --target <path>   Specify target profile path directly (bypasses picker)
      --dry-run         Show files that would be copied without writing
      --fzf             Use fzf in profile picker
  -h, --help            Show this help message

Examples:
  # Interactively pick target profile and copy:
  node src/scripts/copyProfile.js

  # Rebuild local profile and copy to default Windows profile:
  node src/scripts/copyProfile.js -b -w -d

  # Copy to dev-test profile by name:
  node src/scripts/copyProfile.js -n dev-test

  # Copy to a custom target directory:
  node src/scripts/copyProfile.js -t /path/to/firefox/profile
`;
  process.stdout.write(helpText);
}

function listFilesRecursive(dir, base = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(full, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

async function copyProfile(options = {}) {
  const sourceDir = path.resolve(__dirname, '../../profile');

  if (options.alwaysBuild || !fs.existsSync(path.join(sourceDir, 'chrome'))) {
    console.log('Building local profile...');
    buildProfile();
  }

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Local profile directory not found: ${sourceDir}`);
  }

  let targetDir = null;
  let targetName = null;

  if (options.targetDir) {
    targetDir = path.resolve(options.targetDir);
    targetName = path.basename(targetDir);
  } else {
    const chosen = await pickProfile({
      ...options,
      excludeLocal: true
    });

    if (!chosen) {
      throw new Error('No profile selected.');
    }

    targetDir = chosen.wslPath || chosen.path;
    targetName = chosen.name;
  }

  if (path.resolve(sourceDir) === path.resolve(targetDir)) {
    throw new Error('Source and target profiles are the same directory.');
  }

  const files = listFilesRecursive(sourceDir);
  if (files.length === 0) {
    throw new Error(`Local profile at ${sourceDir} is empty.`);
  }

  console.log(`Target profile: ${targetName} (${targetDir})`);

  if (options.dryRun) {
    console.log(`[DRY RUN] Would copy ${files.length} files from ${sourceDir} to ${targetDir}:`);
    files.forEach(f => console.log(`  -> ${f}`));
    return { sourceDir, targetDir, targetName, copiedCount: files.length, dryRun: true };
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
  console.log(`Successfully copied ${files.length} files from local profile to ${targetName}.`);

  return { sourceDir, targetDir, targetName, copiedCount: files.length, dryRun: false };
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  try {
    await copyProfile(options);
    process.exit(0);
  } catch (err) {
    if (err.message && err.message.includes('cancelled')) {
      process.exit(130);
    }
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = copyProfile;
module.exports.main = main;
