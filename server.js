require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/database');

const PORT = process.env.PORT || 3000;



// Database connection check
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  await checkDatabaseConnection();
  
  // FIXED: Only one app.listen call with 0.0.0.0 for external access
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📱 Access from phone: http://192.168.1.3:${PORT}`);
    console.log(`💻 Access from computer: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://192.168.1.3:${PORT}/health`);
    console.log(`📖 API Documentation: http://192.168.1.3:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📋 Available endpoints:');
      console.log('   POST /api/auth/register - Register user');
      console.log('   POST /api/auth/login - Login user');
      console.log('   GET  /api/products - Get products');
      console.log('   GET  /api/categories - Get categories');
      console.log('   GET  /api/users - Get users (admin)');
      console.log('\n🔥 Ready for Flutter app connection!');
    }
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});




