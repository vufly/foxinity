# Foxinity

Foxinity is a Firefox theme that combines custom looks with enhanced utility, offering a personalized and streamlined browsing experience.

## Development

Target Firefox Developer Edition. Existing scripts in `src/js/` are deprecated; CSS in `src/css/` remains supported.

Copy `src/user.js` to the root of your development profile (`profile/user.js` for the local profile), then restart Firefox. It enables userChrome stylesheets, Browser Toolbox, automatic debugger connection acceptance, and SVG context colors. Open Browser Toolbox from **Tools → Browser Tools → Browser Toolbox**. A separate compatible loader is required to run userChromeJS.

See [AGENTS.md](AGENTS.md) for source references, build commands, and verification requirements.
