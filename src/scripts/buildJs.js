const fs = require('fs');
const path = require('path');

const pathToSubs = '../submodules/';
const pathToMine = '../js/';

const theirFiles = [
  // 'userChrome.js/113/verticalTabLiteforFx.uc.js'
].map(file => path.join(__dirname, pathToSubs + file));

const myFiles = [
  'urlbar-show-domain.uc.js',
  'foxinity-vertical-tabs.uc.js',
  'sidebar-easy-switch.uc.js'
].map(file => path.join(__dirname, pathToMine + file));

const destinationDirectory = './profile/chrome/JS';

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destinationDirectory)) {
  fs.mkdirSync(destinationDirectory, { recursive: true });
}

// Iterate over the list of files
[...theirFiles, ...myFiles].forEach(source => {
  const fileName = path.basename(source);
  const destination = path.join(destinationDirectory, fileName);

  // Create a readable stream from the source file
  const sourceStream = fs.createReadStream(source);

  // Create a writable stream to the destination file
  const destinationStream = fs.createWriteStream(destination);

  // Copy the file by piping the source stream to the destination stream
  sourceStream.pipe(destinationStream);

  // Handle the 'finish' event to know when the file copy is complete
  destinationStream.on('finish', () => {
    console.log(`File ${source} copied to ${destination} successfully.`);
  });

  // Handle any error that occurs during the copying process
  destinationStream.on('error', (err) => {
    console.error(`Error occurred while copying ${source}:`, err);
  });
});
