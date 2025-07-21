// utils/totusuna_setti/buttons/index.js

const path = require('path');
const { loadHandlers } = require('../../handlerLoader');

// このディレクトリ内のすべてのボタンハンドラを非同期で読み込み、ハンドラ検索関数をエクスポートします。
const findHandler = loadHandlers(path.join(__dirname));

module.exports = findHandler;
