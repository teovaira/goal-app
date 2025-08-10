/**
 * User Controller Tests - Junior Friendly Version
 * 
 * What is this file?
 * This file tests all the user-related features of our app like:
 * - Creating new accounts (registration)
 * - Logging in
 * - Viewing user profiles
 * - Google authentication
 * 
 * Why do we test these?
 * - To make sure users can create accounts properly
 * - To verify passwords are secure
 * - To ensure only logged-in users can see their profiles
 * - To catch bugs before they affect real users
 * 
 * Key Concepts:
 * - Hashing: Converting passwords to unreadable format for security
 * - JWT Token: A "ticket" that proves you're logged in
 * - Authentication: Proving who you are (login)
 * - Authorization: What you're allowed to do (permissions)
 */

const request = require("supertest");
const app = require("../../app");
const User = require("../../models/userModel");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
describe("User Controller - All User Features", () => {
  
  // Clear users before each test for a fresh start
  beforeEach(async () => {
    await User.deleteMany({});
  });

  /**
   * TEST GROUP 1: User Registration (Creating Accounts)
   * These tests check if new users can sign up correctly
   */
  describe("POST /api/users/register - Creating New Accounts", () => {
    
    // Helper function to create valid user data
    // This keeps our tests DRY (Don't Repeat Yourself)
    const createValidUserData = () => ({
      name: "Test User",
      email: "test@example.com", 
      password: "SecurePass123!@#"  // Strong password with numbers & symbols
    });

    test("✅ Should register a new user with valid data", async () => {
      const userData = createValidUserData();

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(201); // 201 = Created

      // Check response has what we need
      expect(response.body).toHaveProperty("token");     // Login token
      expect(response.body.user).toHaveProperty("_id");  // User ID
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      
      // IMPORTANT: Password should NEVER be sent back!
      expect(response.body.user).not.toHaveProperty("password");

      // Verify user was saved to database
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      
      // Verify password was hashed (not stored as plain text)
      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toContain("$2b$"); // bcrypt hash prefix
    });

    test("❌ Should not allow duplicate email addresses", async () => {
      // First, create a user
      await User.create({
        name: "Existing User",
        email: "taken@example.com",
        password: await bcrypt.hash("password123", 10)
      });

      // Try to create another user with same email
      const duplicateUser = {
        name: "New User",
        email: "taken@example.com", // Same email!
        password: "DifferentPass123!@#"
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(duplicateUser)
        .expect(400); // 400 = Bad Request

      expect(response.body.message).toContain("User already exists");
    });

    test("❌ Should require all fields (name, email, password)", async () => {
      // Test missing name
      const noName = { email: "test@example.com", password: "Pass123!@#" };
      let response = await request(app)
        .post("/api/users/register")
        .send(noName)
        .expect(400);
      expect(response.body.message).toContain("Please add all fields");

      // Test missing email
      const noEmail = { name: "Test", password: "Pass123!@#" };
      response = await request(app)
        .post("/api/users/register")
        .send(noEmail)
        .expect(400);
      expect(response.body.message).toContain("Please add all fields");

      // Test missing password
      const noPassword = { name: "Test", email: "test@example.com" };
      response = await request(app)
        .post("/api/users/register")
        .send(noPassword)
        .expect(400);
      expect(response.body.message).toContain("Please add all fields");
    });

    test("❌ Should validate email format", async () => {
      const invalidEmails = [
        "notanemail",           // No @ symbol
        "@example.com",         // No username
        "user@",                // No domain
        "user @example.com",    // Space in email
        "user@example"          // No top-level domain
      ];

      for (const invalidEmail of invalidEmails) {
        const userData = {
          name: "Test User",
          email: invalidEmail,
          password: "ValidPass123!@#"
        };

        const response = await request(app)
          .post("/api/users/register")
          .send(userData)
          .expect(400);

        expect(response.body.message).toContain("valid email");
      }
    });

    test("❌ Should enforce strong password requirements", async () => {
      // Test various weak passwords
      const weakPasswords = [
        { password: "short", reason: "too short" },
        { password: "12345678", reason: "numbers only" },
        { password: "password", reason: "too common" },
        { password: "Password", reason: "no numbers" },
        { password: "password1", reason: "no special characters" }
      ];

      for (const { password, reason } of weakPasswords) {
        const userData = {
          name: "Test User",
          email: "test@example.com",
          password: password
        };

        const response = await request(app)
          .post("/api/users/register")
          .send(userData)
          .expect(400);

        // Password validation message should explain requirements
        expect(response.body.message).toContain("Password must");
      }
    });

    test("✅ Should accept strong passwords", async () => {
      // Examples of good passwords
      const strongPasswords = [
        "SecurePass123!",
        "MyP@ssw0rd!",
        "Testing123$$$",
        "!@#QWEasd123"
      ];

      for (const password of strongPasswords) {
        // Clear users between tests
        await User.deleteMany({});
        
        const userData = {
          name: "Test User",
          email: "test@example.com",
          password: password
        };

        const response = await request(app)
          .post("/api/users/register")
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty("token");
      }
    });
  });

  /**
   * TEST GROUP 2: User Login
   * These tests check if users can log in correctly
   */
  describe("POST /api/users/login - Logging In", () => {
    let testUser;
    const testPassword = "TestPass123!@#";

    // Before each login test, create a test user
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword
      });
    });

    test("✅ Should login with correct email and password", async () => {
      const loginData = {
        email: testUser.email,
        password: testPassword // Original password, not hashed
      };

      const response = await request(app)
        .post("/api/users/login")
        .send(loginData)
        .expect(200); // 200 = Success

      // Check response
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("_id");
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty("password"); // No password in response!

      // Verify token is valid
      const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decodedToken.id).toBe(testUser._id.toString());
    });

    test("❌ Should not login with wrong email", async () => {
      const wrongEmailData = {
        email: "wrong@example.com", // This email doesn't exist
        password: testPassword
      };

      const response = await request(app)
        .post("/api/users/login")
        .send(wrongEmailData)
        .expect(401); // 401 = Unauthorized

      expect(response.body.message).toContain("Invalid email or password");
      expect(response.body).not.toHaveProperty("token"); // No token given
    });

    test("❌ Should not login with wrong password", async () => {
      const wrongPasswordData = {
        email: testUser.email,
        password: "WrongPassword123!@#" // Wrong password
      };

      const response = await request(app)
        .post("/api/users/login")
        .send(wrongPasswordData)
        .expect(401);

      expect(response.body.message).toContain("Invalid email or password");
      expect(response.body).not.toHaveProperty("token");
    });

    test("❌ Should require both email and password", async () => {
      // Test missing email
      let response = await request(app)
        .post("/api/users/login")
        .send({ password: testPassword })
        .expect(400);
      expect(response.body.message).toContain("provide both email and password");

      // Test missing password
      response = await request(app)
        .post("/api/users/login")
        .send({ email: testUser.email })
        .expect(400);
      expect(response.body.message).toContain("provide both email and password");

      // Test empty body
      response = await request(app)
        .post("/api/users/login")
        .send({})
        .expect(400);
      expect(response.body.message).toContain("provide both email and password");
    });
  });

  /**
   * TEST GROUP 3: User Profile
   * These tests check if users can view their profile
   */
  describe("GET /api/users/profile - Viewing User Profile", () => {
    let authToken;
    let userId;

    // Create a test user with auth token
    beforeEach(async () => {
      const user = await User.create({
        name: "Profile Test User",
        email: "profile@example.com",
        password: await bcrypt.hash("TestPass123!@#", 10)
      });
      
      userId = user._id;
      authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    });

    test("✅ Should get profile with valid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`) // Send token in header
        .expect(200);

      // Check profile data
      expect(response.body._id).toBe(userId.toString());
      expect(response.body.name).toBe("Profile Test User");
      expect(response.body.email).toBe("profile@example.com");
      expect(response.body).not.toHaveProperty("password"); // No password!
    });

    test("❌ Should not get profile without token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        // No Authorization header!
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should not get profile with invalid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid-token-here")
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should not get profile with expired token", async () => {
      // Create token that expired 1 hour ago
      const expiredToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "-1h" } // Negative time = already expired
      );

      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("❌ Should return 404 if user was deleted", async () => {
      // Delete the user
      await User.findByIdAndDelete(userId);

      // Try to get profile with valid token
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404); // 404 = Not Found

      expect(response.body.message).toContain("User not found");
    });
  });

  /**
   * TEST GROUP 4: JWT Token Tests
   * These tests verify our authentication tokens work correctly
   */
  describe("JWT Token Generation and Validation", () => {
    
    test("🔑 Should generate valid 30-day token on registration", async () => {
      const userData = {
        name: "Token Test",
        email: "token@example.com",
        password: "TokenPass123!@#"
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(201);

      const token = response.body.token;
      expect(token).toBeTruthy();
      
      // Decode and verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty("id");      // User ID
      expect(decoded).toHaveProperty("iat");     // Issued At timestamp
      expect(decoded).toHaveProperty("exp");     // Expiration timestamp
      
      // Check token expires in 30 days
      const tokenLifespan = decoded.exp - decoded.iat;
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      expect(tokenLifespan).toBe(thirtyDaysInSeconds);
    });

    test("🔑 Should generate same format token on login", async () => {
      // First create a user
      const hashedPass = await bcrypt.hash("LoginPass123!@#", 10);
      const user = await User.create({
        name: "Login Token Test",
        email: "logintoken@example.com",
        password: hashedPass
      });

      // Then login
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "logintoken@example.com",
          password: "LoginPass123!@#"
        })
        .expect(200);

      // Verify token format
      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user._id.toString());
    });
  });

  /**
   * TEST GROUP 5: Error Handling
   * These tests ensure errors are handled gracefully
   */
  describe("Error Handling and Edge Cases", () => {
    
    test("💥 Should handle database errors gracefully", async () => {
      // Mock a database error
      jest.spyOn(User, "create").mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "TestPass123!@#"
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(500); // 500 = Internal Server Error

      expect(response.body.message).toBeTruthy();
      expect(response.body).not.toHaveProperty("stack"); // Don't leak error details
      
      // Clean up mock
      User.create.mockRestore();
    });

    test("💥 Should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .set("Content-Type", "application/json")
        .send("this is not valid JSON{") // Bad JSON
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    test("🔒 Should not leak sensitive info in errors", async () => {
      // Try to login with wrong credentials
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "nonexistent@example.com",
          password: "WrongPass123!@#"
        })
        .expect(401);

      // Error message should be generic
      expect(response.body.message).toBe("Invalid email or password");
      
      // Should NOT include:
      expect(response.body.message).not.toContain("user not found");
      expect(response.body.message).not.toContain("password incorrect");
      expect(response.body).not.toHaveProperty("stack");
      expect(response.body).not.toHaveProperty("sql");
    });
  });
});

/**
 * Summary for Junior Developers:
 * 
 * This test file covers all user-related features:
 * 1. Registration - Creating new accounts
 * 2. Login - Accessing existing accounts
 * 3. Profile - Viewing user information
 * 4. Security - Password hashing and JWT tokens
 * 
 * Important Security Concepts:
 * - Passwords are NEVER stored as plain text
 * - Passwords are NEVER sent back in responses
 * - Tokens expire after 30 days for security
 * - Error messages don't reveal sensitive info
 * 
 * Best Practices Shown:
 * - Use helper functions to avoid repetition
 * - Test both success and failure cases
 * - Group related tests together
 * - Use clear, descriptive test names
 * - Clean up data between tests
 * 
 * Running These Tests:
 * - npm test userController.test.js (run just this file)
 * - npm test (run all tests)
 * - npm test -- --watch (auto-run on file changes)
 */