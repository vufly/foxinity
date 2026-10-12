#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const tty = require('tty');
const readline = require('readline');
const { execSync, spawnSync } = require('child_process');

function isWsl() {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return true;
  try {
    const release = os.release().toLowerCase();
    if (release.includes('microsoft') || release.includes('wsl')) return true;
  } catch {}
  return false;
}

function toWslPath(winPath) {
  if (!winPath) return '';
  winPath = winPath.trim().replace(/^"|"$/g, '');
  try {
    return execSync(`wslpath -u "${winPath}"`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return winPath.replace(/^([a-zA-Z]):[/\\]/, (_, d) => `/mnt/${d.toLowerCase()}/`).replace(/\\/g, '/');
  }
}

function toWindowsPath(posixPath) {
  if (!posixPath) return '';
  posixPath = posixPath.trim().replace(/^"|"$/g, '');
  try {
    return execSync(`wslpath -w "${posixPath}"`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return posixPath.replace(/^\/mnt\/([a-zA-Z])\//, (_, d) => `${d.toUpperCase()}:\\`).replace(/\//g, '\\');
  }
}

function parseIni(content) {
  const sections = {};
  let current = null;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
    const secMatch = trimmed.match(/^\[(.*)\]$/);
    if (secMatch) {
      current = secMatch[1];
      sections[current] = {};
      continue;
    }
    if (current) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        sections[current][key] = val;
      }
    }
  }
  return sections;
}

function extractProfilesFromFirefoxDir(firefoxDir, sourceLabel = 'custom') {
  const profiles = [];
  const iniPath = path.join(firefoxDir, 'profiles.ini');
  if (!fs.existsSync(iniPath)) return profiles;

  let ini;
  try {
    ini = parseIni(fs.readFileSync(iniPath, 'utf8'));
  } catch {
    return profiles;
  }

  const defaultPaths = new Set();
  for (const [sec, data] of Object.entries(ini)) {
    if (sec.startsWith('Install') && data.Default) {
      defaultPaths.add(data.Default);
    }
  }

  const seenPaths = new Set();

  for (const [sec, data] of Object.entries(ini)) {
    if (/^Profile\d+$/i.test(sec) && data.Path) {
      const isRel = data.IsRelative === '1' || data.IsRelative === 1;
      let absPath = '';
      if (isRel) {
        absPath = path.resolve(firefoxDir, data.Path);
      } else {
        absPath = data.Path.startsWith('/mnt/') || !isWsl() ? data.Path : toWslPath(data.Path);
      }

      if (seenPaths.has(absPath)) continue;
      seenPaths.add(absPath);

      const isDefault = data.Default === '1' || data.Default === 1 || defaultPaths.has(data.Path);
      profiles.push({
        name: data.Name || path.basename(absPath),
        path: absPath,
        wslPath: absPath,
        windowsPath: toWindowsPath(absPath),
        source: sourceLabel,
        isDefault: Boolean(isDefault),
        exists: fs.existsSync(absPath)
      });
    }
  }

  const profilesSubDir = path.join(firefoxDir, 'Profiles');
  if (fs.existsSync(profilesSubDir) && fs.statSync(profilesSubDir).isDirectory()) {
    try {
      for (const entry of fs.readdirSync(profilesSubDir)) {
        const full = path.join(profilesSubDir, entry);
        if (fs.statSync(full).isDirectory() && !seenPaths.has(full)) {
          seenPaths.add(full);
          profiles.push({
            name: entry,
            path: full,
            wslPath: full,
            windowsPath: toWindowsPath(full),
            source: sourceLabel,
            isDefault: false,
            exists: true
          });
        }
      }
    } catch {}
  }

  return profiles;
}

function findWindowsFirefoxProfiles() {
  const dirs = new Set();

  if (isWsl()) {
    try {
      const raw = execSync('cmd.exe /c "echo %APPDATA%"', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (raw) {
        const wsl = toWslPath(raw);
        const cand = path.join(wsl, 'Mozilla', 'Firefox');
        if (fs.existsSync(cand)) dirs.add(cand);
      }
    } catch {}

    const usersBase = '/mnt/c/Users';
    if (fs.existsSync(usersBase)) {
      try {
        for (const u of fs.readdirSync(usersBase)) {
          if (['Default', 'Default User', 'Public', 'All Users', 'WDAGUtilityAccount'].includes(u)) continue;
          const cand = path.join(usersBase, u, 'AppData', 'Roaming', 'Mozilla', 'Firefox');
          if (fs.existsSync(cand)) dirs.add(cand);
        }
      } catch {}
    }
  } else if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    if (appData) {
      const cand = path.join(appData, 'Mozilla', 'Firefox');
      if (fs.existsSync(cand)) dirs.add(cand);
    }
  }

  const result = [];
  for (const dir of dirs) {
    result.push(...extractProfilesFromFirefoxDir(dir, 'windows'));
  }
  return result;
}

