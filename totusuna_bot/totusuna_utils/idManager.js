// utils/idManager.js

const { v4: uuidv4 } = require('uuid');

class IdManager {
  constructor() {
    this.formats = {
      button: {
        star_config: (a, u) => `star_config:${a}${u ? `:${u}` : ''}`,
        star_chat_gpt_config: (a, u) => `star_chat_gpt_config:${a}${u ? `:${u}` : ''}`,
        totusuna_setti: (a, u) => (a === 'report' ? `report_totsuna_button_${u || this.generateUUID()}` : `totusuna_setti:${a}${u ? `:${u}` : ''}`),
        totusuna_config: (a, u) => `totusuna_config:${a}${u ? `:${u}` : ''}`,
        star_kpi: (a, u) => `star_kpi:${a}${u ? `:${u}` : ''}`,
      },
      modal: {
        star_config: (a, u) => `star_config_modal${a ? `_${a}` : ''}${u ? `:${u}` : ''}`,
        star_chat_gpt_config: (a, u) => `star_chat_gpt_config_modal${a ? `_${a}` : ''}${u ? `:${u}` : ''}`,
        totusuna_setti: (a, u) => `totusuna_modal_${a}${u ? `:${u}` : ''}`,
        totusuna_config: (a, u) => `totusuna_config_edit_modal${u ? `:${u}` : ''}`,
        star_kpi: (a, u) => `star_kpi:${a}${u ? `:${u}` : ''}`,
      },
      select: {
        star_config: (a, u) => `star_config:${a}${u ? `:${u}` : ''}`,
        totusuna_setti: (a, u) => `totusuna_setti:${a}${u ? `:${u}` : ''}`,
        totusuna_config: (a, u) => `totusuna_config:${a}${u ? `:${u}` : ''}`,
        star_kpi: (a, u) => `star_kpi:${a}${u ? `:${u}` : ''}`,
      },
    }
  }

  generateUUID() {
    return uuidv4();
  }

  /**
   * 汎用的なID生成関数
   * @param {'button'|'modal'|'select'} type - コンポーネントのタイプ
   * @param {string} category - 機能カテゴリ
   * @param {string} action - アクション
   * @param {string|null} [uuid=null] - UUID
   * @returns {string}
   */
  createId(type, category, action, uuid = null) {
    const formatters = this.formats[type];
    if (!formatters || !formatters[category]) {
      throw new Error(`[IdManager] Unknown ${type} category: "${category}"`);
    }
    return formatterscategory;
  }

  createButtonId(category, action, uuid = null) {
    return this.createId('button', category, action, uuid);
  }

  createModalId(category, action = '', uuid = null) {
    return this.createId('modal', category, action, uuid);
  }

  createSelectId(category, action, uuid = null) {
    return this.createId('select', category, action, uuid);
  }

  /**
   * customId を category, action, uuid に分割解析する
   * @param {string} customId
   * @returns {{category:string, action:string, uuid:string|null}|null}
   */
  parseCustomId(customId) {
    if (typeof customId !== 'string' || customId.length === 0) return null;
    // Format: report_totsuna_button_UUID
    if (customId.startsWith('report_totsuna_button_')) {
      return {
        category: 'totusuna_setti',
        action: 'report',
        uuid: customId.substring('report_totsuna_button_'.length),
      };
    }
    // Default Format: category:action:uuid
    const parts = customId.split(':');
    if (parts.length >= 2) {
      return {
        category: parts[0],
        action: parts[1],
        uuid: parts.length > 2 ? parts.slice(2).join(':') : null,
      };
    }

    return null;
  }
}

const idManager = new IdManager();

module.exports = {
  IdManager,
  idManager,
};
