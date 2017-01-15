/* eslint-disable no-param-reassign */

const hostname = require('os').hostname;
const hoek = require('hoek');
const Stream = require('stream');
const Raven = require('raven');

const internals = {
  defaults: {
    name: hostname(),
    logger: '',
    release: '',
    environment: '',
  },
};

class GoodSentry extends Stream.Writable {
  constructor({ dsn = null, config = {}, captureUncaught = false } = {}) {
    super({ objectMode: true, decodeStrings: false });

    const settings = hoek.applyToDefaults(internals.defaults, config);
    const args = (dsn === null) ? [settings] : [dsn, settings];

    this._client = Raven.config(...args);
    if (captureUncaught) {
      this._client.install();
    }
  }
  _write(data, encoding, cb) {
    const extra = {
      level: ((tags = []) => {
        tags = (typeof tags === 'string') ? [tags] : tags;
        if (hoek.contain(tags, ['fatal'], { part: true })) {
          return 'fatal';
        } else if (hoek.contain(tags, ['err', 'error'], { part: true })) {
          return 'error';
        } else if (hoek.contain(tags, ['warn', 'warning'], { part: true })) {
          return 'warning';
        } else if (hoek.contain(tags, ['info'], { part: true })) {
          return 'info';
        }

        return 'debug';
      })(data.tags),
      extra: {
        event: data.event,
        tags: data.tags || [],
      },
    };

    this._client.captureMessage(data.data, extra, () => cb());
  }
}

module.exports = GoodSentry;
