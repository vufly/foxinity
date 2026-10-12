# Foxinity

Foxinity is a Firefox theme that combines custom looks with enhanced utility, offering a personalized and streamlined browsing experience.

## Development

Target Firefox Developer Edition. Existing scripts in `src/js/` are deprecated; CSS in `src/css/` remains supported.

Copy `src/user.js` to the root of your development profile (`profile/user.js` for the local profile), then restart Firefox. It enables userChrome stylesheets, Browser Toolbox, automatic debugger connection acceptance, and SVG context colors. Open Browser Toolbox from **Tools → Browser Tools → Browser Toolbox**. A separate compatible loader is required to run userChromeJS.

See [AGENTS.md](AGENTS.md) for source references, build commands, and verification requirements.

## Scripts

All scripts are located in `src/scripts/` and run with Node from the repository root:

- **Build local profile:**
  ```bash
  node src/scripts/buildProfile.js
  ```
  Assembles the development profile in `./profile` by sequentially running `copyFxAutoconfig.js`, `copySecondSidebar.js`, and `buildCss.js`.

- **Build CSS:**
  ```bash
  node src/scripts/buildCss.js
  ```
  Concatenates custom CSS and submodule patches into `profile/chrome/userChrome.css`.

- **Copy fx-autoconfig:**
  ```bash
  node src/scripts/copyFxAutoconfig.js
  ```
  Copies `fx-autoconfig` loader modules and resources (`chrome/utils`, `chrome/resources`, etc.) into `./profile`.

- **Copy second sidebar:**
  ```bash
  node src/scripts/copySecondSidebar.js
  ```
  Copies `firefox-second-sidebar` scripts to `profile/chrome/JS`.

- **Profile picker:**
  ```bash
  node src/scripts/pickProfile.js [options]
  ```
  Interactive keyboard picker (`↑`/`↓` or `j`/`k`, `1-9`, `Enter`, `q`/`Esc`) returning profile paths to stdout. Automatically discovers Windows profiles in WSL, Linux profiles, and local profile.
  - `-w`, `--windows`: query Windows Firefox profiles.
  - `-l`, `--linux`: query Linux profiles.
  - `-d`, `--default`: select default profile without prompt.
  - `-n <name>`: select or filter by profile name.
  - `-W`, `--win`: output Windows-style `C:\...` path.
  - `--list`: list detected profiles non-interactively.

- **Deploy profile:**
  ```bash
  node src/scripts/copyProfile.js [options] [target_path]
  # alias: node src/scripts/deployProfile.js
  ```
  Copies `./profile` content to a target profile selected via `pickProfile.js` (or passed directly via `-t <path>`).
  - `-b`, `--build`: force rebuild local profile before copying.
  - `-w`, `-l`, `-d`, `-n <name>`: passed through to target picker.
  - `--dry-run`: preview files that would be copied without writing.
