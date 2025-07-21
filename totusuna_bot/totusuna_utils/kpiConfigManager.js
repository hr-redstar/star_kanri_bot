// utils/kpiConfigManager.js
const { configManager } = require('./configManager');

const SECTION = 'kpi';

class KpiConfigManager {
  async getShopList(guildId) {
    const config = await configManager.getSectionConfig(guildId, SECTION);
    return config.shops || [];
  }

  async addShop(guildId, shopName) {
    const shops = await this.getShopList(guildId);
    if (shops.includes(shopName)) {
      return { success: false, reason: 'duplicate' };
    }
    const newShops = [...shops, shopName];
    await configManager.updateSectionConfig(guildId, SECTION, { shops: newShops });
    return { success: true };
  }

  async getTargets(guildId) {
    const config = await configManager.getSectionConfig(guildId, SECTION);
    return config.targets || {};
  }

  async addTargets(guildId, shops, date, targetCount, setBy) {
    const currentConfig = await configManager.getSectionConfig(guildId, SECTION);
    // configManagerの内部メソッドは直接呼び出さず、公開APIを通じて操作します。
    // まず現在のtargetsを取得し、それを変更します。
    const newTargets = JSON.parse(JSON.stringify(currentConfig.targets || {}));

    for (const shop of shops) {
      if (!newTargets[shop]) {
        newTargets[shop] = [];
      }

      const idx = newTargets[shop].findIndex((t) => t.date === date);
      const newEntry = {
        date,
        target: Number(targetCount),
        setBy,
        setAt: new Date().toISOString(),
      };

      if (idx !== -1) {
        newTargets[shop][idx] = newEntry;
      } else {
        newTargets[shop].push(newEntry);
      }
    }

    await configManager.updateSectionConfig(guildId, SECTION, { targets: newTargets });
    return { success: true };
  }
}

const kpiConfigManager = new KpiConfigManager();

module.exports = { kpiConfigManager };