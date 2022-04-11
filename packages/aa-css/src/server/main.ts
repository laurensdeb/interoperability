import {absoluteFilePath, AppRunner} from '@solid/community-server';
import * as path from 'path';

export const runServer = async () => {
  const appRunner = new AppRunner();

  const configVariables = {
    'urn:solid-server:default:variable:showStackTrace': true,
    'urn:solid-server:default:variable:loggingLevel': 'warn',
    'urn:solid-server:default:variable:port': 3000,
    'urn:solid-server:default:variable:baseUrl': 'http://localhost:3000',
    'urn:solid-server:default:variable:seededPodConfigJson': null,
  };

  const app = await appRunner.create(
      {
        mainModulePath: absoluteFilePath('.'),
      },
      path.join(__dirname, '../../config/default.json'),
      configVariables,
  );

  await app.start();
};
runServer();
