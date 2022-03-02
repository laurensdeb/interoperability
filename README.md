# Authorization Agent for Community Solid Server
This repository implements an experimental Authorization Agent for the Community Solid Server.

## Architecture
The repository is structured using multiple packages. On the one hand two logical units are formed by the 
[`authorization-agent-uma`](/packages/aa-uma) and [`authorization-agent-http`](/packages/aa-http) packages, 
these implement the necessary routes, handlers and stores for respectively the Authorization Agent, as defined
by the [Solid Application Interoperability Draft](https://solid.github.io/data-interoperability-panel/specification/),
and the UMA AS that is specified by the [Solid-OIDC specification](https://solid.github.io/solid-oidc/). Finally we
wire together the functionality provided by the components in each of these packages in the [`authorization-agent-http`](/packages/aa-http/)
module using [ComponentsJS dependency injection](https://componentsjs.readthedocs.io/en/latest/).