function findLinuxFirefoxProfiles() {
  const dirs = [
    path.join(os.homedir(), '.mozilla', 'firefox'),
    path.join(os.homedir(), '.var', 'app', 'org.mozilla.firefox', '.mozilla', 'firefox'),
    path.join(os.homedir(), 'snap', 'firefox', 'common', '.mozilla', 'firefox')
  ];

  const result = [];
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      result.push(...extractProfilesFromFirefoxDir(dir, 'linux'));
    }
  }
  return result;
}

function findLocalProfile() {
  const localDir = path.resolve(__dirname, '../../profile');
  if (fs.existsSync(localDir) && fs.statSync(localDir).isDirectory()) {
    return [{
      name: 'local (repo profile)',
      path: localDir,
      wslPath: localDir,
      windowsPath: toWindowsPath(localDir),
      source: 'local',
      isDefault: false,
      exists: true
    }];
  }
  return [];
}

function getProfiles(options = {}) {
  const { source = 'auto', customDir = null, customIni = null } = options;
  let profiles = [];

  if (customIni) {
    const iniDir = path.dirname(path.resolve(customIni));
    profiles.push(...extractProfilesFromFirefoxDir(iniDir, 'custom'));
  } else if (customDir) {
    const resDir = path.resolve(customDir);
    if (fs.existsSync(path.join(resDir, 'profiles.ini'))) {
      profiles.push(...extractProfilesFromFirefoxDir(resDir, 'custom'));
    } else if (fs.existsSync(resDir)) {
      profiles.push({
        name: path.basename(resDir),
        path: resDir,
        wslPath: resDir,
        windowsPath: toWindowsPath(resDir),
        source: 'custom',
        isDefault: false,
        exists: true
      });
    }
  } else if (source === 'windows') {
    profiles.push(...findWindowsFirefoxProfiles());
  } else if (source === 'linux') {
    profiles.push(...findLinuxFirefoxProfiles());
  } else if (source === 'local') {
    profiles.push(...findLocalProfile());
  } else if (source === 'all') {
    profiles.push(...findWindowsFirefoxProfiles());
    profiles.push(...findLinuxFirefoxProfiles());
    profiles.push(...findLocalProfile());
  } else {
    if (isWsl()) {
      profiles.push(...findWindowsFirefoxProfiles());
      profiles.push(...findLocalProfile());
      profiles.push(...findLinuxFirefoxProfiles());
    } else if (process.platform === 'win32') {
      profiles.push(...findWindowsFirefoxProfiles());
      profiles.push(...findLocalProfile());
    } else {
      profiles.push(...findLinuxFirefoxProfiles());
      profiles.push(...findLocalProfile());
    }
  }

  const seen = new Set();
  const deduped = [];
  for (const p of profiles) {
    if (!seen.has(p.path)) {
      seen.add(p.path);
      deduped.push(p);
    }
  }

  return deduped;
}



