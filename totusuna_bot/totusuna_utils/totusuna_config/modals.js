// utils/totusuna_config/modals.js
const path = require('path');
const { loadHandlers } = require('../../handlerLoader.js');

const findHandler = loadHandlers(path.join(__dirname, 'modals'));

module.exports = findHandler;
