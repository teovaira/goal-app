/**
 * Authentication Middleware Tests
 * 
 * What is this file?
 * This file tests our authentication middleware - the code that checks if users
 * are logged in before they can access protected parts of our app.
 * 
 * What is middleware?
 * Middleware is code that runs BETWEEN a request coming in and the response going out.
 * Think of it like a security guard checking IDs at a door.
 * 
 * What does our auth middleware do?
 * 1. Checks if the user sent a token (like an ID card)
 * 2. Verifies the token is valid
 * 3. Finds the user in the database
 * 4. Lets them through if everything is OK
 * 
 * Why test it?
 * - To ensure only logged-in users can access protected routes
 * - To make sure invalid tokens are rejected
 * - To verify error messages don't leak sensitive info
 */

const request = require("supertest");
const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const User = require("../../models/userModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");


let testApp; // Our test Express app

// This runs once before ALL tests
beforeAll(async () => {
  // JWT secret is already set in .env.test file

  // Create a simple test app with one protected route
  testApp = express();
  testApp.use(express.json()); // To parse JSON requests
  
  // Protected test route - requires authentication
  testApp.get("/protected", authMiddleware, (req, res) => {
    // If we get here, the user passed authentication!
    res.json({ 
      message: "You are authenticated!", 
      userId: req.user.id // The middleware adds user info to req
    });
  });
  
  // Error handler for our test app
  testApp.use((error, req, res, next) => {
    // Check if status was already set by middleware
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
      message: error.message || "Something went wrong"
    });
  });
});

