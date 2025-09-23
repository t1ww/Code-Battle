// frontend\code-battle\src\composables\usePvpCode.ts
import { ref } from 'vue'
import type { CodeRunResponse } from '@/types/types'
import codeRunnerApi from '@/clients/coderunner.api'
import { usePvpGameStore } from '@/stores/usePvpGameStore'
import { socket } from '@/clients/socket.api'
import { triggerNotification } from './notificationService'

export function usePvpCode() {
    const gameStore = usePvpGameStore()
    const code = ref('// Write code here')
    const testResults = ref<any>(null)
    const isLoading = ref(false)

    // ------------------------------
    // Core API call
    // ------------------------------
    async function runCodeOnApi(code: string, test_cases: any[]) {
        const res = await codeRunnerApi.post('/run', { code, test_cases, score_pct: 1 })
        return res.data as CodeRunResponse
    }

    // ------------------------------
    // Map raw results to PvP-friendly format
    // ------------------------------
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

    // ------------------------------
    // Save local progress
    // ------------------------------
    function saveProgress(questionIndex: number, results: any) {
        const teamKey = gameStore.playerTeam || 'team1'
        if (!gameStore.progress[teamKey]) gameStore.progress[teamKey] = []
        if (!gameStore.progressFullPass) gameStore.progressFullPass = { team1: [], team2: [] }
        if (!gameStore.progressFullPass[teamKey]) gameStore.progressFullPass[teamKey] = []

        const perTestBooleans = (results?.results ?? []).map((r: any) => !!r.passed)
        gameStore.progress[teamKey][questionIndex] = perTestBooleans
        if (results.passed) gameStore.progressFullPass[teamKey][questionIndex] = true
    }

    // ------------------------------
    // Submit code for current question
    // ------------------------------
    async function submitCode(currentQuestionIndex: number, selectedLanguage: string) {
        isLoading.value = true
        try {
            const currentQuestion = gameStore.questions[currentQuestionIndex]
            if (!currentQuestion) return null

            // Prevent resubmitting fully passed questions
            const teamKey = gameStore.playerTeam
            if (teamKey != null && gameStore.progressFullPass?.[teamKey]?.[currentQuestionIndex]) {
                triggerNotification("Question already completed (full pass).", 1200)
                return null
            }

            const data = await runCodeOnApi(code.value, currentQuestion.test_cases)

            // Handle compilation/runtime errors
            const errorResult = data.results.find(r =>
                r.output.startsWith('[Compilation Error]') || r.output.startsWith('[Runtime Error]')
            )
            if (errorResult) {
                triggerNotification(
                    errorResult.output.startsWith('[Compilation Error]') ? 'Compilation Error' : 'Runtime Error',
                    2000
                )
                throw new Error('Code execution failed')
            }

            const resultsForCurrent = mapTestResults(data, currentQuestion)
            testResults.value = resultsForCurrent

            // Save progress locally
            saveProgress(currentQuestionIndex, resultsForCurrent)

            // Emit to server any passed test indices
            const passedIndices = resultsForCurrent.results
                .map((r: any, i: number) => (r.passed ? i : -1))
                .filter((i: number) => i >= 0)

            if (passedIndices.length > 0 && gameStore.gameId && teamKey) {
                socket.emit('questionFinished', {
                    gameId: gameStore.gameId,
                    team: teamKey,
                    questionIndex: currentQuestionIndex,
                    passedIndices
                })
            }

            // Show notification for full-pass
            if (resultsForCurrent.passed) {
                triggerNotification('All test cases passed! Question cleared.', 1200)
            }

            return resultsForCurrent
        } catch (e) {
            console.error('submitCode failed', e)
            return null
        } finally {
            isLoading.value = false
        }
    }

    // ------------------------------
    // DEV helper: force clear current question
    // ------------------------------
    function forceClearQuestion(questionIndex: number) {
        const teamKey = gameStore.playerTeam || 'team1'
        const question = gameStore.questions[questionIndex]
        if (!question) return

        const allPassed = question.test_cases.map(() => true)
        if (!gameStore.progress[teamKey]) gameStore.progress[teamKey] = []
        if (!gameStore.progressFullPass[teamKey]) gameStore.progressFullPass[teamKey] = []

        gameStore.progress[teamKey][questionIndex] = allPassed
        gameStore.progressFullPass[teamKey][questionIndex] = true

        // Emit as normal full-pass
        if (gameStore.gameId) {
            socket.emit('questionFinished', {
                gameId: gameStore.gameId,
                team: teamKey,
                questionIndex,
                passedIndices: allPassed.map((_: any, i: any) => i)
            })
            triggerNotification(`DEV: Question ${questionIndex} force-cleared and emitted!`, 1200)
        }
    }

    return {
        code,
        isLoading,
        testResults,
        submitCode,
        runCodeOnApi,
        mapTestResults,
        saveProgress,
        forceClearQuestion
    }
}
