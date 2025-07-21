// utils/startupDiagnostics.js
const fs = require('fs');
const path = require('path');

/**
 * Bot起動時の診断レポート生成ユーティリティ
 */
class StartupDiagnostics {
  constructor() {
    this.warnings = [];
    this.errors = [];
    this.info = [];
  }

  /**
   * 必須・オプションの環境変数をチェック
   */
  checkEnvironmentVariables() {
    this.info.push('🔍 環境変数チェック開始');

    const requiredVars = ['DISCORD_TOKEN'];
    const optionalVars = ['OPENAI_API_KEY', 'GCS_BUCKET_NAME', 'GCP_PROJECT_ID'];

    let success = true;

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.errors.push(`❌ 必須環境変数が未設定: ${varName}`);
        success = false;
      } else {
        this.info.push(`✅ ${varName}: 設定済み`);
      }
    }

    for (const varName of optionalVars) {
      if (!process.env[varName]) {
        this.warnings.push(`⚠️ オプション環境変数が未設定: ${varName}（該当機能は無効）`);
      } else {
        this.info.push(`✅ ${varName}: 設定済み`);
      }
    }

    return success;
  }

  /**
   * 重要ディレクトリの存在と中身を確認
   */
  checkFileStructure() {
    this.info.push('📁 ファイル構造チェック開始');

    const criticalDirs = [
      'commands',
      'events',
      'utils',
      'utils/permissions',
      'utils/star_chat_gpt_setti',
      'utils/totusuna_setti',
    ];

    for (const dir of criticalDirs) {
      if (fs.existsSync(dir)) {
        const fileCount = fs.readdirSync(dir).length;
        this.info.push(`✅ ${dir}: ${fileCount} 個のファイル`);
      } else {
        this.warnings.push(`⚠️ ディレクトリが存在しません: ${dir}`);
      }
    }
  }

  /**
   * commands ディレクトリ配下のコマンド整合性をチェック
   */
  checkCommandFiles() {
    this.info.push('⚙️ コマンドファイルチェック開始');

    const commandDir = 'commands';
    if (!fs.existsSync(commandDir)) {
      this.errors.push('❌ commands ディレクトリが存在しません');
      return;
    }

    const files = fs.readdirSync(commandDir).filter(f => f.endsWith('.js'));

    let valid = 0;
    let invalid = 0;

    for (const file of files) {
      const filePath = path.join(commandDir, file);
      try {
        if (fs.statSync(filePath).size === 0) {
          this.warnings.push(`⚠️ 空のコマンドファイル: ${file}`);
          invalid++;
          continue;
        }

        delete require.cache[require.resolve(path.resolve(filePath))];
        const cmd = require(path.resolve(filePath));

        if (cmd?.data?.name && typeof cmd.execute === 'function') {
          valid++;
        } else {
          this.warnings.push(`⚠️ 無効なコマンド形式: ${file}`);
          invalid++;
        }
      } catch (e) {
        this.errors.push(`❌ コマンド読み込みエラー: ${file} → ${e.message}`);
        invalid++;
      }
    }

    this.info.push(`📊 コマンド統計: 有効=${valid}, 無効=${invalid}`);
  }

  /**
   * 必須・オプションパッケージの存在チェック
   */
  checkDependencies() {
    this.info.push('📦 依存パッケージチェック開始');

    const required = ['discord.js', 'dotenv'];
    const optional = ['openai', '@google-cloud/storage', 'exceljs'];

    for (const pkg of required) {
      try {
        require(pkg);
        this.info.push(`✅ ${pkg}: インストール済み`);
      } catch {
        this.errors.push(`❌ 必須パッケージが未インストール: ${pkg}`);
      }
    }

    for (const pkg of optional) {
      try {
        require(pkg);
        this.info.push(`✅ ${pkg}: インストール済み`);
      } catch {
        this.warnings.push(`⚠️ オプションパッケージが未インストール: ${pkg}（該当機能は無効）`);
      }
    }
  }

  /**
   * 診断プロセス全体を実行し、レポートを生成
   * @returns {Promise<{success: boolean, hasWarnings: boolean, errors: string[], warnings: string[], info: string[]}>}
   */
  async runDiagnostics() {
    console.log('🔬 STAR管理Bot 起動診断を開始...\n');

    this.checkEnvironmentVariables();
    this.checkFileStructure();
    this.checkCommandFiles();
    this.checkDependencies();

    console.log('\n📋 診断レポート');
    console.log('='.repeat(60));

    if (this.errors.length > 0) {
      console.log('\n❌ エラー:');
      this.errors.forEach(e => console.log('  ' + e));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告:');
      this.warnings.forEach(w => console.log('  ' + w));
    }

    if (this.info.length > 0) {
      console.log('\nℹ️ 情報:');
      this.info.forEach(i => console.log('  ' + i));
    }

    console.log('='.repeat(60));

    const success = this.errors.length === 0;
    const hasWarnings = this.warnings.length > 0;

    if (!success) {
      console.log('🚨 起動を中止してください。重大なエラーがあります。');
    } else if (hasWarnings) {
      console.log('⚠️ 起動可能ですが、注意が必要な警告があります。');
    } else {
      console.log('✅ 診断完了 - 問題は見つかりませんでした！');
    }

    return {
      success,
      hasWarnings,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
    };
  }
}

module.exports = { StartupDiagnostics };
