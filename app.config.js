// Extends app.json. WEB_BASE is set when the web build is hosted under a sub-path
// (GitHub Pages serves this repo at /spotty).
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.WEB_BASE || '' },
});
