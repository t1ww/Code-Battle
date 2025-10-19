// frontend\code-battle\src\composables\usePvpCode.ts
import { ref } from 'vue'
import type { CodeRunResponse } from '@/types/types'
import codeRunnerApi from '@/clients/coderunner.api'
import { usePvpGameStore } from '@/stores/game'
import { socket } from '@/clients/socket.api'
import { triggerNotification } from './notificationService'

export function usePvpCode({ singleBufferMode }: { singleBufferMode: boolean }) {
    const gameStore = usePvpGameStore()
    const codes = ref([
        ref('// Write code for Q1'),
        ref('// Write code for Q2'),
        ref('// Write code for Q3')
    ])

    if (singleBufferMode) {
        const shared = ref('// Write your code here')
        codes.value = [shared, shared, shared]
    }

    const testResults = ref<any>(null)
    const isLoading = ref(false)

    // ------------------------------
    // Core API call
    // ------------------------------
    async function runCodeOnApi(code: string, test_cases: any[], language: string) {
        const res = await codeRunnerApi.post('/run', { code, test_cases, language, score_pct: 1 })
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
    type SubmitCodeResponse = {
        resultsForCurrent: ReturnType<typeof mapTestResults> | null
        error?: { output?: string } | any
        alreadyCompleted: boolean
    }
    async function submitCode(currentQuestionIndex: number, selectedLanguage: string): Promise<SubmitCodeResponse | null> {
        isLoading.value = true
        try {
            const currentQuestion = gameStore.questions[currentQuestionIndex]
            const currentQuestionCode = codes.value[currentQuestionIndex].value;
            if (!currentQuestion) return null

            const teamKey = gameStore.playerTeam
            if (teamKey != null && gameStore.progressFullPass?.[teamKey]?.[currentQuestionIndex]) {
                triggerNotification('You have already completed this question.');
                return { resultsForCurrent: null, alreadyCompleted: true }
            }

            const data = await runCodeOnApi(currentQuestionCode, currentQuestion.test_cases, selectedLanguage)

            const errorResult = data.results.find(r =>
                r.output.startsWith('[Compilation Error]') || r.output.startsWith('[Runtime Error]')
            )

            const resultsForCurrent = mapTestResults(data, currentQuestion)
            testResults.value = resultsForCurrent
            saveProgress(currentQuestionIndex, resultsForCurrent)

            const passedIndices = resultsForCurrent.results
                .map((r: any, i: number) => (r.passed ? i : -1))
                .filter(i => i >= 0)

            if (gameStore.gameId && teamKey) {
                socket.emit('questionFinished', {
                    gameId: gameStore.gameId,
                    team: teamKey,
                    questionIndex: currentQuestionIndex,
                    passedIndices
                })
            }

            return {
                resultsForCurrent,
                error: errorResult || null,
                alreadyCompleted: false
            }

        } catch (e) {
            console.error('submitCode failed', e)
            return { resultsForCurrent: null, error: e, alreadyCompleted: false }
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
        codes,
        isLoading,
        testResults,
        submitCode,
        runCodeOnApi,
        mapTestResults,
        saveProgress,
        forceClearQuestion
    }
}
