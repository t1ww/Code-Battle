import { ref } from 'vue'
import type { Question } from '@/types/types'

const question_data = ref<Question | null>(null)

export function useQuestionStore() {
    return {
        question_data,
    }
}
