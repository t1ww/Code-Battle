// socket-server\src\clients\coderunner.api.ts
import axios, { AxiosError } from "axios"

const codeRunnerApi = axios.create({
    baseURL: "http://localhost:5001",
    timeout: 30000, // give it more time if it's slow
})

// Optional: add similar global error handler
codeRunnerApi.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        let message = "Code runner error occurred."

        if (error.code === "ERR_NETWORK" && !error.response) {
            message = !navigator.onLine
                ? "You are offline. Please check your internet connection."
                : "Code runner server is unreachable."
        } else if (error.response) {
            const status = error.response.status
            if (status === 400) message = "Bad request to code runner."
            else if (status === 500) message = "Code runner crashed."
            else message = `Code runner error ${status}`
        }

        ; (error as any).customMessage = message
        return Promise.reject(error)
    }
)

export default codeRunnerApi
