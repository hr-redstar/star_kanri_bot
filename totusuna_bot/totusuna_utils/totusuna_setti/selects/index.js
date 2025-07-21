// utils/totusuna_setti/selects/index.js

const path = require('path');
const { loadHandlers } = require('../../handlerLoader');

// このディレクトリ内のすべてのセレクトメニューハンドラを読み込み、ハンドラ検索関数をエクスポートします。
const findHandler = loadHandlers(path.join(__dirname));

module.exports = findHandler;