# Foxinity development

Foxinity customizes Firefox Developer Edition. Target the installed Developer Edition build; verify its version when relying on Firefox internals.

## Current status

- All existing userChromeJS scripts in `src/js/` are deprecated. Treat them as historical references, not supported implementations. Do not enable or port them unless explicitly requested.
- CSS in `src/css/` is working. Preserve its behavior when making changes.
- `profile/` is an ignored local Firefox profile. `references/` contains ignored reference repositories.

## Source references

- Use `references/ff-src-part/firefox-src-part/` to trace Firefox controllers, commands, events, and UI markup before implementing userChromeJS.
- The reference follows beta builds, broadly matching Developer Edition. Confirm the reference version against the installed browser before assuming APIs match.
- Inspect native Firefox functionality before recreating features such as vertical tabs or sidebar controls.

## Implementation

- Keep changes focused and consistent with surrounding code. Ask before replacing deprecated scripts with new implementations.
- Initialize scripts once per browser window after the required startup phase. Provide cleanup for listeners, observers, timers, injected UI, and patched methods.
- Prefer existing commands and events. Localize dependencies on private Firefox APIs and cite relevant source paths when explaining changes.
- Edit source files, not generated profile output.

## Build and verification

- Run commands from the repository root.
- Build CSS with `node src/scripts/buildCss.js`; its referenced submodule files must be available.
- `node src/scripts/buildJs.js` deploys deprecated scripts. Do not run it as the default development build.
- Launch the development profile with `firefox -no-remote -profile "$PWD/profile"`, using the Developer Edition executable if named differently. A compatible userChromeJS loader must already be configured for JS testing.
- Verify browser UI with Browser Toolbox and errors with Browser Console. For JS changes, check startup, a second window, repeated interactions, and cleanup; check restart persistence when relevant.
- Report actual checks performed and distinguish unverified browser behavior. Syntax checks alone do not establish Firefox compatibility.
