import api from "@/clients/crud.api"

// services/questionService.ts
export async function fetchQuestion(level: string) {
    const response = await api.get(`/questions?level=${level}`)
    return response.data
}