// Main test group
describe("Authentication Middleware", () => {
  let validToken; // Will store a valid token for testing
  let testUserId; // Will store the test user's ID

  // This runs before EACH test
  beforeEach(async () => {
    // Clear all users to start fresh
    await User.deleteMany({});
    
    // Create a test user
    const testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "already-hashed-password" // In real app, this would be hashed
    });
    
    testUserId = testUser._id;
    
    // Create a valid token for this user
    // JWT tokens contain user info and are signed with a secret
    validToken = jwt.sign(
      { id: testUserId }, // What goes in the token
      process.env.JWT_SECRET // Secret key to sign it
    );
  });

  /**
   * Test Group 1: Happy Path (Everything Works)
   * These tests check that the middleware works correctly when given valid input
   */
  describe("Success Cases - When Everything is Correct", () => {
    test("✅ Should allow access when user has valid token", async () => {
      // Make a request with a valid token
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", `Bearer ${validToken}`) // Send token in header
        .expect(200); // Should succeed with status 200

      // Check the response
      expect(response.body.message).toBe("You are authenticated!");
      expect(response.body.userId).toBe(testUserId.toString());
    });

    test("✅ Should add user information to the request", async () => {
      // The middleware should fetch the full user object and add it to req.user
      // Let's create a route that returns the user info to test this
      testApp.get("/test-user-info", authMiddleware, (req, res) => {
        res.json({ user: req.user });
      });

      const response = await request(testApp)
        .get("/test-user-info")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      // Verify user info was added
      expect(response.body.user).toHaveProperty("_id");
      expect(response.body.user).toHaveProperty("email", "test@example.com");
      expect(response.body.user).not.toHaveProperty("password"); // Password should be hidden!
    });
  });

  /**
   * Test Group 2: No Token Provided
   * What happens when users forget to send their token?
   */
  describe("Missing Token Cases", () => {
    test("❌ Should reject request without Authorization header", async () => {
      // No Authorization header at all
      const response = await request(testApp)
        .get("/protected")
        // Notice: no .set("Authorization", ...) here
        .expect(401); // 401 = Unauthorized

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should reject request with empty Authorization header", async () => {
      // Authorization header exists but is empty
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", "") // Empty string
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should reject request with 'Bearer' but no token", async () => {
      // Has "Bearer " but forgot the actual token
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", "Bearer ") // Notice the space but no token
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  /**
   * Test Group 3: Invalid Token Format
   * What happens with badly formatted tokens?
   */
  describe("Invalid Token Format Cases", () => {
    test("❌ Should reject token without 'Bearer' prefix", async () => {
      // Sending just the token without "Bearer" prefix
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", validToken) // Missing "Bearer " prefix
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should reject completely invalid token", async () => {
      // Random string that's not a JWT token
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", "Bearer this-is-not-a-valid-jwt-token")
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should reject malformed tokens", async () => {
      // Various bad token formats
      const badTokens = [
        "Bearer null",
        "Bearer undefined", 
        "Bearer [object Object]",
        "Bearer 123" // Too short to be valid JWT
      ];

      // Test each bad token
      for (const badToken of badTokens) {
        const response = await request(testApp)
          .get("/protected")
          .set("Authorization", badToken)
          .expect(401);

        expect(response.body.message).toContain("Not authorized");
      }
    });
  });

  /**
   * Test Group 4: Token Security Issues
   * What happens with expired or incorrectly signed tokens?
   */
  describe("Token Security Cases", () => {
    test("❌ Should reject expired token", async () => {
      // Create a token that expired 1 hour ago
      const expiredToken = jwt.sign(
        { id: testUserId },
        process.env.JWT_SECRET,
        { expiresIn: "-1h" } // Negative time = already expired
      );

      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should reject token signed with wrong secret", async () => {
      // Token signed with different secret (like someone trying to fake a token)
      const fakeToken = jwt.sign(
        { id: testUserId },
        "wrong-secret-key" // Not our real secret!
      );

      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  /**
   * Test Group 5: Database Issues
   * What if the user in the token doesn't exist anymore?
   */
  describe("User Not Found Cases", () => {
    test("❌ Should reject if user was deleted after getting token", async () => {
      // User logs in and gets a token, but then their account is deleted
      await User.findByIdAndDelete(testUserId);

      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should reject token with non-existent user ID", async () => {
      // Token with fake user ID that was never in database
      const fakeUserId = new mongoose.Types.ObjectId();
      const tokenWithFakeUser = jwt.sign(
        { id: fakeUserId },
        process.env.JWT_SECRET
      );

      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", `Bearer ${tokenWithFakeUser}`)
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  /**
   * Test Group 6: Security Best Practices
   * Making sure we don't leak sensitive information
   */
  describe("Security Best Practices", () => {
    test("🔒 Should not reveal why authentication failed", async () => {
      // We don't want to tell attackers exactly what went wrong
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", "Bearer invalid.token.here")
        .expect(401);

      // Should have generic message, not specific details
      expect(response.body.message).toBe("Not authorized, token failed.");
      
      // Should NOT include these sensitive details
      expect(response.body).not.toHaveProperty("stack"); // No error stack traces
      expect(response.body).not.toHaveProperty("token"); // Don't echo the token back
    });

    test("🔒 Should handle multiple requests without issues", async () => {
      // Make sure the middleware can handle many requests at once
      // This tests for race conditions or memory leaks
      
      // Create 5 requests at the same time
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(testApp)
            .get("/protected")
            .set("Authorization", `Bearer ${validToken}`)
        );
      }

      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("You are authenticated!");
      });
    });
  });
});

/**
 * 
 * 
 * This test file ensures our authentication middleware works correctly by testing:
 * 1. ✅ Happy path - valid tokens work
 * 2. ❌ Missing tokens are rejected  
 * 3. ❌ Invalid token formats are rejected
 * 4. ❌ Expired or fake tokens are rejected
 * 5. ❌ Deleted users can't access protected routes
 * 6. 🔒 Security best practices are followed
 * 
 * Key Testing Concepts Used:
 * - beforeAll/afterAll: Setup and cleanup that runs once
 * - beforeEach: Setup that runs before each individual test
 * - describe(): Groups related tests together
 * - test() or it(): Individual test cases
 * - expect(): Assertions to verify behavior
 * - Mocking: Using fake database and test app instead of real ones
 * 
 * Running These Tests:
 * - npm test -- authMiddleware.test.js (run just this file)
 * - npm test (run all tests)
 */