// Bridge file to start the Express server
console.log("Starting Express server from C++ application...");

// Include error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit process here to allow graceful handling
});

// Import and run the server
try {
  require('./src/server.js');
  console.log("Express server successfully initialized");
} catch (error) {
  console.error("Failed to start Express server:", error);
  process.exit(1);
}

// Keep the process alive
process.stdin.resume();

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Express server shutting down...');
  process.exit(0);
}); 