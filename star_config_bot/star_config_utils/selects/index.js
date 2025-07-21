// utils/star_config/selects/index.js

const path = require('path');
const { loadHandlers } = require('../../handlerLoader');

const findHandler = loadHandlers(path.join(__dirname));

module.exports = findHandler;
