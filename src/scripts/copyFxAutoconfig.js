const fs = require('fs');
const path = require('path');

const sourceDirectory = path.join(__dirname, '../submodules/fx-autoconfig/profile');
const destinationDirectory = path.join(__dirname, '../../profile');

function copyFxAutoconfig() {
  if (!fs.existsSync(sourceDirectory)) {
    throw new Error(`Source directory does not exist: ${sourceDirectory}`);
  }

  if (!fs.existsSync(destinationDirectory)) {
    fs.mkdirSync(destinationDirectory, { recursive: true });
  }

  fs.cpSync(sourceDirectory, destinationDirectory, { recursive: true, force: true });
  console.log('fx-autoconfig profile copied to profile successfully.');
}

if (require.main === module) {
  copyFxAutoconfig();
}

module.exports = copyFxAutoconfig;
