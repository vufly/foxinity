const fs = require('fs');
const path = require('path');

const pathToSubs = '../submodules/';
const pathToMine = '../css/';

var theirFiles = [
  'firefox-csshacks/chrome/tabs_on_bottom.css',
  // 'firefox-csshacks/chrome/tabs_on_bottom_menubar_on_top_patch.css',
  'firefox-csshacks/chrome/combined_favicon_and_tab_close_button.css',
  'firefox-csshacks/chrome/urlbar_centered_text.css'
].map(file => path.join(__dirname, pathToSubs + file));

var myFiles = [
  'hide-window-control.css',
  'testing.css'
].map(file => path.join(__dirname, pathToMine + file));

const outputFilePath = path.join(__dirname, '../../profile/chrome/userChrome.css');
const outputDirectory = path.dirname(outputFilePath);
// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

// Read the contents of all CSS files
const concatenatedContent = [...theirFiles, ...myFiles].map(file => fs.readFileSync(file, 'utf8')).join('\n');

// Write the concatenated content to the output file
fs.writeFileSync(outputFilePath, concatenatedContent, { flag: 'w' });

console.log('CSS files concatenated successfully.');
