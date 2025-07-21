// utils/totusuna_setti/totusunaConfigManager.js
const { configManager } = require('../configManager');

const SECTION = 'totusuna';
const ARRAY_KEY = 'instances';

class TotusunaConfigManager {
  async addInstance(guildId, instanceData) {
    return configManager.addItemToArray(guildId, SECTION, ARRAY_KEY, instanceData);
  }

  async getInstance(guildId, uuid) {
    const config = await configManager.getSectionConfig(guildId, SECTION);
    const instances = config.instances ?? [];
    return instances.find(instance => instance.id === uuid) || null;
  }

  async updateInstance(guildId, uuid, updates) {
    return configManager.updateItemInArray(guildId, SECTION, ARRAY_KEY, uuid, updates, 'id');
  }

  async removeInstance(guildId, uuid) {
    return configManager.removeItemFromArray(guildId, SECTION, ARRAY_KEY, uuid, 'id');
  }

  async getAllInstances(guildId) {
    const config = await configManager.getSectionConfig(guildId, SECTION);
    return config.instances ?? [];
  }
}

const totusunaConfigManager = new TotusunaConfigManager();

module.exports = { totusunaConfigManager };