import * as path from 'path';
import {ComponentsManager} from 'componentsjs';
import {NodeHttpServer} from '@digita-ai/handlersjs-http';
import yargs from 'yargs';

const argv = yargs(process.argv.slice(2)).options({
  config: {type: 'string'},
  host: {type: 'string', default: 'localhost'},
  protocol: {type: 'string', default: 'http'},
  mainModulePath: {type: 'string'},
  customConfigPath: {type: 'string'},
}).parseSync();

const umaPort = 4000;
const aaPort = 4001;

export const launch: () => Promise<void> =
async () => {
  const variables: Record<string, any> = {};

  variables['urn:authorization-service:variables:port'] = umaPort;
  variables['urn:authorization-service:variables:host'] = argv.host;
  variables['urn:authorization-service:variables:protocol'] = argv.protocol;
  variables['urn:authorization-service:variables:baseUrl'] = `${argv.protocol}://${argv.host}:${umaPort}/uma`;

  variables['urn:authorization-agent:variables:port'] = aaPort;
  variables['urn:authorization-agent:variables:host'] = argv.host;
  variables['urn:authorization-agent:variables:protocol'] = argv.protocol;
  variables['urn:authorization-agent:variables:baseUrl'] = `${argv.protocol}://${argv.host}:${aaPort}/aa`;

  variables['urn:authorization-service:variables:mainModulePath'] = argv.mainModulePath ?
    path.join(process.cwd(),
        argv.mainModulePath) :
    path.join(__dirname, '../');
  variables['urn:authorization-service:variables:customConfigPath'] = argv.customConfigPath ?
    path.join(process.cwd(),
        argv.customConfigPath) :
    path.join(__dirname, '../config/default.json');

  const mainModulePath = variables['urn:authorization-service:variables:mainModulePath'];

  const configPath = variables['urn:authorization-service:variables:customConfigPath'];

  const manager = await ComponentsManager.build({
    mainModulePath,
    logLevel: 'silly',
  });

  await manager.configRegistry.register(configPath);

  const umaServer: NodeHttpServer = await
  manager.instantiate('urn:authorization-service:default:NodeHttpServer',
      {variables});
  const aaServer: NodeHttpServer = await manager.instantiate('urn:authorization-agent:default:NodeHttpServer',
      {variables});
  umaServer.start();
  aaServer.start();
};

launch();
