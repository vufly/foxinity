const copyFxAutoconfig = require('./copyFxAutoconfig');
const copySecondSidebar = require('./copySecondSidebar');
const buildCss = require('./buildCss');

function buildProfile() {
  copyFxAutoconfig();
  copySecondSidebar();
  buildCss();
  console.log('Profile built successfully.');
}

if (require.main === module) {
  buildProfile();
}

module.exports = buildProfile;
