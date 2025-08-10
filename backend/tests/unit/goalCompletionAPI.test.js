const request = require("supertest");
const app = require("../../app");
const Goal = require("../../models/goalModel");
const User = require("../../models/userModel");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

let mongoServer;
let authToken;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  process.env.JWT_SECRET = "test-secret";
  
  userId = new mongoose.Types.ObjectId();
  authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Goal Controller - Completion Feature", () => {
  beforeEach(async () => {
    await Goal.deleteMany({});
    await User.deleteMany({});
    
    await User.create({
      _id: userId,
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword"
    });
  });

  describe("POST /api/goals", () => {
    test("should create goal with completed field", async () => {
      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          text: "New goal with completion",
          completed: true
        })
        .expect(201);

      expect(response.body.text).toBe("New goal with completion");
      expect(response.body.completed).toBe(true);
      expect(response.body.user).toBe(userId.toString());
    });

    test("should create goal with default completed as false", async () => {
      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          text: "New goal without completion"
        })
        .expect(201);

      expect(response.body.text).toBe("New goal without completion");
      expect(response.body.completed).toBe(false);
    });
  });

  describe("PUT /api/goals/:id", () => {
    let goalId;

    beforeEach(async () => {
      const goal = await Goal.create({
        text: "Original goal",
        user: userId,
        completed: false
      });
      goalId = goal._id;
    });

    test("should update only completed field", async () => {
      const response = await request(app)
        .put(`/api/goals/${goalId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          completed: true
        })
        .expect(200);

      expect(response.body.completed).toBe(true);
      expect(response.body.text).toBe("Original goal");
    });

    test("should update only text field", async () => {
      const response = await request(app)
        .put(`/api/goals/${goalId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          text: "Updated goal text"
        })
        .expect(200);

      expect(response.body.text).toBe("Updated goal text");
      expect(response.body.completed).toBe(false);
    });

    test("should update both text and completed fields", async () => {
      const response = await request(app)
        .put(`/api/goals/${goalId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          text: "Updated goal",
          completed: true
        })
        .expect(200);

      expect(response.body.text).toBe("Updated goal");
      expect(response.body.completed).toBe(true);
    });

    test("should reject update with no fields", async () => {
      const response = await request(app)
        .put(`/api/goals/${goalId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain("Please provide at least one field to update");
    });

    test("should toggle completion status", async () => {
      let response = await request(app)
        .put(`/api/goals/${goalId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completed: true })
        .expect(200);

      expect(response.body.completed).toBe(true);

      response = await request(app)
        .put(`/api/goals/${goalId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completed: false })
        .expect(200);

      expect(response.body.completed).toBe(false);
    });
  });

  describe("GET /api/goals", () => {
    beforeEach(async () => {
      await Goal.create([
        { text: "Goal 1", user: userId, completed: true },
        { text: "Goal 2", user: userId, completed: false },
        { text: "Goal 3", user: userId, completed: true }
      ]);
    });

    test("should return goals with completed field", async () => {
      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty("completed");
      expect(response.body.filter(g => g.completed).length).toBe(2);
      expect(response.body.filter(g => !g.completed).length).toBe(1);
    });
  });
});