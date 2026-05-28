# good-sentry

[![Sponsor][sponsor-badge]][sponsor]
[![License][license-badge]][license]
![NPM Version][npm-version-badge]

[Sentry](https://sentry.io) broadcasting for [good](https://github.com/hapijs/good) process monitor.

`good-sentry` is a write stream used to send [hapi](https://github.com/hapijs/hapi) server events to a Sentry server.

## Usage

### `new GoodSentry([options])`

Creates a new GoodSentry object with the following arguments:

- `[options]` - optional configuration object with the following keys
  - `[dsn]` - Sentry project's Data Source Name. Defaults to `null`.
  - `[config]` - optional configuration object with the following keys
    - `[name]` - The name of the logger used by Sentry. Defaults to hostname.
    - `[logger]` - The name of the Sentry client. Defaults to `''`.
    - `[release]` - The version/release of your application. Defaults to `''`.
    - `[environment]` - The environment name of your application. Defaults to `''`.
  - `[captureUncaught]` - Enable global error handling. Defaults to `false`.

**Note:** `@sentry/node` uses a global singleton. Multiple `GoodSentry` instances with different DSNs are **not supported** — only the first `Sentry.init()` call takes effect.

### Tags

Because [Hapi tags](https://hapijs.com/tutorials/logging) are an array of strings and Sentry expects tags to be a k/v map, `good-sentry` sets all non-level tags to `tag: true` pairs. Those are nicely displayed in the tags section of the Sentry web interface:

### Example Usage

```javascript
const Hapi = require('hapi');
const version = require('package.json').version;
const server = new Hapi.Server();
server.connection();

const options = {
  reporters: {
    mySentryReporter: [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [{ log: '*' }],
      },
      {
        module: 'good-sentry',
        args: [
          {
            dsn: 'https://<key>:<secret>@sentry.io/<project>',
            config: {
              name: 'myAwesomeHapiServer',
              logger: 'mySentryReporter',
              release: version,
              environment: process.env.NODE_ENV,
            },
            captureUncaught: true,
          },
        ],
      },
    ],
  },
};

server.register({ register: require('good'), options }, (err) => {
  server.start(() => {
    server.log([], 'Sample debug event.');
    server.log(['debug'], 'Sample tagged debug event.');
    server.log(['info'], 'Sample info event.');
    server.log(['warning', 'server'], 'Sample warning event with tags.');
    server.log(['error', 'first-tag', 'second-tag'], 'Sample error event with tags.');
  });
});
```

## License

Released under the MIT license.

[license-badge]: https://img.shields.io/github/license/jsynowiec/good-sentry.svg
[license]: https://github.com/jsynowiec/good-sentry/blob/master/LICENSE
[sponsor-badge]: https://img.shields.io/badge/♥-Sponsor-fc0fb5.svg
[sponsor]: https://github.com/sponsors/jsynowiec
[npm-version-badge]: https://img.shields.io/npm/v/good-sentry
