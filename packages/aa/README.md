# @thundr-be/sai-aa
This package contains an implementation of:
1. The API routes of the Authorization Agent as defined in the Solid Application Interoperability specification.
2. An [Authorizer](../interfaces/src/uma/Authorizer.ts) module conformant to the interface designed in `@thundr-be/sai-interfaces` for authorizing incoming requests using the Access Grants and Data Grants persisted in the Registry Set of the Pod Owner.

It is implemented using the ComponentsJS semantic dependency injection framework, using the generic library [HandlersJS](https://github.com/digita-ai/handlersjs)

## Configuration
In the [configuration folder](`config/`) a default configuration is defined for exposing a [NodeHttpServer](https://github.com/digita-ai/handlersjs/blob/develop/packages/handlersjs-http/lib/servers/node/node-http-server.ts) which implements the API routes of the Authorization Agent, as defined in the Solid Application Interoperability specification under [section 7.1.2](https://solid.github.io/data-interoperability-panel/specification/#agent-registration-discovery).