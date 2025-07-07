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

function logIO(testName: string, input: any, output: any) {
  console.log(`\n--- ${testName} ---`);
  console.log("Input:", input);
  console.log("Output:", output);
  console.log("--- end ---\n");
}

describe("AuthService.register (UTC-09)", () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("UTC-09-1: Valid registration", async () => {
    const input = { username: "User1", email: "user1@example.com", password: "pass123" };
    const result = { insertId: 1 } as ResultSetHeader;
    mockedPool.query.mockResolvedValueOnce([result, []]);
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

    const output = await service.register(input.username, input.email, input.password);
    logIO("UTC-09-1: Valid registration", input, output);

    expect(output.errorMessage).toBeUndefined();
    expect(output.id).toBe(1);
  });

  it("UTC-09-2: Email already exists", async () => {
    const input = { username: "User1", email: "existing@example.com", password: "pass123" };
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    mockedPool.query.mockRejectedValueOnce(new Error("Email already registered"));

    const output = await service.register(input.username, input.email, input.password);
    logIO("UTC-09-2: Email already exists", input, output);

    expect(output.errorMessage).toMatch(/Email already registered/i);
  });

  it("UTC-09-3: Passwords do not match (simulate in controller usually, but test service returns error if any)", async () => {
    const input = { username: "", email: "user1@example.com", password: "pass123" };

    const output = await service.register(input.username, input.email, input.password);
    logIO("UTC-09-3: Passwords do not match simulation", input, output);

    expect(output.errorMessage).toMatch(/Missing required fields/i);
  });

  it("UTC-09-4: Invalid email format (simulate error thrown by DB or validation)", async () => {
    const input = { username: "User1", email: "invalidemailcom", password: "pass123" };
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    mockedPool.query.mockRejectedValueOnce(new Error("Invalid email format"));

    const output = await service.register(input.username, input.email, input.password);
    logIO("UTC-09-4: Invalid email format", input, output);

    expect(output.errorMessage).toMatch(/Invalid email format/i);
  });

  it("UTC-09-5: Empty fields", async () => {
    const input = { username: "", email: "", password: "" };
    const output = await service.register(input.username, input.email, input.password);
    logIO("UTC-09-5: Empty fields", input, output);

    expect(output.errorMessage).toMatch(/Missing required fields/i);
  });
});

describe("AuthService.login (UTC-10)", () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("UTC-10-1: Valid login", async () => {
    const input = { email: "user1@example.com", password: "pass123" };
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

    const output = await service.login(input.email, input.password);
    logIO("UTC-10-1: Valid login", input, output);

    expect(output.errorMessage).toBeUndefined();
    expect(output.token).toBe("jwt.token");
  });

  it("UTC-10-2: Invalid password", async () => {
    const input = { email: "user1@example.com", password: "wrongpass" };
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

    const output = await service.login(input.email, input.password);
    logIO("UTC-10-2: Invalid password", input, output);

    expect(output.errorMessage).toBe("Invalid credentials");
  });

  it("UTC-10-3: Email not found", async () => {
    const input = { email: "notfound@example.com", password: "pass123" };
    mockedPool.query.mockResolvedValueOnce([[], []]);

    const output = await service.login(input.email, input.password);
    logIO("UTC-10-3: Email not found", input, output);

    expect(output.errorMessage).toBe("Player not found");
  });

  it("UTC-10-4: Empty email or password", async () => {
    const input = { email: "", password: "" };
    mockedPool.query.mockResolvedValueOnce([[], []]);

    const output = await service.login(input.email, input.password);
    logIO("UTC-10-4: Empty email or password", input, output);

    expect(output.errorMessage).toBe("Player not found");
  });
});
