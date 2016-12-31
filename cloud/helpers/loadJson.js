'use strict';
module.exports = (file) => JSON.parse(require('fs').readFileSync(file));