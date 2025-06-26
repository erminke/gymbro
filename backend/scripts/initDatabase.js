const db = require('../database');

// Initialize database with sample data (optional)
async function initDatabase() {
  try {
    console.log('🔧 Initializing database...');
    
    // Database is automatically initialized when the DatabaseManager is instantiated
    console.log('✅ Database initialization complete!');
    console.log('📋 Available tables: users, user_data');
    console.log('🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = { initDatabase };
