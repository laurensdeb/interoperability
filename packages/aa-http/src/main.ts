import * as path from 'path';
import {ComponentsManager} from 'componentsjs';
import {NodeHttpServer} from '@digita-ai/handlersjs-http';

export const launch: (variables: Record<string, any>) => Promise<void> =
async (variables: Record<string, any>) => {
  const mainModulePath = variables['urn:authorization-agent:variables:mainModulePath'] ?
    path.join(process.cwd(),
        variables['urn:authorization-agent:variables:mainModulePath']) :
    path.join(__dirname, '../');

  const configPath = variables['urn:authorization-agent:variables:customConfigPath'] ?
    path.join(process.cwd(),
        variables['urn:authorization-agent:variables:customConfigPath']) :
    path.join(__dirname, '../config/default.json');

  const manager = await ComponentsManager.build({
    mainModulePath,
    logLevel: 'silly'
  });

  await manager.configRegistry.register(configPath);

  const server: NodeHttpServer = await
  manager.instantiate('urn:authorization-agent:default:NodeHttpServer',
      {variables});
  server.start();
};

launch({});
