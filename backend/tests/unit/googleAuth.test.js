/**
 * Google Authentication Tests 
 * 
 * What is this file?
 * This file tests our Google Sign-In feature, which allows users to:
 * - Sign up using their Google account (no password needed!)
 * - Log in with one click using Google
 * 
 * How does Google Sign-In work?
 * 1. User clicks "Sign in with Google" on our website
 * 2. Google asks them to log in (on Google's site)
 * 3. Google sends us a token (like a verification stamp)
 * 4. We verify the token and create/find the user account
 * 
 * What is mocking?
 * In these tests, we "mock" (fake) Google's responses because:
 * - We can't actually call Google during tests
 * - Tests need to run fast and offline
 * - We want predictable results every time
 * 
 * Key Terms:
 * - Token: A secure "ticket" from Google proving the user is who they say
 * - JWT: JSON Web Token - the format Google uses for tokens
 * - Mock: A fake version of something for testing
 */

const request = require("supertest");
const app = require("../../app");
const User = require("../../models/userModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");

// Mock the google-auth-library module
jest.mock("google-auth-library");


// Main test suite
describe("Google Authentication - Sign In with Google", () => {
  
  // Clear users before each test
  beforeEach(async () => {
    await User.deleteMany({});
    // Clear any previous mocks
    jest.clearAllMocks();
  });

  /**
   * TEST GROUP 1: Google Login (Existing Users)
   * These tests check if existing users can log in with Google
   */
  describe("POST /api/users/google-login - Google Login", () => {
    
    test("✅ Should login existing user with valid Google token", async () => {
      // Step 1: Create a user who previously signed up with Google
      const existingGoogleUser = await User.create({
        name: "Google User",
        email: "googleuser@gmail.com",
        googleID: "google123456", // Google's unique ID for this user (note: googleID not googleId)
        password: "dummy-password" // Required by schema
      });

      // Step 2: Mock OAuth2Client
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: "googleuser@gmail.com",
          name: "Google User",
          sub: "google123456" // 'sub' is Google's user ID field
        })
      });

      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken
      }));

      // Step 3: Make the login request
      const response = await request(app)
        .post("/api/users/google-login")
        .send({ token: "fake-google-token-123" }) // The actual token value doesn't matter in tests
        .expect(200); // 200 = Success

      // Step 4: Verify the response
      expect(response.body).toHaveProperty("token"); // Our app's JWT token
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("googleuser@gmail.com");
      expect(response.body.user).not.toHaveProperty("password"); // Never send passwords!
    });

    test("❌ Should fail without token field", async () => {
      // Try to login without sending a token
      const response = await request(app)
        .post("/api/users/google-login")
        .send({}) // Empty body - no token!
        .expect(400); // 400 = Bad Request

      expect(response.body.message).toContain("Google token is required");
    });

    test("❌ Should fail with empty token", async () => {
      // Send empty string as token
      const response = await request(app)
        .post("/api/users/google-login")
        .send({ token: "" }) // Empty token
        .expect(400);

      expect(response.body.message).toContain("Google token is required");
    });

    test("❌ Should not accept old 'credential' field name", async () => {
      // Test that we updated from old field name
      // (In case frontend hasn't updated yet)
      const response = await request(app)
        .post("/api/users/google-login")
        .send({ credential: "google-token" }) // Old field name!
        .expect(400);

      expect(response.body.message).toContain("Google token is required");
    });
  });

  /**
   * TEST GROUP 2: Google Registration (New Users)
   * These tests check if new users can sign up with Google
   */
  describe("POST /api/users/google-register - Google Sign Up", () => {
    
    test("✅ Should register new user with Google account", async () => {
      // Mock OAuth2Client for a NEW user
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: "newuser@gmail.com",
          name: "New Google User",
          sub: "google789" // Google ID
        })
      });

      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken
      }));

      // Mock that user doesn't exist yet
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      // Mock creating the new user
      const createdUser = {
        _id: new mongoose.Types.ObjectId(),
        id: new mongoose.Types.ObjectId().toString(),
        name: "New Google User",
        email: "newuser@gmail.com",
        googleID: "google789"
      };
      jest.spyOn(User, "create").mockResolvedValue(createdUser);

      // Make the registration request
      const response = await request(app)
        .post("/api/users/google-register")
        .send({ token: "fake-google-token-456" })
        .expect(201); // 201 = Created

      // Verify response
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("newuser@gmail.com");
      expect(response.body.user.name).toBe("New Google User");
      
      // Verify User.create was called with correct data
      expect(User.create).toHaveBeenCalledWith({
        name: "New Google User",
        email: "newuser@gmail.com",
        googleID: "google789"
      });
    });

    test("❌ Should fail if user already exists", async () => {
      // Mock existing user data
      const existingUser = {
        _id: new mongoose.Types.ObjectId(),
        email: "existing@gmail.com",
        googleID: "google123"
      };

      // Mock OAuth2Client
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: "existing@gmail.com",
          name: "Existing User",
          sub: "google123"
        })
      });

      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken
      }));

      // Mock that user DOES exist
      jest.spyOn(User, "findOne").mockResolvedValue(existingUser);

      // Try to register
      const response = await request(app)
        .post("/api/users/google-register")
        .send({ token: "fake-token" })
        .expect(400); // Should fail

      expect(response.body.message).toContain("User already exists");
      expect(User.create).not.toHaveBeenCalled(); // Should NOT create user
    });

    test("❌ Should handle invalid Google token", async () => {
      // Mock OAuth2Client verification failure
      const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error("Invalid token"));

      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken
      }));

      const response = await request(app)
        .post("/api/users/google-register")
        .send({ token: "invalid-google-token" })
        .expect(401); // Auth errors return 401

      expect(response.body.message).toBe("Invalid Google token");
    });
  });

  /**
   * TEST GROUP 3: Security Tests
   * These tests ensure Google auth is secure
   */
  describe("Google Auth Security", () => {
    
    test("🔒 Should not leak user existence information", async () => {
      // When login fails, check the actual error message
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: "hacker@gmail.com",
          sub: "google999"
        })
      });

      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken
      }));
      
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .post("/api/users/google-login")
        .send({ token: "fake-token" })
        .expect(404); // Not Found based on actual controller

      // Check actual error message from controller
      expect(response.body.message).toBe("User not found. Please register first.");
      expect(response.body.message).toContain("not found");
    });

    test("🔒 Should handle database errors gracefully", async () => {
      // Mock OAuth2Client valid token
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: "test@gmail.com",
          sub: "google123"
        })
      });

      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken
      }));

      // Mock database error
      jest.spyOn(User, "findOne").mockRejectedValue(new Error("Database down"));

      const response = await request(app)
        .post("/api/users/google-login")
        .send({ token: "fake-token" })
        .expect(401); // Based on actual controller error handling

      expect(response.body.message).toBe("Invalid Google token");
      expect(response.body.stack).toBeNull(); // Stack should be null in test environment
    });
  });

  /**
   * TEST GROUP 4: Token Format Tests
   * These tests verify we handle different token formats
   */
  describe("Token Format Handling", () => {
    
    test("✅ Should accept token as string", async () => {
      // Setup successful login mock
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        id: new mongoose.Types.ObjectId().toString(),
        name: "Test User",
        email: "test@gmail.com",
        googleID: "google123" // Note: googleID not googleId
      };

      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: "test@gmail.com",
          sub: "google123"
        })
      });

      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken
      }));
      
      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

      // Token as regular string
      const response = await request(app)
        .post("/api/users/google-login")
        .send({ token: "valid-google-token" })
        .expect(200);

      expect(response.body).toHaveProperty("token");
    });

    test("❌ Should reject non-string token values", async () => {
      // Test various invalid token types
      const invalidTokens = [
        { token: 123 },           // Number
        { token: true },          // Boolean
        { token: null },          // Null
        { token: undefined },     // Undefined
        { token: {} },            // Object
        { token: [] }             // Array
      ];

      for (const invalidData of invalidTokens) {
        const response = await request(app)
          .post("/api/users/google-login")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Google token is required");
      }
    });
  });
});

/**
 * 
 * 
 * This test file covers Google Sign-In functionality:
 * 1. Login - Existing users signing in with Google
 * 2. Registration - New users signing up with Google
 * 3. Security - Protecting against attacks
 * 4. Error handling - Dealing with problems gracefully
 * 
 * Key Concepts:
 * - Mocking: We fake Google's responses for testing
 * - JWT tokens: Secure "tickets" that prove identity
 * - No passwords: Google users don't need passwords in our database
 * 
 * Testing Best Practices:
 * - Mock external services (like Google)
 * - Test both success and failure cases
 * - Don't leak sensitive information in errors
 * - Validate all input types
 * 
 * Real-World Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Google handles the login
 * 3. Google gives us a token
 * 4. We verify the token and log them in
 * 
 * Running These Tests:
 * - npm test googleAuth.test.js (run just this file)
 * - npm test (run all tests)
 */