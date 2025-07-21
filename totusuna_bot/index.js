// index.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { unifiedHandler } = require('./utils/unifiedInteractionHandler');
const logger = require('./utils/logger');
const { DataMigration } = require('./utils/dataMigration');
const { logAndReplyError } = require('./utils/errorHelper');
const { StartupDiagnostics } = require('./utils/startupDiagnostics');

// --- クライアント初期化 ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

/**
 * メイン処理：起動診断 → コマンド読み込み → Discordへログイン
 */
async function main() {
  // 1. 起動診断を実行
  const diagnostics = new StartupDiagnostics();
  const { success } = await diagnostics.runDiagnostics();

  if (!success) {
    logger.error('❌ 起動診断に失敗しました。Botの起動を中止します。');
    process.exit(1);
  }

  // 2. コマンドを読み込む
  loadAllCommands();

  // 3. Discord にログイン
  client.login(process.env.DISCORD_TOKEN);
}

// --- コマンド読み込み ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

/**
 * ディレクトリからコマンドファイルを再帰的に読み込む
 * @param {string} dir 
 * @returns {string[]} ファイルパス一覧
 */
function loadCommandFiles(dir) {
  const commandFilePaths = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      commandFilePaths.push(...loadCommandFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      commandFilePaths.push(fullPath);
    }
  }
  return commandFilePaths;
}

function loadAllCommands() {
  try {
    const commandFiles = loadCommandFiles(commandsPath);
    for (const filePath of commandFiles) {
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        logger.warn(
          `[コマンド読み込み] ${filePath} に "data" または "execute" プロパティが見つかりませんでした。`
        );
      }
    }
    logger.info(`[コマンド読み込み] ${client.commands.size} 件のコマンドを読み込みました。`);
  } catch (error) {
    logger.error('[コマンド読み込み] コマンドの読み込みに失敗しました。', { error });
    process.exit(1);
  }
}

// --- イベントハンドラ ---
client.once('ready', async () => {
  logger.info(`✅ ログイン完了: ${client.user.tag}`);

  try {
    // データマイグレーションを実行
    const migration = new DataMigration();
    await migration.migrateAllGuilds(client);
  } catch (error) {
    logger.error('[マイグレーション] 起動時のデータマイグレーション中にエラーが発生しました。', { error });
  }

  logger.info('🚀 Botの起動が完了しました！');
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`コマンド '${interaction.commandName}' が見つかりません。`, {
        commandName: interaction.commandName,
        user: interaction.user.tag,
      });
      await interaction
        .reply({
          content: '❌ このコマンドは存在しないか、現在利用できません。',
          ephemeral: true,
        })
        .catch((e) => logger.error('存在しないコマンドへの返信に失敗しました。', { error: e }));
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`[コマンド実行] '${interaction.commandName}' の実行中にエラーが発生しました。`, { error });
      await logAndReplyError(interaction, error, 'コマンドの実行中に予期せぬエラーが発生しました。');
    }
  } else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
    try {
      await unifiedHandler.handleInteraction(interaction);
    } catch (error) {
      logger.error(`[コンポーネント処理] '${interaction.customId}' の処理中にエラーが発生しました。`, { error });
      await logAndReplyError(interaction, error, 'コンポーネントの操作中に予期せぬエラーが発生しました。');
    }
  }
});

// --- グローバル例外処理 ---
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection（未処理のPromiseエラー）:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception（予期しない例外）:', { error });
  process.exit(1);
});

// --- 優雅な終了処理 ---
const handleShutdown = (signal) => {
  logger.info(`📴 シグナル ${signal} を受信。Botを安全にシャットダウンします...`);
  client.destroy();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// --- Bot 起動 ---
main();
