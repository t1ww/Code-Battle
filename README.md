# Code-Battle
Senior final project

---





## To solve server stuck

Find it's port by runnning (ex. port=10602)

      netstat -ano | findstr :10602

You'll get something like so, last column is it's id

      TCP    0.0.0.0:10602          0.0.0.0:0              LISTENING       65580

Then kill it with found id

      taskkill /pid 65580 /f

---






## 🛠️ Knex Usage
Make sure `knexfile.ts` is correctly configured with your environment and database credentials.

### Create a Migration File
```bash
npx knex migrate:make <filename>
````

### Run Migrations
```bash
npx knex migrate:latest
```

### Roll Back All Migrations
```bash
npx knex migrate:rollback --all
```

> ℹ️ You can also use `npx knex migrate:rollback` to undo the last batch only.

---







### Notes:
- Clarified commands and formatting for readability.
- Fixed `migrate:rollback all` → `migrate:rollback --all` (official syntax).
- Added optional `--all` tip for clarity.
