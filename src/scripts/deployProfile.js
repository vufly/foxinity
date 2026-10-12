#!/usr/bin/env node

const copyProfile = require('./copyProfile');

if (require.main === module) {
  if (copyProfile.main) {
    copyProfile.main();
  }
}

module.exports = copyProfile;
