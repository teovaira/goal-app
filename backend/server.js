const logger = require("./config/logger");

require("dotenv").config();
const connectToMongoDB = require("./config/db.js");
const app = require("./app");
const PORT = process.env.PORT;

const startServer = async () => {
  try {
    await connectToMongoDB();
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Connection to MongoDB failed: ", error.message);
    process.exit(1);
  }
};

startServer();
