// utils/validator.js

/**
 * 英数字・アンダースコア・ハイフンのみ許可（ファイル名やcustomIdなどに使用）
 * 空文字・パス記号・ディレクトリ移動・記号文字は禁止
 * @param {string} str
 * @returns {boolean}
 */
function isSafeName(str) {
  return typeof str === 'string'
    && str.length > 0
    && /^[a-zA-Z0-9_-]+$/.test(str)
    && !/[./\\]/.test(str); // ドット・スラッシュ・バックスラッシュをまとめて禁止
}

/**
 * UUIDv4 形式か判定（xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx）
 * @param {string} str
 * @returns {boolean}
 */
function isUUID(str) {
  return typeof str === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * 数値文字列（整数・小数・符号付き）か判定
 * @param {string} str
 * @returns {boolean}
 */
function isNumeric(str) {
  return typeof str === 'string'
    && str.trim() !== ''
    && !isNaN(Number(str));
}

module.exports = {
  isSafeName,
  isUUID,
  isNumeric,
};
