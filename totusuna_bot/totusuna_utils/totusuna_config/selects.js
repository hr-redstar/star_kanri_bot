// utils/totusuna_config/selects.js
const path = require('path');
const { loadHandlers } = require('../../handlerLoader.js');

const findHandler = loadHandlers(path.join(__dirname, 'selects'));

module.exports = findHandler;
