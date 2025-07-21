// index.js

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // .envファイルを読み込む

// Discord Botトークンは環境変数から取得
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('⚠️ DISCORD_TOKEN が環境変数に設定されていません。');
  process.exit(1);
}

// Clientインスタンス作成（v14.21 + v15準拠）
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // メッセージ内容の取得に必要
  ],
  partials: [Partials.Channel], // 必要に応じて
});

// コマンド用コレクション（後で使うなら）
client.commands = new Collection();

// コマンド読み込み（commandsフォルダにスラッシュコマンドJSファイルがある想定）
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    // 正しいコマンドファイルかチェック
    if (command.data && typeof command.execute === 'function') {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] スラッシュコマンドの形式が不正です: ${file}`);
    }
  }
}

// ログイン成功時の処理
client.once('ready', () => {
  console.log(`🚀 Botは正常に起動しました！ Logged in as ${client.user.tag}`);
});

// インタラクション受付（スラッシュコマンドなど）
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[WARNING] コマンド ${interaction.commandName} は存在しません。`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[ERROR] コマンド ${interaction.commandName} の実行中にエラーが発生しました:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
    } else {
      await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
    }
  }
});

// Botログイン
client.login(TOKEN);
