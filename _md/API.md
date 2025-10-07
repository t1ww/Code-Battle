## 📡 API Endpoints

### 👤 Player Routes

**Base route:** `/api/players`

#### ▶️ POST `/register`

Registers a new player account.

**Request Body:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirm_password": "string"
}
```

**Success Response** (`201 Created`):

```json
{
  "error_message": null
}
```

**Error Responses** (`400 Bad Request`):

```json
{ "error_message": "All fields are required" }
{ "error_message": "Passwords do not match" }
{ "error_message": "Invalid RegisterRequest format" }
{ "error_message": "Invalid email format" }
{ "error_message": "Email already exists" }
```

---

#### ▶️ POST `/login`

Authenticates a player and returns a token.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response** (`200 OK`):

```json
{
  "error_message": null,
  "token": "jwt-token",
  "player_info": {
    "id": number,
    "username": "string",
    "email": "string"
  }
}
```

**Error Responses** (`400 Bad Request`):

```json
{ "error_message": "All fields are required", "token": null, "player_info": null }
{ "error_message": "Invalid LoginRequest format", "token": null, "player_info": null }
{ "error_message": "Email not found", "token": null, "player_info": null }
{ "error_message": "Incorrect password", "token": null, "player_info": null }
```

---

#### ▶️ GET `/profile`

Fetches the authenticated player's profile.

🔐 **Requires JWT token** in the `Authorization` header:

```
Authorization: Bearer <token>
```

**Success Response** (`200 OK`):

```json
{
  "id": 1,
  "username": "player1",
  "email": "player1@example.com",
  "created_at": "2024-06-01T10:00:00.000Z"
}
```

**Error Responses**:

```json
{ "error_message": "Player ID is required" }
{ "error_message": "Invalid input format, required player_id" }
{ "error_message": "Player not found" }
{ "error_message": "Unauthorized" }
```

---
---

### ❓ Question Routes

**Base route:** `/api/questions`

#### ▶️ GET `/:id`

Fetch a specific question by its ID.

**Path Param:**

```
/api/questions/<id: number>
```

**Success Response** (`200 OK`):

```json
{
  "id": "1",
  "question_name": "Add two numbers",
  "description": "Return the sum of two integers.",
  "time_limit": 2000,
  "level": "Easy",
  "test_cases": [
    {
      "id": 1,
      "input": "2 3",
      "expectedOutput": "5",
      "score": 10
    }
  ]
}
```

**Error Responses:**

```json
{ "error_message": "Invalid input format, required question_id" }
{ "error_message": "Question ID is required" }
{ "error_message": "Question not found" }
```

---

#### ▶️ GET `/`

Fetch a random question by difficulty level.

**Query Param:**

```
/api/questions?level=< Easy|Medium|Hard >
```

**Success Response** (`200 OK`):

```json
{
  "id": 4,
  "question_name": "Find max element",
  "description": "Given a list of integers, return the maximum.",
  "time_limit": 1500,
  "level": "Medium",
  "test_cases": [ ... ]
}
```

**Error Responses:**

```json
{ "error_message": "Invalid input format, required level of; Easy, Medium, Hard" }
{ "error_message": "Level input must not be empty" }
{ "error_message": "Invalid level input" }
{ "error_message": "Question not found" }
```

---

#### ▶️ POST `/`

Create a new question.

**Request Body:**

```json
{
  "question_name": "Add two numbers",
  "description": "Return the sum of two integers.",
  "time_limit": 2000,
  "level": "Easy",
  "test_cases": [
    {
      "id": 1,
      "input": "2 3",
      "expectedOutput": "5",
      "score": 10
    }
  ]
}
```

**Success Response** (`201 Created`):

```json
{
  "id": 12,
  "question_name": "...",
  "description": "...",
  ...
}
```

**Error Responses:**

```json
{ "error_message": "Invalid input format for creating question" }
{ "error_message": "Error creating question" }
```

---

#### ▶️ PUT `/:id`

Update an existing question.

**Path Param:**

```
/api/questions/<id>
```

**Request Body:** (partial update allowed)

```json
{
  "question_name": "Updated question name",
  "description": "Updated description",
  "time_limit": 3000,
  "test_cases": [
    {
      "id": 1,
      "input": "4 4",
      "expectedOutput": "8",
      "score": 10
    }
  ]
}
```

**Success Response** (`200 OK`):

```json
{
  "id": "12",
  "question_name": "...",
  "description": "...",
  ...
}
```

**Error Responses:**

```json
{ "error_message": "Invalid input format, required question_id" }
{ "error_message": "Question ID is required" }
{ "error_message": "Invalid input format for updating question" }
{ "error_message": "Question not found" }
{ "error_message": "Error updating question" }
```

---
---

### 🧮 Score Routes

**Base route:** `/api/scores`

---

#### ▶️ POST `/submit`

Submits a score for a question by a player.

**Request Body:**

```json
{
  "player_id": "string",
  "question_id": "string",
  "score": 75,
  "language": "typescript",
  "modifier_state": "None" // or "Sabotage", "Confident"
}
```

**Success Response** (`200 OK`):

```json
{ "message": "Score successfully submitted" }
```

**Error Responses:**

```json
{ "error_message": "Invalid input format, required player_id and question_id" }
{ "error_message": "All fields are required" }
{ "error_message": "Failed to submit score" }
```

---

#### ▶️ GET `/topscore`

Returns the top score of a player for a specific question.

**Query Params:**

```
/api/scores/topscore?player_id=<player_id>&question_id=<question_id>
```

**Success Response** (`200 OK`):

```json
{
  "player_id": "p1",
  "question_id": "q1",
  "score": 90,
  "language": "typescript",
  "modifier_state": "Confident"
}
```

**Error Responses:**

```json
{ "error_message": "Invalid input format, required player_id and question_id" }
{ "error_message": "All fields are required" }
{ "error_message": "Player not found or Score not found" }
{ "error_message": "Failed to get score" }
```

---

#### ▶️ GET `/leaderboard`

Returns the top scores for a specific question across all players.

**Query Param:**

```
/api/scores/leaderboard?question_id=<question_id>
```

**Success Response** (`200 OK`):

```json
[
  {
    "player_id": "p1",
    "question_id": "q1",
    "score": 95,
    "language": "typescript",
    "modifier_state": "None"
  },
  {
    "player_id": "p2",
    "question_id": "q1",
    "score": 92,
    "language": "javascript",
    "modifier_state": "Confident"
  }
]
```

**Error Responses:**

```json
{ "error_message": "Invalid input format, required question_id" }
{ "error_message": "Question ID is required" }
{ "error_message": "Question not found" }
{ "error_message": "Failed to get leaderboard" }
```

---
