// Simple script to debug Dropbox folder access issues
// Run with: node debug-dropbox.js

const { Dropbox } = require('dropbox');
require('dotenv').config({ path: '.env.local' });

const token = process.env.DROPBOX_ACCESS_TOKEN;
const folderPath = process.env.DROPBOX_FOLDER_PATH || '';

if (!token) {
  console.error('Error: No Dropbox access token found in .env.local file');
  process.exit(1);
}

console.log('Using token starting with:', token.substring(0, 10) + '...');
console.log('Attempting to list root folders in your Dropbox account...');

const dbx = new Dropbox({ accessToken: token });

// List root folders first
dbx.filesListFolder({ path: '' })
  .then(response => {
    console.log('\n=== ROOT FOLDERS ===');
    if (response.result.entries.length === 0) {
      console.log('No folders found in root directory.');
    } else {
      response.result.entries.forEach(item => {
        console.log(`${item['.tag']} | ${item.name} | ${item.path_display || 'N/A'}`);
      });
    }
    
    // Now try the specific path
    console.log(`\n=== CHECKING SPECIFIC PATH: "${folderPath}" ===`);
    return dbx.filesListFolder({ path: folderPath }).then(
      folderResponse => {
        console.log('SUCCESS! Found folder with contents:');
        if (folderResponse.result.entries.length === 0) {
          console.log('Folder exists but is empty.');
        } else {
          folderResponse.result.entries.forEach(item => {
            console.log(`${item['.tag']} | ${item.name} | ${item.path_display || 'N/A'}`);
          });
        }
      }
    ).catch(error => {
      console.error('FAILED to access the folder:', error.message);
      if (error.status === 409) {
        console.error('This usually means the folder does not exist or you do not have access to it.');
        console.error('Try one of the folders listed above from the root directory.');
      }
    });
  })
  .catch(error => {
    console.error('Error listing root folders:', error);
  });
