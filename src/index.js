import { hostname } from 'os';
import { Writable } from 'stream';
import * as Sentry from '@sentry/node';

const internals = {
  defaults: {
    name: hostname(),
    logger: '',
    release: '',
    environment: '',
  },
};

class GoodSentry extends Writable {
  constructor({ dsn = null, config = {}, captureUncaught = false } = {}) {
    super({ objectMode: true, decodeStrings: false });

    const settings = { ...internals.defaults, ...config };
    const sentryOptions = dsn === null ? settings : { dsn, ...settings };
    if (!captureUncaught) {
      sentryOptions.integrations = (integrations) =>
        integrations.filter(
          (i) => !i.name || !['OnUncaughtException', 'OnUnhandledRejection'].includes(i.name),
        );
    }
    // captureUncaught=false filters OUT uncaught exception/rejection integrations
    // (Sentry.init() installs them by default; raven's install() opted IN)
    Sentry.init(sentryOptions);
  }

  _write(data, encoding, cb) {
    let { tags = [] } = data;
    tags = typeof tags === 'string' ? [tags] : tags;

    let level = 'debug';
    if (tags.includes('fatal')) level = 'fatal';
    else if (tags.includes('err') || tags.includes('error')) level = 'error';
    else if (tags.includes('warn') || tags.includes('warning')) level = 'warning';
    else if (tags.includes('info')) level = 'info';

    const customTags = tags
      .filter((t) => !['fatal', 'error', 'warning', 'info', 'debug'].includes(t))
      .reduce((acc, curr) => {
        acc[curr] = true;
        return acc;
      }, {});

    Sentry.captureMessage(data.data, {
      level,
      tags: customTags,
      extra: { event: data.event },
    });
    cb();
  }
}

export default GoodSentry;
