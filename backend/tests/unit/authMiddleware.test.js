const request = require("supertest");
const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const User = require("../../models/userModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  process.env.JWT_SECRET = "test-secret";

  app = express();
  app.use(express.json());
  
  app.get("/protected", authMiddleware, (req, res) => {
    res.json({ 
      message: "Access granted", 
      userId: req.user.id,
      user: req.user 
    });
  });
  
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ 
      message: err.message || "Server error" 
    });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Auth Middleware Tests", () => {
  let validToken;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});
    
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword"
    });
    
    userId = user._id;
    validToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
  });

  test("should allow access with valid Bearer token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.message).toBe("Access granted");
    expect(response.body.userId).toBe(userId.toString());
    expect(response.body.user).toHaveProperty("_id");
    expect(response.body.user).toHaveProperty("email", "test@example.com");
  });

  test("should reject request without Authorization header", async () => {
    const response = await request(app)
      .get("/protected")
      .expect(401);

    expect(response.body.message).toContain("Not authorized");
  });

  test("should reject request with missing token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer ")
      .expect(401);

    expect(response.body.message).toContain("Not authorized");
  });

  test("should reject request without Bearer prefix", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", validToken)
      .expect(401);

    expect(response.body.message).toContain("Not authorized");
  });

  test("should reject request with invalid token format", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid.token.format")
      .expect(401);

    expect(response.body.message).toContain("Not authorized");
  });

  test("should reject request with expired token", async () => {
    const expiredToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: "-1h" }
    );

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.message).toContain("Not authorized");
  });

  test("should reject request with wrong secret token", async () => {
    const wrongSecretToken = jwt.sign(
      { id: userId },
      "wrong-secret"
    );

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${wrongSecretToken}`)
      .expect(401);

    expect(response.body.message).toContain("Not authorized");
  });

  test("should reject request if user not found", async () => {
    await User.findByIdAndDelete(userId);

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(401);

    expect(response.body.message).toContain("Not authorized");
  });

  test("should reject request with malformed token", async () => {
    const malformedTokens = [
      "Bearer",
      "Bearer ",
      "Bearer null",
      "Bearer undefined",
      "Bearer {}",
      "Bearer []"
    ];

    for (const token of malformedTokens) {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", token)
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    }
  });

  test("should handle token with invalid user ID", async () => {
    const invalidUserToken = jwt.sign(
      { id: "invalid-id" },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${invalidUserToken}`)
      .expect(401);

    expect(response.body.message).toContain("Not authorized");
  });

  test("should attach user object to request", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.user).toBeDefined();
    expect(response.body.user._id).toBe(userId.toString());
    expect(response.body.user.name).toBe("Test User");
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.password).toBeUndefined();
  });

  test("should handle multiple rapid requests", async () => {
    const promises = Array(5).fill(null).map(() => 
      request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${validToken}`)
    );

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Access granted");
    });
  });

  test("should not leak sensitive information on error", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer malformed.token")
      .expect(401);

    expect(response.body.message).toBe("Not authorized, token failed.");
    expect(response.body).not.toHaveProperty("stack");
    expect(response.body).not.toHaveProperty("token");
  });
});