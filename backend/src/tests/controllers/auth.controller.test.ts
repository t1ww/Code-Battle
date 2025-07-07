import * as authController from "@/controllers/auth.controller";

const mockReq = (body: any) => ({ body } as any);
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

function logIO(testName: string, input: any, res: any) {
  const output = (res.json as jest.Mock).mock.calls[0]?.[0];
  console.log(`\n--- ${testName} ---`);
  console.log("Input:", input);
  console.log("Output:", output);
  console.log("--- end ---\n");
}

describe("AuthController.register (UTC-01)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("UTC-01-1: Valid registration", async () => {
    jest.spyOn(authController.authService, "register").mockResolvedValue({
      errorMessage: undefined,
      username: "User1",
      email: "user1@example.com",
    });

    const input = {
      username: "User1",
      email: "user1@example.com",
      password: "pass123",
      confirmPassword: "pass123",
    };
    const req = mockReq(input);
    const res = mockRes();

    await authController.register(req, res);

    logIO("UTC-01-1: Valid registration", input, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      errorMessage: null,
    });
  });

  it("UTC-01-2: Registration errors - invalid input format", async () => {
    jest.spyOn(authController.authService, "register").mockResolvedValue({
      errorMessage: "Invalid input format",
    });

    const input = { invalidInput: null };
    const req = mockReq(input);
    const res = mockRes();

    await authController.register(req, res);

    logIO("UTC-01-2: Registration errors - invalid input format", input, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errorMessage: "Invalid input format",
    });
  });
});

describe("AuthController.login (UTC-02)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("UTC-02-1: Valid login", async () => {
    jest.spyOn(authController.authService, "login").mockResolvedValue({
      token: "some.jwt.token",
      id: "1",
      username: "User1",
      email: "user1@example.com",
    });

    const input = { email: "user1@example.com", password: "pass123" };
    const req = mockReq(input);
    const res = mockRes();

    await authController.login(req, res);

    logIO("UTC-02-1: Valid login", input, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        token: expect.any(String),
        playerInfo: expect.objectContaining({
          username: "User1",
          email: "user1@example.com",
        }),
        errorMessage: null,
      })
    );
  });

  it("UTC-02-2: Login errors - invalid input format", async () => {
    jest.spyOn(authController.authService, "login").mockResolvedValue({
      errorMessage: "Invalid input format",
    });

    const input = { email: "", password: "" };
    const req = mockReq(input);
    const res = mockRes();

    await authController.login(req, res);

    logIO("UTC-02-2: Login errors - invalid input format", input, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errorMessage: "Invalid input format",
    });
  });
});
