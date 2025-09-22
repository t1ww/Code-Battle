// backend\src\utils\withRetry.ts
import { getErrorMessage } from "@/utils/errorUtils";

export async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 500
): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            console.warn(`DB attempt ${i + 1} failed, retrying...`, getErrorMessage(err));
            if (i < retries - 1) {
                await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
            }
        }
    }
    throw lastError;
}
