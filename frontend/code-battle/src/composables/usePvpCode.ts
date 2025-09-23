// frontend\code-battle\src\composables\usePvpCode.ts
import { ref } from 'vue'
import type { CodeRunResponse } from '@/types/types'
import codeRunnerApi from '@/clients/coderunner.api'
import { usePvpGameStore } from '@/stores/usePvpGameStore'

export function usePvpCode() {
    const gameStore = usePvpGameStore()
    const code = ref('// Write code here')
    const testResults = ref<any>(null)
    const isLoading = ref(false)

    async function runCodeOnApi(code: string, test_cases: any[]) {
        const res = await codeRunnerApi.post('/run', { code, test_cases, score_pct: 1 })
        return res.data as CodeRunResponse
    }

    function mapTestResults(data: CodeRunResponse, question: any) {
        const perTest = data.results.map((r, i) => ({
            passed: !!r.passed,
            output: r.output,
            expected_output: question.test_cases[i].expected_output,
            input: question.test_cases[i].input,
        }))
        const passedCount = perTest.filter(p => p.passed).length
        return {
            passed: passedCount === (question.test_cases?.length ?? 0),
            results: perTest,
            total_score: Number(data.total_score) || passedCount
        }
    }

    async function submitCode(currentQuestionIndex: number) {
        isLoading.value = true
        try {
            const currentQuestion = gameStore.questions[currentQuestionIndex]
            if (!currentQuestion) return

            const data = await runCodeOnApi(code.value, currentQuestion.test_cases)
            const resultsForCurrent = mapTestResults(data, currentQuestion)

            testResults.value = resultsForCurrent
            return resultsForCurrent
        } finally {
            isLoading.value = false
        }
    }

    return { code, isLoading, testResults, submitCode }
}
