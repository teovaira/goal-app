const request = require("supertest");
const app = require("../../app");
const User = require("../../models/userModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../../config/passport");

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

describe("Google Auth Field Update", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should accept 'token' field for Google login", async () => {
    const mockGoogleToken = "valid-google-token";
    
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      name: "Test User",
      email: "test@example.com",
      googleId: "google123"
    };

    jest.spyOn(jwt, "verify").mockReturnValue({
      email: mockUser.email,
      name: mockUser.name,
      sub: mockUser.googleId
    });

    jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

    const response = await request(app)
      .post("/api/users/google-auth")
      .send({ token: mockGoogleToken })
      .expect(200);

    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toBe(mockUser.email);
  });

  test("should reject request without token field", async () => {
    const response = await request(app)
      .post("/api/users/google-auth")
      .send({})
      .expect(400);

    expect(response.body.message).toContain("Google token is required");
  });

  test("should reject request with old 'credential' field", async () => {
    const response = await request(app)
      .post("/api/users/google-auth")
      .send({ credential: "google-token" })
      .expect(400);

    expect(response.body.message).toContain("Google token is required");
  });

  test("should handle Google registration with 'token' field", async () => {
    const mockGoogleToken = "valid-google-token";
    
    jest.spyOn(jwt, "verify").mockReturnValue({
      email: "newuser@example.com",
      name: "New User",
      sub: "google456"
    });

    jest.spyOn(User, "findOne").mockResolvedValue(null);
    jest.spyOn(User, "create").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      name: "New User",
      email: "newuser@example.com",
      googleId: "google456"
    });

    const response = await request(app)
      .post("/api/users/google-register")
      .send({ token: mockGoogleToken })
      .expect(201);

    expect(response.body).toHaveProperty("token");
    expect(response.body.user.email).toBe("newuser@example.com");
  });
});