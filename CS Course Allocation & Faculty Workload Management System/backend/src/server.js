const app = require('./app');
const config = require('./config/environment');

const PREFERRED_PORT = parseInt(config.port, 10) || 5000;
const MAX_PORT_ATTEMPTS = 10; // Try up to 10 consecutive ports before giving up

/**
 * Attempts to start the HTTP server on the given port.
 * If the port is busy (EADDRINUSE), it automatically retries on (port + 1).
 *
 * @param {number} port - The port number to attempt binding on.
 * @param {number} attempt - Current attempt count (stops at MAX_PORT_ATTEMPTS).
 */
function startServer(port, attempt = 1) {
  const server = app.listen(port);

  server.on('listening', () => {
    const actualPort = server.address().port;

    console.log('\n====================================================');
    console.log(`🚀  CS Course Allocation API  —  ONLINE`);
    console.log(`📡  Environment : ${config.nodeEnv}`);
    console.log(`🔗  API Base URL: http://localhost:${actualPort}/api/v1`);

    if (actualPort !== PREFERRED_PORT) {
      console.log(`⚠️   Port ${PREFERRED_PORT} was busy — auto-switched to ${actualPort}`);
    }

    console.log('====================================================\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (attempt >= MAX_PORT_ATTEMPTS) {
        console.error(
          `\n❌  Could not bind to any port in range ` +
          `${PREFERRED_PORT}–${PREFERRED_PORT + MAX_PORT_ATTEMPTS - 1}. ` +
          `All ports are busy. Exiting.\n`
        );
        process.exit(1);
      }

      const nextPort = port + 1;
      console.warn(
        `⚠️   Port ${port} is already in use. ` +
        `Trying port ${nextPort}… (attempt ${attempt}/${MAX_PORT_ATTEMPTS})`
      );

      // Ensure the failed server is fully closed before retrying
      server.close(() => startServer(nextPort, attempt + 1));
    } else {
      // For any other server error, log and exit
      console.error('❌  Server error:', err.message);
      process.exit(1);
    }
  });

  // Graceful Shutdown handlers
  const handleShutdown = (signal) => {
    console.log(`\n🛑  Received ${signal}. Shutting down gracefully…`);
    server.close(() => {
      console.log('✅  HTTP server closed. Goodbye.\n');
      process.exit(0);
    });

    // Force-exit if graceful shutdown takes longer than 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT',  () => handleShutdown('SIGINT'));
}

// Boot the server starting from the preferred port
startServer(PREFERRED_PORT);

