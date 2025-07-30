const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.test" }); 
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); 
  const uri = mongo.getUri(); 
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany(); 
  }
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop(); 
  }
  await mongoose.connection.close(); 
});
