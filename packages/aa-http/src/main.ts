import * as path from 'path';
import {ComponentsManager} from 'componentsjs';
import {NodeHttpServer} from '@digita-ai/handlersjs-http';
import yargs from 'yargs';

const argv = yargs(process.argv.slice(2)).options({
  config: {type: 'string'},
  port: {type: 'number', default: 4000},
  host: {type: 'string', default: 'localhost'},
  protocol: {type: 'string', default: 'http'},
  mainModulePath: {type: 'string'},
  customConfigPath: {type: 'string'},
}).parseSync();

export const launch: () => Promise<void> =
async () => {
  const variables: Record<string, any> = {};

  variables['urn:authorization-agent:variables:port'] = argv.port;
  variables['urn:authorization-agent:variables:host'] = argv.host;
  variables['urn:authorization-agent:variables:protocol'] = argv.protocol;
  variables['urn:authorization-agent:variables:baseUrl'] = `${argv.protocol}://${argv.host}:${argv.port}`;

  variables['urn:authorization-agent:variables:mainModulePath'] = argv.mainModulePath ?
    path.join(process.cwd(),
        argv.mainModulePath) :
    path.join(__dirname, '../');
  variables['urn:authorization-agent:variables:customConfigPath'] = argv.customConfigPath ?
    path.join(process.cwd(),
        argv.customConfigPath) :
    path.join(__dirname, '../config/default.json');

  const mainModulePath = variables['urn:authorization-agent:variables:mainModulePath'];

  const configPath = variables['urn:authorization-agent:variables:customConfigPath'];

  const manager = await ComponentsManager.build({
    mainModulePath,
    logLevel: 'silly',
  });

  await manager.configRegistry.register(configPath);

  const server: NodeHttpServer = await
  manager.instantiate('urn:authorization-agent:default:NodeHttpServer',
      {variables});
  server.start();
};

launch();