function selectProfileWithKeyboard(profiles, options = {}) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stderr;

    if (!input.isTTY) {
      // Non-interactive environment (pipe, redirected input, or background):
      // Avoid hanging, immediately return default or first profile
      const def = profiles.find(p => p.isDefault) || profiles[0];
      return resolve(def);
    }

    let selectedIndex = profiles.findIndex(p => p.isDefault);
    if (selectedIndex === -1) selectedIndex = 0;

    const hideCursor = '\x1b[?25l';
    const showCursor = '\x1b[?25h';
    const clearBelow = '\x1b[0J';
    const cyan = '\x1b[36m';
    const green = '\x1b[32m';
    const yellow = '\x1b[33m';
    const dim = '\x1b[2m';
    const bold = '\x1b[1m';
    const reset = '\x1b[0m';

    let renderedLineCount = 0;

    function render() {
      if (renderedLineCount > 0) {
        output.write(`\x1b[${renderedLineCount}A\r${clearBelow}`);
      }

      const lines = [];
      lines.push(`${bold}Select Firefox profile${reset} ${dim}(↑/↓ or j/k to move, 1-9 to jump, Enter to select, q/Esc/Ctrl+C to cancel):${reset}`);

      profiles.forEach((p, idx) => {
        const isSelected = idx === selectedIndex;
        const pointer = isSelected ? `${cyan}❯${reset}` : ' ';
        const num = `${dim}[${idx + 1}]${reset}`;
        const sourceTag = p.source === 'windows' ? `${yellow}[Win]${reset}` : p.source === 'local' ? `${cyan}[Local]${reset}` : `${green}[Linux]${reset}`;
        const defTag = p.isDefault ? ` ${green}(default)${reset}` : '';
        const nameStr = isSelected ? `${bold}${cyan}${p.name}${reset}` : p.name;

        lines.push(` ${pointer} ${num} ${sourceTag} ${nameStr}${defTag}`);
        const displayPath = options.format === 'windows' ? p.windowsPath : p.wslPath;
        const pathLine = `     ${dim}${displayPath}${reset}`;
        lines.push(pathLine);
      });

      output.write(hideCursor + lines.join('\n') + '\n');
      renderedLineCount = lines.length;
    }

    let cleanedUp = false;
    function cleanup() {
      if (cleanedUp) return;
      cleanedUp = true;
      input.removeListener('keypress', onKeypress);
      input.removeListener('data', onRawData);
      process.removeListener('SIGINT', onSigInt);
      process.removeListener('SIGTERM', onSigTerm);
      if (input.isTTY) {
        try { input.setRawMode(false); } catch {}
      }
      input.pause();
      if (renderedLineCount > 0) {
        output.write(`\x1b[${renderedLineCount}A\r${clearBelow}`);
      }
      output.write(showCursor);
    }

    const onRawData = (buf) => {
      if (buf.includes(3)) {
        cleanup();
        process.exit(130);
      }
    };

    const onSigInt = () => {
      cleanup();
      process.exit(130);
    };

    const onSigTerm = () => {
      cleanup();
      process.exit(143);
    };

    const onKeypress = (str, key) => {
      if ((key && key.ctrl && key.name === 'c') || str === '\u0003' || str === '\x03') {
        cleanup();
        process.exit(130);
      }

      if ((key && key.name === 'escape') || str === 'q' || str === 'Q') {
        cleanup();
        reject(new Error('Profile selection cancelled.'));
        return;
      }

      if ((key && key.name === 'up') || str === 'k') {
        selectedIndex = (selectedIndex - 1 + profiles.length) % profiles.length;
        render();
        return;
      }

      if ((key && key.name === 'down') || str === 'j') {
        selectedIndex = (selectedIndex + 1) % profiles.length;
        render();
        return;
      }

      if (str >= '1' && str <= String(Math.min(9, profiles.length))) {
        selectedIndex = parseInt(str, 10) - 1;
        confirmSelection();
        return;
      }

      if ((key && (key.name === 'return' || key.name === 'enter')) || str === '\r' || str === '\n' || str === ' ') {
        confirmSelection();
        return;
      }
    };

    function confirmSelection() {
      cleanup();
      resolve(profiles[selectedIndex]);
    }

    process.on('SIGINT', onSigInt);
    process.on('SIGTERM', onSigTerm);
    readline.emitKeypressEvents(input);
    input.on('keypress', onKeypress);
    input.on('data', onRawData);
    input.setRawMode(true);
    input.resume();
    render();
  });
}

function selectProfileWithFzf(profiles, options = {}) {
  const fzfInput = profiles.map((p, idx) => {
    const def = p.isDefault ? ' (default)' : '';
    const src = `[${p.source}]`;
    const pathVal = options.format === 'windows' ? p.windowsPath : p.wslPath;
    return `${src} ${p.name}${def}\t${pathVal}`;
  }).join('\n');

  try {
    const res = spawnSync('fzf', ['--delimiter=\t', '--with-nth=1', '--prompt=Select Firefox Profile> '], {
      input: fzfInput,
      stdio: ['pipe', 'pipe', 'inherit']
    });
    if (res.status === 0 && res.stdout) {
      const line = res.stdout.toString().trim();
      const parts = line.split('\t');
      const chosenPath = parts[1] || parts[0];
      return profiles.find(p => p.wslPath === chosenPath || p.windowsPath === chosenPath) || null;
    }
  } catch {}
  return null;
}

