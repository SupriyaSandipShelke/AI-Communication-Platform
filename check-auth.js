// Simple script to check current authentication state
console.log('🔍 Checking authentication state...');

// Check localStorage
const token = localStorage.getItem('auth_token');
const userId = localStorage.getItem('user_id');
const username = localStorage.getItem('username');

console.log('Token exists:', !!token);
console.log('User ID:', userId);
console.log('Username:', username);

if (token && userId) {
  console.log('✅ User is authenticated');
  
  // Test API call to get chats
  fetch('/api/whatsapp/chats', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('📊 API Response:', data);
    if (data.success) {
      console.log(`✅ Found ${data.chats.length} chats:`);
      data.chats.forEach(chat => {
        console.log(`  - ${chat.name || chat.group_name || 'Unknown'} (Group: ${chat.is_group}, Members: ${chat.member_count || 0})`);
      });
    } else {
      console.error('❌ API call failed:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Network error:', error);
  });
} else {
  console.log('❌ User is not authenticated');
}