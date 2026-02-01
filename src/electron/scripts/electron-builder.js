'use strict';

import builder from 'electron-builder';
const Platform = builder.Platform;

const isDebug = process.env.DEBUG === 'true';
if (isDebug) {
  console.log('Building in debug mode');
}
const appId = isDebug ? 'com.tilt.app.dev' : 'com.tilt.app';

// Let's get that intellisense working
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration
 */
const options = {
  appId,
  productName: 'tilt',
  directories: {
    output: 'dist/electron',
  },
  files: ['dist-electron/**/*', 'dist-ui/**/*'],
  mac: {
    target: isDebug ? ['dir'] : ['dmg', 'zip', 'pkg'],
    category: 'public.app-category.developer-tools',
    hardenedRuntime: isDebug ? false : true,
    gatekeeperAssess: isDebug ? false : true,
    type: isDebug ? 'development' : 'distribution',
  },
};

// Promise is returned
builder
  .build({
    targets: Platform.MAC.createTarget(),
    config: options,
  })
  .then((result) => {
    console.log(JSON.stringify(result));
  })
  .catch((error) => {
    console.error(error);
  });
