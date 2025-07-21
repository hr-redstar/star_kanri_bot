// utils/totusuna_setti/index.js

// 各インタラクションタイプのハンドラを、それぞれのindex.jsから読み込みます。
module.exports = {
  buttons: require('./buttons'),
  modals: require('./modals'),
  selects: require('./selects'),
};