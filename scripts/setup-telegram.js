#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Telegram Bot Setup');
console.log('====================');
console.log('');
console.log('To set up Telegram integration:');
console.log('1. Message @BotFather on Telegram');
console.log('2. Create a new bot with /newbot');
console.log('3. Choose a name and username for your bot');
console.log('4. Copy the bot token provided by BotFather');
console.log('');

rl.question('Enter your Telegram Bot Token: ', (botToken) => {
  if (!botToken || botToken.trim() === '') {
    console.log('❌ Bot token is required');
    rl.close();
    return;
  }

  rl.question('Enter webhook URL (optional, leave empty for polling): ', (webhookUrl) => {
    // Read current .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add Telegram configuration
    const telegramConfig = `
# Telegram Configuration
TELEGRAM_BOT_TOKEN=${botToken.trim()}
TELEGRAM_WEBHOOK_URL=${webhookUrl.trim()}
`;

    // Remove existing Telegram config if present
    envContent = envContent.replace(/# Telegram Configuration[\s\S]*?(?=\n#|\n[A-Z]|$)/g, '');
    
    // Add new config
    envContent += telegramConfig;

    // Write back to .env
    fs.writeFileSync(envPath, envContent);

    console.log('');
    console.log('✅ Telegram configuration saved to .env');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your application');
    console.log('2. Your bot will start polling for messages automatically');
    console.log('3. Users can now message your bot on Telegram');
    
    if (webhookUrl.trim()) {
      console.log('4. Configure your webhook URL in your hosting environment');
    }
    
    console.log('');
    console.log('🎉 Telegram integration is ready!');
    
    rl.close();
  });
});