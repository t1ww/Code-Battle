import { QuestionController } from "@/controllers/question.controller";
import { QuestionService } from "@/services/question.service";
import { QuestionResponse } from "@/dtos/question.dto";

describe("QuestionController", () => {
    let controller: QuestionController;
    let serviceMock: jest.Mocked<QuestionService>;
    let res: any;

    const fullQuestionMock: QuestionResponse = {
        id: 1,
        question_name: "Sample Question",
        description: "A simple question description",
        time_limit: 10,
        level: "Easy",
        test_cases: [
            {
                id: 100,
                input: "input1",
                expectedOutput: "output1",
                score: 5,
            },
        ],
    };

    beforeEach(() => {
        serviceMock = {
            getQuestionById: jest.fn(),
            getAQuestion: jest.fn(),
            createQuestion: jest.fn(),
            updateQuestion: jest.fn(),
        } as any;

        controller = new QuestionController();
        (controller as any).questionService = serviceMock;

        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
    });

    describe("getQuestionById", () => {
        it("returns question json when found", async () => {
            const req = { params: { id: "1" } } as any;
            serviceMock.getQuestionById.mockResolvedValue(fullQuestionMock);

            await controller.getQuestionById(req, res);

            expect(serviceMock.getQuestionById).toHaveBeenCalledWith("1");
            expect(res.json).toHaveBeenCalledWith(fullQuestionMock);
        });

        it("returns 404 on error", async () => {
            const req = { params: { id: "1" } } as any;
            serviceMock.getQuestionById.mockRejectedValue(new Error("not found"));

            await controller.getQuestionById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "not found" });
        });
    });

    describe("getAQuestion", () => {
        it("returns question json when level provided", async () => {
            const req = { query: { level: "Easy" } } as any;
            serviceMock.getAQuestion.mockResolvedValue(fullQuestionMock);

            await controller.getAQuestion(req, res);

            expect(serviceMock.getAQuestion).toHaveBeenCalledWith("Easy");
            expect(res.json).toHaveBeenCalledWith(fullQuestionMock);
        });

        it("returns 400 if level missing", async () => {
            const req = { query: {} } as any;

            await controller.getAQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Missing level" });
        });

        it("returns 404 on service error", async () => {
            const req = { query: { level: "Easy" } } as any;
            serviceMock.getAQuestion.mockRejectedValue(new Error("not found"));

            await controller.getAQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "not found" });
        });
    });

    describe("createQuestion", () => {
        it("creates and returns question", async () => {
            const req = {
                body: {
                    questionName: "Sample Question",
                    description: "desc",
                    timeLimit: 10,
                    level: "Easy",
                    testCases: [],
                },
            } as any;

            serviceMock.createQuestion.mockResolvedValue(fullQuestionMock);

            await controller.createQuestion(req, res);

            expect(serviceMock.createQuestion).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(fullQuestionMock);
        });

        it("returns 400 on error", async () => {
            const req = { body: {} } as any;
            serviceMock.createQuestion.mockRejectedValue(new Error("bad data"));

            await controller.createQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "bad data" });
        });
    });

    describe("updateQuestion", () => {
        it("updates and returns question", async () => {
            const req = {
                params: { id: "1" },
                body: { questionName: "Updated Question" },
            } as any;

            serviceMock.updateQuestion.mockResolvedValue({
                ...fullQuestionMock,
                question_name: "Updated Question",
            });

            await controller.updateQuestion(req, res);

            expect(serviceMock.updateQuestion).toHaveBeenCalledWith("1", req.body);
            expect(res.json).toHaveBeenCalledWith({
                ...fullQuestionMock,
                questionName: "Updated Question",
            });
        });

        it("returns 400 on error", async () => {
            const req = { params: { id: "1" }, body: {} } as any;
            serviceMock.updateQuestion.mockRejectedValue(new Error("update failed"));

            await controller.updateQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "update failed" });
        });
    });
});
