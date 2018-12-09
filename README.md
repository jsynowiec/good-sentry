# good-sentry

[Sentry](https://sentry.io) broadcasting for [good](https://github.com/hapijs/good) process monitor.

`good-sentry` is a write stream used to send [hapi](https://github.com/hapijs/hapi) server events to a Sentry server. 

[![Current Version](https://img.shields.io/npm/v/good-sentry.svg)](https://www.npmjs.com/package/good-sentry)
[![Build Status](https://travis-ci.org/jsynowiec/good-sentry.svg?branch=master)](https://travis-ci.org/jsynowiec/good-sentry)
[![License][badge-license]][license]

[![Donate][badge-donate]][donate]

## Usage
### `new GoodSentry ([options])`

Creates a new GoodSentry object with the following arguments:

- `[options]` - optional configuration object with the following keys
  - `[dsn]` - Sentry project's Data Source Name. Defaults to `null` but expects `SENTRY_DSN` environment variable to be set.
  - `[config]` - optional configuration object with the following keys
    - `[name]` - The name of the logger used by Sentry. Defaults to hostname. Optionally set the name using `SENTRY_NAME` environment variable.
    - `[logger]` - The name of the Sentry client. Defaults to ''.
    - `[release]` - The version/release of your application. Defaults to ''. Optionally set the release using `SENTRY_RELEASE` environment variable.
    - `[environment]` - The environment name of your application. Defaults to ''. Optionally set the environment using `SENTRY_ENVIRONMENT` environment variable.
  - `[captureUncaught]` - Enable global error handling. Defaults to `false`.

### Tags

Because [Hapi tags](https://hapijs.com/tutorials/logging) are an array of strings and Sentry expects tags to be a k/v map, `good-sentry` sets all tags associated with an event to `tag: true` pairs. Those are nicely displayed in the tags section of Sentry web interface:

![Tags in Sentry](assets/sentry-issue-tags.png)

### Example Usage

```javascript
const Hapi = require('hapi');
const version = require('package.json').version;
const server = new Hapi.Server();
server.connection();

const options = {
  reporters: {
    mySentryReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*' }],
    }, {
      module: 'good-sentry',
      args: [ {
        dsn: 'https://<key>:<secret>@sentry.io/<project>',
        config: {
          name: 'myAwesomeHapiServer',
          logger: 'mySentryReporter',
          release: version,
          environment: process.env.NODE_ENV,
        },
        captureUncaught: true,
      }],
    }],
  },
};

server.register({
    register: require('good'),
    options,
}, (err) => {
  server.start(() => {
    server.log([], 'Sample debug event.');
    server.log(['debug'], 'Sample tagged debug event.');
    server.log(['info'], 'Sample info event.');
    server.log(['warning', 'server'], 'Sample warning event with tags.');
    server.log(['error', 'first-tag', 'second-tag'], 'Sample error event with tags.');
    
    // Throw an error after 5 seconds
    setTimeout(() => {
      throw new Error('An uncaught error');
    }, 5000);
  });
});
```

This example sets up the reporter named mySentryReporter to listen for server events and send them to a Sentry project with additional settings.

## License
Released under the [MIT license](https://github.com/jsynowiec/good-sentry/blob/master/LICENSE).

[donate]: https://ko-fi.com/X8X8N42K
[badge-donate]: https://img.shields.io/badge/☕-buy%20me%20a%20coffee-46b798.svg
