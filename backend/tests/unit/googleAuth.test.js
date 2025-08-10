/**
 * Google Authentication Tests - Junior Friendly Version
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
const { MongoMemoryServer } = require("mongodb-memory-server");

// Tell Jest we want to mock (fake) the passport config
// This prevents actual Google API calls during tests
jest.mock("../../config/passport");

// Test database setup
let testDatabase;

// This runs once before ALL tests
beforeAll(async () => {
  // Create temporary test database
  testDatabase = await MongoMemoryServer.create();
  const databaseUrl = testDatabase.getUri();
  await mongoose.connect(databaseUrl);
  process.env.JWT_SECRET = "test-secret-key";
});

// This runs once after ALL tests
afterAll(async () => {
  await mongoose.disconnect();
  await testDatabase.stop();
});

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
  describe("POST /api/users/google-auth - Google Login", () => {
    
    test("✅ Should login existing user with valid Google token", async () => {
      // Step 1: Create a user who previously signed up with Google
      const existingGoogleUser = await User.create({
        name: "Google User",
        email: "googleuser@gmail.com",
        googleId: "google123456", // Google's unique ID for this user
        // Note: No password field for Google users!
      });

      // Step 2: Mock what Google's token contains
      const mockGoogleTokenData = {
        email: "googleuser@gmail.com",
        name: "Google User", 
        sub: "google123456" // 'sub' is Google's user ID field
      };

      // Step 3: Mock (fake) the JWT verification
      // This simulates Google's token being valid
      jest.spyOn(jwt, "verify").mockReturnValue(mockGoogleTokenData);

      // Step 4: Mock finding the user in database
      jest.spyOn(User, "findOne").mockResolvedValue(existingGoogleUser);

      // Step 5: Make the login request
      const response = await request(app)
        .post("/api/users/google-auth")
        .send({ token: "fake-google-token-123" }) // The actual token value doesn't matter in tests
        .expect(200); // 200 = Success

      // Step 6: Verify the response
      expect(response.body).toHaveProperty("token"); // Our app's JWT token
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("googleuser@gmail.com");
      expect(response.body.user).not.toHaveProperty("password"); // Never send passwords!
    });

    test("❌ Should fail without token field", async () => {
      // Try to login without sending a token
      const response = await request(app)
        .post("/api/users/google-auth")
        .send({}) // Empty body - no token!
        .expect(400); // 400 = Bad Request

      expect(response.body.message).toContain("Google token is required");
    });

    test("❌ Should fail with empty token", async () => {
      // Send empty string as token
      const response = await request(app)
        .post("/api/users/google-auth")
        .send({ token: "" }) // Empty token
        .expect(400);

      expect(response.body.message).toContain("Google token is required");
    });

    test("❌ Should not accept old 'credential' field name", async () => {
      // Test that we updated from old field name
      // (In case frontend hasn't updated yet)
      const response = await request(app)
        .post("/api/users/google-auth")
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
      // Mock data from Google token for a NEW user
      const newUserGoogleData = {
        email: "newuser@gmail.com",
        name: "New Google User",
        sub: "google789" // Google ID
      };

      // Mock JWT verification (Google token is valid)
      jest.spyOn(jwt, "verify").mockReturnValue(newUserGoogleData);

      // Mock that user doesn't exist yet
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      // Mock creating the new user
      const createdUser = {
        _id: new mongoose.Types.ObjectId(),
        name: "New Google User",
        email: "newuser@gmail.com",
        googleId: "google789"
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
        googleId: "google789"
      });
    });

    test("❌ Should fail if user already exists", async () => {
      // Mock existing user data
      const existingUser = {
        _id: new mongoose.Types.ObjectId(),
        email: "existing@gmail.com",
        googleId: "google123"
      };

      // Mock Google token data
      jest.spyOn(jwt, "verify").mockReturnValue({
        email: "existing@gmail.com",
        name: "Existing User",
        sub: "google123"
      });

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
      // Mock JWT verification failure
      jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const response = await request(app)
        .post("/api/users/google-register")
        .send({ token: "invalid-google-token" })
        .expect(400);

      expect(response.body.message).toContain("Invalid Google token");
    });
  });

  /**
   * TEST GROUP 3: Security Tests
   * These tests ensure Google auth is secure
   */
  describe("Google Auth Security", () => {
    
    test("🔒 Should not leak user existence information", async () => {
      // When login fails, don't reveal if email exists or not
      jest.spyOn(jwt, "verify").mockReturnValue({
        email: "hacker@gmail.com",
        sub: "google999"
      });
      
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .post("/api/users/google-auth")
        .send({ token: "fake-token" })
        .expect(401); // Unauthorized

      // Generic error message - doesn't say "user not found"
      expect(response.body.message).toBe("Invalid Google authentication");
      expect(response.body.message).not.toContain("not found");
      expect(response.body.message).not.toContain("doesn't exist");
    });

    test("🔒 Should handle database errors gracefully", async () => {
      // Mock valid token
      jest.spyOn(jwt, "verify").mockReturnValue({
        email: "test@gmail.com",
        sub: "google123"
      });

      // Mock database error
      jest.spyOn(User, "findOne").mockRejectedValue(new Error("Database down"));

      const response = await request(app)
        .post("/api/users/google-auth")
        .send({ token: "fake-token" })
        .expect(500); // Internal Server Error

      expect(response.body.message).toBeTruthy();
      expect(response.body).not.toHaveProperty("stack"); // Don't leak error details
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
        email: "test@gmail.com",
        googleId: "google123"
      };

      jest.spyOn(jwt, "verify").mockReturnValue({
        email: "test@gmail.com",
        sub: "google123"
      });
      
      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

      // Token as regular string
      const response = await request(app)
        .post("/api/users/google-auth")
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
          .post("/api/users/google-auth")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Google token is required");
      }
    });
  });
});

/**
 * Summary for Junior Developers:
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