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
                    (i) =>
                        !i.name ||
                        !['OnUncaughtException', 'OnUnhandledRejection'].includes(i.name),
                );
        }
        Sentry.init(sentryOptions);
    }

    _write(data, encoding, cb) {
        let { tags = [] } = data;
        tags = typeof tags === 'string' ? [tags] : tags;

        const level = (() => {
            if (['fatal'].some((v) => tags.includes(v))) return 'fatal';
            if (['err', 'error'].some((v) => tags.includes(v))) return 'error';
            if (['warn', 'warning'].some((v) => tags.includes(v))) return 'warning';
            if (['info'].some((v) => tags.includes(v))) return 'info';
            return 'debug';
        })();

        const sentis = tags
            .filter((t) => !['fatal', 'error', 'warning', 'info', 'debug'].includes(t))
            .reduce((acc, curr) => {
                acc[curr] = true;
                return acc;
            }, {});

        Sentry.captureMessage(data.data, {
            level,
            tags: sentis,
            extra: { event: data.event },
        });
        cb();
    }
}

export default GoodSentry;
