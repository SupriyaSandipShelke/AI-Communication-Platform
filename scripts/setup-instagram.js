#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📷 Instagram Business API Setup');
console.log('===============================');
console.log('');
console.log('To set up Instagram integration:');
console.log('1. Create a Facebook App at https://developers.facebook.com/');
console.log('2. Add Instagram Basic Display or Instagram Messaging product');
console.log('3. Create an Instagram Business Account');
console.log('4. Generate a Page Access Token');
console.log('5. Get your Instagram Page ID');
console.log('');

rl.question('Enter your Instagram Access Token: ', (accessToken) => {
  if (!accessToken || accessToken.trim() === '') {
    console.log('❌ Access token is required');
    rl.close();
    return;
  }

  rl.question('Enter your Instagram Page ID: ', (pageId) => {
    if (!pageId || pageId.trim() === '') {
      console.log('❌ Page ID is required');
      rl.close();
      return;
    }

    rl.question('Enter webhook verify token (create a random string): ', (verifyToken) => {
      if (!verifyToken || verifyToken.trim() === '') {
        verifyToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        console.log(`Generated verify token: ${verifyToken}`);
      }

      // Read current .env file
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Update or add Instagram configuration
      const instagramConfig = `
# Instagram Configuration  
INSTAGRAM_ACCESS_TOKEN=${accessToken.trim()}
INSTAGRAM_PAGE_ID=${pageId.trim()}
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=${verifyToken.trim()}
`;

      // Remove existing Instagram config if present
      envContent = envContent.replace(/# Instagram Configuration[\s\S]*?(?=\n#|\n[A-Z]|$)/g, '');
      
      // Add new config
      envContent += instagramConfig;

      // Write back to .env
      fs.writeFileSync(envPath, envContent);

      console.log('');
      console.log('✅ Instagram configuration saved to .env');
      console.log('');
      console.log('Next steps:');
      console.log('1. Restart your application');
      console.log('2. Configure webhook URL in Facebook App:');
      console.log('   - Webhook URL: https://yourdomain.com/api/instagram/webhook');
      console.log(`   - Verify Token: ${verifyToken.trim()}`);
      console.log('3. Subscribe to messaging events');
      console.log('4. Test the integration');
      console.log('');
      console.log('🎉 Instagram integration is ready!');
      
      rl.close();
    });
  });
});