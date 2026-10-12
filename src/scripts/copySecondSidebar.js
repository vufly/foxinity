const fs = require('fs');
const path = require('path');

const sourceDirectory = path.join(__dirname, '../submodules/firefox-second-sidebar/src');
const destinationDirectory = path.join(__dirname, '../../profile/chrome/JS');

function copySecondSidebar() {
  if (!fs.existsSync(sourceDirectory)) {
    throw new Error(`Source directory does not exist: ${sourceDirectory}`);
  }

  if (!fs.existsSync(destinationDirectory)) {
    fs.mkdirSync(destinationDirectory, { recursive: true });
  }

  fs.cpSync(sourceDirectory, destinationDirectory, { recursive: true, force: true });
  console.log('firefox-second-sidebar files copied to profile/chrome/JS successfully.');
}

if (require.main === module) {
  copySecondSidebar();
}

module.exports = copySecondSidebar;
