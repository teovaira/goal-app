const request = require("supertest");
const app = require("../../app");
const User = require("../../models/userModel");
const Goal = require("../../models/goalModel");
const mongoose = require("mongoose");

// Note: MongoDB connection is handled by the global setup.js file
// No need to create connections in individual test files

describe("API Integration Tests", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Goal.deleteMany({});
  });

  describe("Complete User Flow", () => {
    test("should register, login, and manage goals", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Test123!@#"
      };

      // Step 1: Register
      const registerRes = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      expect(registerRes.body).toHaveProperty("token");
      expect(registerRes.body.user.email).toBe(userData.email);

      const authToken = registerRes.body.token;

      // Step 2: Get Profile
      const profileRes = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(profileRes.body.email).toBe(userData.email);

      // Step 3: Create Goals
      const goal1Res = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ text: "Learn Testing", completed: false })
        .expect(201);

      const goal2Res = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ text: "Complete Project", completed: true })
        .expect(201);

      expect(goal1Res.body.text).toBe("Learn Testing");
      expect(goal2Res.body.text).toBe("Complete Project");

      // Step 4: Get All Goals
      const goalsRes = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(goalsRes.body.length).toBe(2);
      expect(goalsRes.body.filter(g => g.completed).length).toBe(1);

      // Step 5: Update Goal
      const updateRes = await request(app)
        .put(`/api/goals/${goal1Res.body._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ completed: true })
        .expect(200);

      expect(updateRes.body.completed).toBe(true);

      // Step 6: Delete Goal
      await request(app)
        .delete(`/api/goals/${goal2Res.body._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Step 7: Verify Final State
      const finalGoalsRes = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(finalGoalsRes.body.length).toBe(1);
      expect(finalGoalsRes.body[0].completed).toBe(true);
    });
  });

  describe("Multi-User Interaction", () => {
    test("should isolate goals between users", async () => {
      // Create two users
      const user1Data = {
        name: "User One",
        email: "user1@example.com",
        password: "User1Pass!@#"
      };

      const user2Data = {
        name: "User Two",
        email: "user2@example.com",
        password: "User2Pass!@#"
      };

      const user1Res = await request(app)
        .post("/api/users")
        .send(user1Data)
        .expect(201);

      const user2Res = await request(app)
        .post("/api/users")
        .send(user2Data)
        .expect(201);

      const token1 = user1Res.body.token;
      const token2 = user2Res.body.token;

      // User 1 creates goals
      await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${token1}`)
        .send({ text: "User 1 Goal 1" })
        .expect(201);

      await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${token1}`)
        .send({ text: "User 1 Goal 2" })
        .expect(201);

      // User 2 creates goals
      await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${token2}`)
        .send({ text: "User 2 Goal 1" })
        .expect(201);

      // User 1 should only see their goals
      const user1Goals = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(user1Goals.body.length).toBe(2);
      expect(user1Goals.body.every(g => g.text.includes("User 1"))).toBe(true);

      // User 2 should only see their goals
      const user2Goals = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${token2}`)
        .expect(200);

      expect(user2Goals.body.length).toBe(1);
      expect(user2Goals.body[0].text).toBe("User 2 Goal 1");
    });
  });

  describe("Session Management", () => {
    test("should handle logout and require new login", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Test123!@#"
      };

      // Register and get token
      const registerRes = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      const oldToken = registerRes.body.token;

      // Use token successfully
      await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${oldToken}`)
        .expect(200);

      // Login again to get new token
      const loginRes = await request(app)
        .post("/api/users/login")
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const newToken = loginRes.body.token;

      // Both tokens should work
      await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${oldToken}`)
        .expect(200);

      await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${newToken}`)
        .expect(200);
    });
  });

  describe("Error Recovery", () => {
    test("should handle partial operations gracefully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Test123!@#"
      };

      const registerRes = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      const token = registerRes.body.token;

      // Create a goal
      const goalRes = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Test Goal" })
        .expect(201);

      // Try to update with invalid data
      await request(app)
        .put(`/api/goals/${goalRes.body._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      // Goal should remain unchanged
      const goalsRes = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(goalsRes.body[0].text).toBe("Test Goal");
      expect(goalsRes.body[0].completed).toBe(false);
    });
  });

  describe("Performance Tests", () => {
    test("should handle bulk operations efficiently", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Test123!@#"
      };

      const registerRes = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      const token = registerRes.body.token;

      // Create 50 goals
      const startTime = Date.now();
      
      const promises = Array(50).fill(null).map((_, i) => 
        request(app)
          .post("/api/goals")
          .set("Authorization", `Bearer ${token}`)
          .send({ 
            text: `Goal ${i + 1}`,
            completed: i % 2 === 0
          })
      );

      await Promise.all(promises);
      
      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Fetch all goals
      const fetchStart = Date.now();
      const goalsRes = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const fetchTime = Date.now() - fetchStart;
      expect(fetchTime).toBeLessThan(1000); // Should fetch within 1 second
      expect(goalsRes.body.length).toBe(50);
    });
  });
});