function parseCliArgs(args) {
  const options = {
    source: 'auto',
    format: isWsl() ? 'wsl' : 'native',
    filterName: null,
    pickDefault: false,
    pickFirst: false,
    listOnly: false,
    json: false,
    nameOnly: false,
    useFzf: false,
    customDir: null,
    customIni: null,
    excludeLocal: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-w' || arg === '--windows') {
      options.source = 'windows';
    } else if (arg === '-l' || arg === '--linux') {
      options.source = 'linux';
    } else if (arg === '--local') {
      options.source = 'local';
    } else if (arg === '--no-local' || arg === '--exclude-local') {
      options.excludeLocal = true;
    } else if (arg === '-a' || arg === '--all') {
      options.source = 'all';
    } else if (arg === '-W' || arg === '--win' || arg === '--windows-path') {
      options.format = 'windows';
    } else if (arg === '--wsl' || arg === '--wsl-path') {
      options.format = 'wsl';
    } else if (arg === '--format') {
      options.format = args[++i];
    } else if (arg === '-d' || arg === '--default') {
      options.pickDefault = true;
    } else if (arg === '--first') {
      options.pickFirst = true;
    } else if (arg === '-n' || arg === '--name') {
      options.filterName = args[++i];
    } else if (arg === '--list') {
      options.listOnly = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--name-only') {
      options.nameOnly = true;
    } else if (arg === '--fzf') {
      options.useFzf = true;
    } else if (arg === '--dir') {
      options.customDir = args[++i];
    } else if (arg === '--ini') {
      options.customIni = args[++i];
    }
  }

  return options;
}

function printHelp() {
  const helpText = `Usage: node src/scripts/pickProfile.js [options]

Interactive Firefox profile picker. Returns the selected profile path to stdout.

Sources:
  -w, --windows          Search Windows Firefox profiles (via WSL or native Windows)
  -l, --linux            Search Linux Firefox profiles (~/.mozilla/firefox, snap, flatpak)
      --local            Include local repo profile (./profile)
  -a, --all              Search all sources (Windows, Linux, local)
      --dir <path>       Specify custom Firefox directory or profile directory
      --ini <path>       Specify custom profiles.ini path

Output Format:
  -W, --win, --windows-path  Output Windows path style (C:\\...)
      --wsl, --wsl-path      Output WSL POSIX path style (/mnt/c/...) [default in WSL]
      --format <wsl|windows> Explicit path format
      --json                 Output full profile metadata in JSON
      --name-only            Output profile name only

Selection:
  -d, --default          Select default profile directly (non-interactive)
  -n, --name <pattern>   Filter by profile name, or select directly if exact/single match
      --first            Select first found profile directly (non-interactive)
      --list             List all detected profiles and exit
      --fzf              Use fzf for fuzzy interactive selection

General:
  -h, --help             Show this help message

Examples:
  # Interactively pick profile from Windows side:
  node src/scripts/pickProfile.js -w

  # Capture chosen profile path in a shell variable:
  PROFILE=$(node src/scripts/pickProfile.js)

  # Get Windows-style path for launching Windows firefox.exe:
  WIN_PROFILE=$(node src/scripts/pickProfile.js -w -W)

  # Pick default profile non-interactively:
  node src/scripts/pickProfile.js --default
`;
  process.stdout.write(helpText);
}

async function pickProfile(options = {}) {
  let profiles = options.profiles ? [...options.profiles] : getProfiles(options);

  if (options.excludeLocal) {
    profiles = profiles.filter(p => p.source !== 'local');
  }

  if (options.filterName) {
    const q = options.filterName.toLowerCase();
    const exact = profiles.filter(p => p.name.toLowerCase() === q);
    if (exact.length === 1) {
      profiles = exact;
    } else {
      profiles = profiles.filter(p => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
    }
  }

  if (profiles.length === 0) {
    throw new Error('No Firefox profiles found matching criteria.');
  }

  if (options.pickDefault) {
    const def = profiles.find(p => p.isDefault);
    if (def) return def;
    return profiles[0];
  }

  if (options.pickFirst || profiles.length === 1) {
    return profiles[0];
  }

  if (options.useFzf) {
    const fzfChoice = selectProfileWithFzf(profiles, options);
    if (fzfChoice) return fzfChoice;
  }

  return selectProfileWithKeyboard(profiles, options);
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  let profiles = getProfiles(options);
  if (options.excludeLocal) {
    profiles = profiles.filter(p => p.source !== 'local');
  }

  if (options.listOnly) {
    if (options.json) {
      console.log(JSON.stringify(profiles, null, 2));
    } else {
      profiles.forEach((p, idx) => {
        const def = p.isDefault ? ' (default)' : '';
        const pathVal = options.format === 'windows' ? p.windowsPath : p.wslPath;
        console.log(`[${idx + 1}] [${p.source}] ${p.name}${def} -> ${pathVal}`);
      });
    }
    process.exit(0);
  }

  try {
    const chosen = await pickProfile(options);
    if (!chosen) {
      process.exit(1);
    }

    if (options.json) {
      console.log(JSON.stringify(chosen, null, 2));
    } else if (options.nameOnly) {
      console.log(chosen.name);
    } else if (options.format === 'windows') {
      console.log(chosen.windowsPath);
    } else {
      console.log(chosen.wslPath);
    }
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

module.exports = {
  pickProfile,
  getProfiles,
  toWindowsPath,
  toWslPath,
  isWsl
};
