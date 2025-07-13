const mongoose = require("mongoose");

const connectionToMongoDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connection to MongoDB established: ${connect.connection.host}`);
  } catch (error) {
    console.error("Connection to MongoDB failed: ", error.message);
    process.exit(1);
  }
};

module.exports = connectionToMongoDB;