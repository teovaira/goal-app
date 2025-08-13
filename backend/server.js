const logger = require("./config/logger");

require("dotenv").config();
const connectToMongoDB = require("./config/db.js");
const app = require("./app");
const PORT = process.env.PORT || 5000;


const startServer = async () => {
  try {
    console.log('1. Attempting to connect to MongoDB...');
    await connectToMongoDB();
    console.log('2. MongoDB connected successfully');
    
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      console.log(`3. Server is running on http://localhost:${PORT}`);
      console.log('=== SERVER READY ===');
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use!`);
        console.error('Try stopping other processes or change PORT in .env');
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("ERROR: Connection to MongoDB failed: ", error.message);
    console.error("Check your MONGODB_URI and network connection");
    process.exit(1);
  }
};

startServer();
