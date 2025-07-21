// utils/totusuna_config/index.js

const path = require('path');
const { loadHandlers } = require('../handlerLoader');

module.exports = {
  buttons: loadHandlers(path.join(__dirname, 'buttons')),
  modals: loadHandlers(path.join(__dirname, 'modals')),
  selects: loadHandlers(path.join(__dirname, 'selects')),
};