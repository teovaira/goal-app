const request = require("supertest");
const app = require("../../app");
const User = require("../../models/userModel");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcrypt");
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

describe("User Controller Tests", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/users/register", () => {
    test("should register a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Test123!@#"
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("_id");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).not.toHaveProperty("password");

      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.password).not.toBe(userData.password);
    });

    test("should not register user with existing email", async () => {
      const existingUser = {
        name: "Existing User",
        email: "existing@example.com",
        password: await bcrypt.hash("password123", 10)
      };
      await User.create(existingUser);

      const newUser = {
        name: "New User",
        email: "existing@example.com",
        password: "NewPass123!@#"
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(newUser)
        .expect(400);

      expect(response.body.message).toContain("User already exists");
    });

    test("should validate required fields", async () => {
      const invalidData = [
        { name: "Test", password: "Test123!@#" },
        { email: "test@example.com", password: "Test123!@#" },
        { name: "Test", email: "test@example.com" }
      ];

      for (const data of invalidData) {
        const response = await request(app)
          .post("/api/users/register")
          .send(data)
          .expect(400);

        expect(response.body).toHaveProperty("message");
      }
    });

    test("should validate email format", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "Test123!@#"
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain("valid email");
    });

    test("should validate password strength", async () => {
      const weakPasswords = ["short", "12345678", "password", "Password1"];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post("/api/users/register")
          .send({
            name: "Test User",
            email: "test@example.com",
            password
          })
          .expect(400);

        expect(response.body.message).toContain("Password must");
      }
    });
  });

  describe("POST /api/users/login", () => {
    let testUser;
    const testPassword = "Test123!@#";

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword
      });
    });

    test("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: testUser.email,
          password: testPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("_id");
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty("password");

      const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decodedToken.id).toBe(testUser._id.toString());
    });

    test("should not login with invalid email", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "wrong@example.com",
          password: testPassword
        })
        .expect(401);

      expect(response.body.message).toContain("Invalid email or password");
    });

    test("should not login with invalid password", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!@#"
        })
        .expect(401);

      expect(response.body.message).toContain("Invalid email or password");
    });

    test("should validate required fields", async () => {
      const invalidData = [
        { email: "test@example.com" },
        { password: "Test123!@#" },
        {}
      ];

      for (const data of invalidData) {
        const response = await request(app)
          .post("/api/users/login")
          .send(data)
          .expect(400);

        expect(response.body.message).toContain("provide both email and password");
      }
    });
  });

  describe("GET /api/users/profile", () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: await bcrypt.hash("Test123!@#", 10)
      });
      userId = user._id;
      authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    });

    test("should get user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id", userId.toString());
      expect(response.body).toHaveProperty("name", "Test User");
      expect(response.body).toHaveProperty("email", "test@example.com");
      expect(response.body).not.toHaveProperty("password");
    });

    test("should not get profile without token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("should not get profile with invalid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("should not get profile with expired token", async () => {
      const expiredToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "-1h" }
      );

      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("should not get profile if user is deleted", async () => {
      await User.findByIdAndDelete(userId);

      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain("User not found");
    });
  });

  describe("Token Generation", () => {
    test("should generate valid JWT token", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Test123!@#"
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(201);

      const token = response.body.token;
      expect(token).toBeTruthy();
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty("id");
      expect(decoded).toHaveProperty("iat");
      expect(decoded).toHaveProperty("exp");
      
      const expirationTime = decoded.exp - decoded.iat;
      expect(expirationTime).toBe(30 * 24 * 60 * 60);
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      jest.spyOn(User, "create").mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/api/users/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "Test123!@#"
        })
        .expect(500);

      expect(response.body.message).toBeTruthy();
    });

    test("should handle malformed request body", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .set("Content-Type", "application/json")
        .send("invalid json")
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });
});