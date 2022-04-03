# UMA Authorization Service
This package implements a UMA Authorization Service as defined
by the [User-Managed Access (UMA) 2.0 Grant for OAuth 2.0 Authorization specification](https://docs.kantarainitiative.org/uma/wg/rec-oauth-uma-grant-2.0.html#seek-authorization).

## Details
This package uses the [Components.JS semantic dependency injection framework](https://componentsjs.readthedocs.io/en/latest/) in TypeScript, 
along with Digita's [HandlersJS library](https://github.com/digita-ai/handlersjs).

## Configurations
A default configuration for ComponentsJS dependency injection is provided in [`config/default.json`](config/default.json).

## Known limitations
### Unused parameters in token request
For token requests with grant_type `urn:ietf:params:oauth:grant-type:uma-ticket`, the token endpoint will ignore paramters `pct` and `scope` defined as optional in section 3.3.1 of the specification.

### Error messages are not specification compliant
The error messages returned by the UMA endpoint aren't in sync with the UMA specification. An issue exists to track this.