const request = require("supertest");
const app = require("../../app");
const Goal = require("../../models/goalModel");
const User = require("../../models/userModel");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  process.env.JWT_SECRET = "test-secret";
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Goal Controller - Complete Tests", () => {
  let user1Token, user2Token;
  let user1Id, user2Id;

  beforeEach(async () => {
    await Goal.deleteMany({});
    await User.deleteMany({});

    const user1 = await User.create({
      name: "User 1",
      email: "user1@example.com",
      password: "hashedpassword"
    });
    
    const user2 = await User.create({
      name: "User 2",
      email: "user2@example.com",
      password: "hashedpassword"
    });

    user1Id = user1._id;
    user2Id = user2._id;
    user1Token = jwt.sign({ id: user1Id }, process.env.JWT_SECRET);
    user2Token = jwt.sign({ id: user2Id }, process.env.JWT_SECRET);
  });

  describe("DELETE /api/goals/:id", () => {
    let goalId;

    beforeEach(async () => {
      const goal = await Goal.create({
        text: "Goal to delete",
        user: user1Id,
        completed: false
      });
      goalId = goal._id;
    });

    test("should delete own goal successfully", async () => {
      const response = await request(app)
        .delete(`/api/goals/${goalId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.message).toBe("Goal successfully deleted.");
      expect(response.body.goal).toHaveProperty("_id");

      const deletedGoal = await Goal.findById(goalId);
      expect(deletedGoal).toBeNull();
    });

    test("should not delete another user's goal", async () => {
      const response = await request(app)
        .delete(`/api/goals/${goalId}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.message).toContain("Not authorized to delete this goal");

      const goal = await Goal.findById(goalId);
      expect(goal).toBeTruthy();
    });

    test("should handle non-existent goal", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/goals/${fakeId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body.message).toContain("Goal not found");
    });

    test("should handle invalid goal ID format", async () => {
      const response = await request(app)
        .delete("/api/goals/invalid-id")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.message).toContain("Invalid goal id");
    });

    test("should require authentication", async () => {
      const response = await request(app)
        .delete(`/api/goals/${goalId}`)
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  describe("Authorization Tests", () => {
    let user1Goal, user2Goal;

    beforeEach(async () => {
      user1Goal = await Goal.create({
        text: "User 1 Goal",
        user: user1Id
      });
      
      user2Goal = await Goal.create({
        text: "User 2 Goal",
        user: user2Id
      });
    });

    test("should only return own goals in GET /api/goals", async () => {
      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].text).toBe("User 1 Goal");
      expect(response.body[0].user).toBe(user1Id.toString());
    });

    test("should not update another user's goal", async () => {
      const response = await request(app)
        .put(`/api/goals/${user2Goal._id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ text: "Hacked!" })
        .expect(403);

      expect(response.body.message).toContain("Not authorized to update this goal");

      const goal = await Goal.findById(user2Goal._id);
      expect(goal.text).toBe("User 2 Goal");
    });
  });

  describe("Input Validation", () => {
    test("should validate goal text length", async () => {
      const longText = "a".repeat(1001);
      
      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ text: longText })
        .expect(400);

      expect(response.body.message).toBeTruthy();
    });

    test("should trim whitespace from goal text", async () => {
      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ text: "  Trimmed Goal  " })
        .expect(201);

      expect(response.body.text).toBe("Trimmed Goal");
    });

    test("should not create goal with empty text after trimming", async () => {
      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ text: "   " })
        .expect(400);

      expect(response.body.message).toContain("Please add a text field");
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      jest.spyOn(Goal, "find").mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(500);

      expect(response.body.message).toBeTruthy();
      Goal.find.mockRestore();
    });

    test("should handle malformed request body", async () => {
      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .set("Content-Type", "application/json")
        .send("invalid json")
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("Pagination and Filtering", () => {
    beforeEach(async () => {
      const goals = Array(15).fill(null).map((_, i) => ({
        text: `Goal ${i + 1}`,
        user: user1Id,
        completed: i % 2 === 0
      }));
      
      await Goal.create(goals);
    });

    test("should return all goals without pagination", async () => {
      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.length).toBe(15);
    });

    test("should return goals sorted by creation date", async () => {
      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      const dates = response.body.map(g => new Date(g.createdAt));
      const sortedDates = [...dates].sort((a, b) => a - b);
      
      expect(dates).toEqual(sortedDates);
    });
  });

  describe("Concurrent Operations", () => {
    test("should handle concurrent goal creation", async () => {
      const promises = Array(5).fill(null).map((_, i) => 
        request(app)
          .post("/api/goals")
          .set("Authorization", `Bearer ${user1Token}`)
          .send({ text: `Concurrent Goal ${i}` })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
      });

      const goals = await Goal.find({ user: user1Id });
      expect(goals.length).toBe(5);
    });

    test("should handle concurrent updates to same goal", async () => {
      const goal = await Goal.create({
        text: "Original",
        user: user1Id,
        completed: false
      });

      const promises = [
        request(app)
          .put(`/api/goals/${goal._id}`)
          .set("Authorization", `Bearer ${user1Token}`)
          .send({ text: "Update 1" }),
        request(app)
          .put(`/api/goals/${goal._id}`)
          .set("Authorization", `Bearer ${user1Token}`)
          .send({ completed: true })
      ];

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const finalGoal = await Goal.findById(goal._id);
      expect(finalGoal).toBeTruthy();
    });
  });
});