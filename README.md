# Authorization Agent & Authorization Service for Community Solid Server
[![CI/CD](https://github.com/laurensdeb/authorization-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/laurensdeb/authorization-agent/actions/workflows/ci.yml) [![codecov](https://codecov.io/gh/laurensdeb/interoperability/branch/main/graph/badge.svg?token=YNT84QJT7G)](https://codecov.io/gh/laurensdeb/interoperability)

This repository implements experimental [UMA](https://docs.kantarainitiative.org/uma/wg/rec-oauth-uma-grant-2.0.html) support for the Community Solid Server, as
to enable an Authorization Agent like defined by the [Solid Application Interoperability Draft Specification](https://solid.github.io/data-interoperability-panel/specification/) to control
authorization permissions for agents. In order to test this UMA support a basic [UMA Authorization Service](https://docs.kantarainitiative.org/uma/wg/rec-oauth-uma-grant-2.0.html#roles) API was implemented using [ComponentsJS](https://componentsjs.readthedocs.io) and [HandlersJS](https://github.com/digita-ai/handlersjs).

## Goals
The goal of this project is to (a) enable development of the [Application Interoperability specification](https://solid.github.io/data-interoperability-panel/specification/) against a
real-world Solid server implementation and (b) to realize the architecture set forth in the paper
'A Policy-Oriented Architecture for Enforcing Consent in Solid' by Debackere, Colpaert, Taelman and Verborgh of
using the Solid Data Interoperability specification to implement legal concepts under data protection legislation 
like consent.

## Structure
The repository is structured as a [Lerna monorepo](https://lerna.js.org/), where different packages are used for the different functionality domains of the project:
- [`packages/aa-css`](packages/aa-css): Modules for introducing a UMA Authorization Service as an Authorizer in the Community Solid Server (version 4.0.0).
- [`packages/aa-uma`](packages/aa-uma): Modules implementing the necessary routes and API for a UMA Authorization Service.
- [`packages/aa-http`](packages/aa-http): HTTP server application for running the UMA AS modules as a true Authorization Service.
- [`packages/aa-util`](packages/aa-util): Utility functions & classes
- [`packages/aa-interop`](packages/aa-interop): Implements modules for authorizing using the Application Interoperability specification.

## Getting started
In order to run this project you need to perform the following steps. Firstly, also ensure that you are using [`nvm`](https://github.com/nvm-sh/nvm) to manage your node version.

1. As some packages used in this project are not published to NPM but to the Github packages repository. You will
need to authenticate first using a [personal access token](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).
2. Run `npm install` in the project root
3. Run `npm run bootstrap`.

By default `npm run start` will boot up a Community Solid Server instance with UMA support alongside a UMA 
Authorization Service.