// Firefox Developer Edition preferences for userChrome development.
// Copy this file to the development profile's root and restart Firefox.

// Load profile/chrome/userChrome.css and userContent.css.
user_pref('toolkit.legacyUserProfileCustomizations.stylesheets', true);

// Enable Browser Toolbox and privileged browser-chrome debugging.
user_pref('devtools.chrome.enabled', true);
user_pref('devtools.debugger.remote-enabled', true);

// Automatically accept debugger connections without a confirmation dialog.
user_pref('devtools.debugger.prompt-connection', false);

// Allow SVG icons to inherit context-fill and context-stroke from CSS.
user_pref('svg.context-properties.content.enabled', true);
