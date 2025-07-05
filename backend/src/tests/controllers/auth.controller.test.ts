import * as authController from "@/controllers/auth.controller";

const mockReq = (body: any) => ({ body } as any);
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("AuthController.register (UTC-01)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("UTC-01-1: Valid registration", async () => {
    jest.spyOn(authController.authService, "register").mockResolvedValue({
      errorMessage: undefined,
      id: 1,
      username: "User1",
      email: "user1@example.com",
    });

    const req = mockReq({
      username: "User1",
      email: "user1@example.com",
      password: "pass123",
      confirmPassword: "pass123",
    });
    const res = mockRes();

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, username: "User1", email: "user1@example.com" })
    );
  });

  it("UTC-01-2: Registration errors - invalid input format", async () => {
    jest.spyOn(authController.authService, "register").mockResolvedValue({
      errorMessage: "Invalid input format",
    });

    const req = mockReq({ invalidInput: null });
    const res = mockRes();

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errorMessage: "Invalid input format" });
  });
});

describe("AuthController.login (UTC-02)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("UTC-02-1: Valid login", async () => {
    jest.spyOn(authController.authService, "login").mockResolvedValue({
      errorMessage: undefined,
      token: "some.jwt.token",
      id: "1",
      username: "User1",
      email: "user1@example.com",
    });

    const req = mockReq({ email: "user1@example.com", password: "pass123" });
    const res = mockRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
  });

  it("UTC-02-2: Login errors - invalid input format", async () => {
    jest.spyOn(authController.authService, "login").mockResolvedValue({
      errorMessage: "Invalid input format",
    });

    const req = mockReq({ email: "", password: "" });
    const res = mockRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errorMessage: "Invalid input format" });
  });
});
