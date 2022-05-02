# @thundr-be/sai-helpers
Package defining helpers that are shared across the different packages, such as:
- Loggers, see [`src/logging`](src/logging/)
- Access Modes and related utilities, see [`src/modes`](src/modes/)
- Some generic HTTP request handlers, based on [HandlersJS](https://github.com/digita-ai/handlersjs). For example request handlers for [JWKS (JSON Web Keysets)](src/route/JwksRequestHandler.ts), [OAuth Configuration](src/route/OAuthConfigRequestHandler.ts) and a [Default 404 Route](src/route/DefaultRouteHandler.ts) are defined.
- Secrets management, defining keyholders that can be used by [`jose`](https://github.com/panva/jose) for signing JSON Web Tokens. See [`src/secrets`](src/secrets/).
