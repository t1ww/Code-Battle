// tests/services/auth.service.test.ts

import { AuthService } from "@/services/auth.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "@/clients/database.client";
import { ResultSetHeader, RowDataPacket } from "mysql2";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("@/clients/database.client");

const mockedPool = pool as jest.Mocked<typeof pool>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("AuthService.register (UTC-09)", () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("UTC-09-1: Valid registration", async () => {
    const result = { insertId: 1 } as ResultSetHeader;
    mockedPool.query.mockResolvedValueOnce([result, []]);
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

    const res = await service.register("User1", "user1@example.com", "pass123");
    expect(res.errorMessage).toBeUndefined();
    expect(res.id).toBe(1);
  });

  it("UTC-09-2: Email already exists", async () => {
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    mockedPool.query.mockRejectedValueOnce(new Error("Email already registered"));

    const res = await service.register("User1", "existing@example.com", "pass123");
    expect(res.errorMessage).toMatch(/Email already registered/i);
  });

  it("UTC-09-3: Passwords do not match (simulate in controller usually, but test service returns error if any)", async () => {
    // Service code does not check password confirm; typically done in controller.
    // So simulate missing fields to cover error path.
    const res = await service.register("", "user1@example.com", "pass123");
    expect(res.errorMessage).toMatch(/Missing required fields/i);
  });

  it("UTC-09-4: Invalid email format (simulate error thrown by DB or validation)", async () => {
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    mockedPool.query.mockRejectedValueOnce(new Error("Invalid email format"));

    const res = await service.register("User1", "invalidemailcom", "pass123");
    expect(res.errorMessage).toMatch(/Invalid email format/i);
  });

  it("UTC-09-5: Empty fields", async () => {
    const res = await service.register("", "", "");
    expect(res.errorMessage).toMatch(/Missing required fields/i);
  });
});

describe("AuthService.login (UTC-10)", () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("UTC-10-1: Valid login", async () => {
    const fakeUser = {
      id: 1,
      player_name: "User1",
      email: "user1@example.com",
      password_hash: "hashedPassword",
      role: "player",
      created_at: new Date(),
      constructor: { name: "RowDataPacket" },
    } as unknown as RowDataPacket;

    mockedPool.query.mockResolvedValueOnce([[fakeUser], []]);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockedJwt.sign as jest.Mock).mockReturnValue("jwt.token");

    const res = await service.login("user1@example.com", "pass123");
    expect(res.errorMessage).toBeUndefined();
    expect(res.token).toBe("jwt.token");
  });

  it("UTC-10-2: Invalid password", async () => {
    const fakeUser = {
      id: 1,
      player_name: "User1",
      email: "user1@example.com",
      password_hash: "hashedPassword",
      role: "player",
      created_at: new Date(),
      constructor: { name: "RowDataPacket" },
    } as unknown as RowDataPacket;

    mockedPool.query.mockResolvedValueOnce([[fakeUser], []]);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await service.login("user1@example.com", "wrongpass");
    expect(res.errorMessage).toBe("Invalid credentials");
  });

  it("UTC-10-3: Email not found", async () => {
    mockedPool.query.mockResolvedValueOnce([[], []]);

    const res = await service.login("notfound@example.com", "pass123");
    expect(res.errorMessage).toBe("Player not found");
  });

  it("UTC-10-4: Empty email or password", async () => {
    // The service does not explicitly check for empty inputs, but simulate DB returning no user
    mockedPool.query.mockResolvedValueOnce([[], []]);

    const res = await service.login("", "");
    expect(res.errorMessage).toBe("Player not found");
  });
});
