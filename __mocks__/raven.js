const client = {
  captureMessage: jest.fn((data, extra, cb) => {
    if (typeof cb === 'function') {
      cb();
    }
  }),
  patchGlobal: jest.fn,
};

module.exports = {
  Client: jest.fn(() => client),
};
