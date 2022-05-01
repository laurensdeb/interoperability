# @laurensdeb/authorization-agent-css
This package contains modules and configuration for enabling the Community Solid Server to expose [UMA 2.0 (User-Managed Access)](https://docs.kantarainitiative.org/uma/wg/rec-oauth-uma-grant-2.0.html#seek-authorization) as defined in the [Solid OIDC 0.1.0 specification](https://solidproject.org/TR/2022/oidc-20220328).

## Architecture
### Authentication Modules
In order to support the UMA Access Token as authentication method, a new CredentialGroup was defined in [`Credentials.ts`](src/authentication/Credentials.ts), alongside the Credential interface which now also includes information on 
resource and access modes that are included in the UMA Access Token in order to restrict its usage.

The UmaTokenExtractor will subsequently extract any `Bearer` type token from an incoming request and attempt to verify
it against the configured UMA 2.0 Authorization Service. If verification is successful a CredentialSet is returned for
the `ticket` CredentialGroup.

### Authorization Modules
For authorization a number of modules had to be duplicated from the Community Solid Server without modification, this
was caused by the changes in [`Credentials.ts`](src/authentication/Credentials.ts). This is the case for the
[`UmaUnionPermissionReader.ts`](src/authorization/UmaUnionPermissionReader.ts), the interface in [`PermissionReader.ts`](src/authorization/PermissionReader.ts) and [`Permissions.ts`](src/authorization/permissions/Permissions.ts).

The module [`UmaPermissionBasedAuthorizer.ts`](src/authorization/UmaPermissionBasedAuthorizer.ts) was modified to use the [`UnauthorizedHttpError.ts`](src/authorization/error/UnauthorizedHttpError.ts). This error provides metadata on the
access modes which the client was missing at the time of request. It is used to provide the necessary information for
performing [UMA Permission Registration](https://docs.kantarainitiative.org/uma/rec-uma-core.html#register-permission)
with the Authorization Service.

The [`TicketPermissionReader`](src/authorization/TicketPermissionReader.ts) will match the resource in the ticket with 
the resource being authorized for. If there is a match and the ticket contains access modes, its access modes are
converted into a PermissionSet.

### Metadata Writer Module
The metadata from the [`UnauthorizedHttpError`](src/authorization/error/UnauthorizedHttpError.ts) has to be converted into a Permission Ticket and added in a `WWW-Authenticate` request header as specified in the [UMA 2.0 (User-Managed Access) specification](https://docs.kantarainitiative.org/uma/wg/rec-oauth-uma-grant-2.0.html). This header should only
be added on `401` Unauthorized error codes, so a `403` Forbidden error **will not** return the UMA Ticket.

The Ticket requires an owner WebID of the resource to be known as well, otherwise the UMA Authorization Service cannot
determine whom can authorize the specified request. For example, in the case of Interoperability-based authorization
the WebID is used to obtain the Registry Set of the client.

In order to realize this functionality the AccountStore from the Community Solid Server was extended in [`ExtendedAccountStore.ts`](src/util/ExtendedAccountStore.ts).

### UMA Client Module
A client module implementing the API for interacting with the UMA Authorization Service is used by both the Metadata
Writer Module and Authentication Modules to interact with the UMA Authorization Service. The interface of such a UMA
Client is defined in [`UmaClient.ts`](src/uma/UmaClient.ts) and could be used for tailored implementation based on the 
specifics of the UMA Authorization Service that is being used.

The implementation in [`UmaClientImpl.ts`](src/uma/UmaClientImpl.ts) is tailored to the UMA Authorization Service that is defined in [`@laurensdeb/authorization-agent-uma`](../aa-uma/), especially with respect to the JWT Access Tokens it
uses (a slight deviation from the UMA specification which assumes opaque tokens) and the permission registration
endpoint, which introduces an `owner` property in the interface.

## Configuration
In the [configuration folder](`config/`) a default configuration is defined, with seeded Pods ([http://localhost:3000/alice](http://localhost:3000/alice) and [http://localhost:3000/bob](http://localhost:3000/bob)), for starting a
Community Solid Server instance with the provided modules. A shared secret with the configuration of the Authorization
Service in [`@laurensdeb/authorization-agent-uma`](../aa-uma/) is also provided, which is used for authenticating
permission registration requests. Note that this secret should be changed if used in production.

Furthermore a template is provided for the Pods, in [`templates`](templates/), which conforms to the Solid Application
Interoperability specification and also contains some dummy data for testing purposes.

Note that while the configuration enables the use of UMA Token based authorization, it continues to support
identity-based authentication via Solid OIDC and Web Access Control. This mechanism is even used to authenticate the
Authorization Agent for discovery.