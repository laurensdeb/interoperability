import {PodManager, getLoggerFor, ResourceStore, ResourcesGenerator,
  ResourceIdentifier, PodSettings, addGeneratedResources, ConflictHttpError} from '@solid/community-server';

/**
 * Pod manager that uses an {@link IdentifierGenerator} and {@link ResourcesGenerator}
 * to create the default resources and identifier for a new pod.
 */
export class CustomGeneratedPodManager implements PodManager {
  protected readonly logger = getLoggerFor(this);

  private readonly store: ResourceStore;
  private readonly resourcesGenerator: ResourcesGenerator;
  private readonly aaBaseUrl: string;

  /**
   * @param {ResourceStore} store
   * @param {ResourcesGenerator} resourcesGenerator - Generator for the pod resources.
   * @param {string} aaBaseUrl - Base URL of the Authorization Agents
   */
  public constructor(store: ResourceStore, resourcesGenerator: ResourcesGenerator, aaBaseUrl: string) {
    this.store = store;
    this.resourcesGenerator = resourcesGenerator;
    this.aaBaseUrl = aaBaseUrl;
  }

  /**
   * Creates a new pod, pre-populating it with the resources created by the data generator.
   * Will throw an error if the given identifier already has a resource.
   *
   * @param {ResourceIdentifier} identifier
   * @param {PodSettings} settings
   * @param {boolean} overwrite
   */
  public async createPod(identifier: ResourceIdentifier, settings: PodSettings, overwrite: boolean): Promise<void> {
    this.logger.info(`Creating pod ${identifier.path}`);
    if (!overwrite && await this.store.hasResource(identifier)) {
      throw new ConflictHttpError(`There already is a resource at ${identifier.path}`);
    }
    const encodedWebId = encodeURIComponent(Buffer.from(settings.webId, 'utf-8').toString('base64'));
    settings = {...settings,
      authorizationAgent: `${this.aaBaseUrl}${encodedWebId}`,
      authorizationAgentProfile: `${this.aaBaseUrl}${encodedWebId}/profile`};
    const count = await addGeneratedResources(identifier, settings, this.resourcesGenerator, this.store);
    this.logger.info(`Added ${count} resources to ${identifier.path}`);
  }
}
