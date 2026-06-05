# Circle - Full-Stack Friends List Application

Circle is a premium, full-stack Friends List manager with user authentication, designed with a gorgeous glassmorphic dark-theme UI.

## Tech Stack
* **Frontend**: React (Vite), Apollo Client, CSS Variables (Custom Design System), Lucide Icons, Canvas Confetti.
* **Auth Backend**: Express, Node.js, PostgreSQL (via `pg`), JSON Web Tokens (`jsonwebtoken`), password hashing (`bcryptjs`).
* **Database & Engine**: Hasura GraphQL Engine, PostgreSQL, Docker Compose.

---

## Architecture Flow
1. User logs in/signs up via the **React Frontend**.
2. **Express Server** validates credentials against **PostgreSQL**, signs a JWT containing Hasura session claims, and returns it to the client.
3. React Frontend stores the JWT and sends it in the `Authorization: Bearer <token>` header for all queries and mutations to **Hasura**.
4. **Hasura** verifies the JWT using the shared secret key, extracts the claims, and applies Row-Level Permissions (e.g., users can only view or manage friends where `user_id` matches their own ID).

---

## Step-by-Step Setup Guide

### 1. Prerequisites
Make sure you have installed:
* [Docker and Docker Compose](https://www.docker.com/products/docker-desktop/)
* [Node.js (v16 or higher)](https://nodejs.org/)

---

### 2. Start PostgreSQL & Hasura Engine (Docker)
1. Open a terminal in the root directory.
2. Navigate to the `docker` directory:
   ```bash
   cd docker
   ```
3. Spin up the containers:
   ```bash
   docker compose up -d
   ```
This will start PostgreSQL on port `5432` and Hasura on port `8080`. It will also automatically create the `users` and `friends` tables using the `init.sql` script.

---

### 3. Track Tables & Configure Permissions in Hasura Console
Since Hasura needs to know which tables to expose over GraphQL and what security permissions to apply, follow these simple steps:

1. Open your browser and navigate to the Hasura Console: **[http://localhost:8080/console](http://localhost:8080/console)**.
2. If prompted for an admin secret, enter: `myadminsecretkey` (defined in `docker-compose.yml`).
3. Click on the **Data** tab at the top menu.
4. Click on the **public** schema. Under "Untracked tables or views", you will see `friends` and `users`.
5. Click **Track All** (or click **Track** next to both `users` and `friends`).
6. Click **Track All** under "Untracked foreign-key relations" to establish relationships between tables.

#### Set Up Security Permissions for the `friends` Table:
To ensure users can only view and manage their own friends, configure permissions for the `user` role:
1. In the left panel of the Data tab, click on the **friends** table.
2. Go to the **Permissions** tab.
3. In the text box under **Role**, type `user`.
4. Click on the cell corresponding to **Insert** permissions:
   * **Row insert permission**: Choose **With custom check**.
   * Enter the check: `{"user_id":{"_eq":"X-Hasura-User-Id"}}`
   * **Column preset**: Under Column presets, select `user_id` from **Session-variable** `x-hasura-user-id` (this automatically links the inserted friend to the logged-in user).
   * **Column input permissions**: Select (check) all columns (`name`, `email`, `phone`).
   * Click **Save Permissions**.
5. Click on the cell corresponding to **Select** permissions:
   * **Row select permission**: Choose **With custom check**.
   * Enter the check: `{"user_id":{"_eq":"X-Hasura-User-Id"}}`
   * **Column select permissions**: Select **All** columns.
   * Click **Save Permissions**.
6. Click on the cell corresponding to **Delete** permissions:
   * **Row delete permission**: Choose **With custom check**.
   * Enter the check: `{"user_id":{"_eq":"X-Hasura-User-Id"}}`
   * Click **Save Permissions**.

---

### 4. Start the Express Auth Server
1. Open a new terminal window.
2. Navigate to the `backend-express` directory:
   ```bash
   cd backend-express
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
The Express server will start running on **[http://localhost:5000](http://localhost:5000)**. It connects to the running PostgreSQL database to perform signups/logins.

---

### 5. Start the React Frontend
1. Open a new terminal window.
2. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the link provided in the terminal (usually **[http://localhost:5173](http://localhost:5173)**) to load the application!

---

## Project Structure
```text
friends list/
│
├── backend-express/        # Node/Express JWT Auth Server
│   ├── db.js               # Postgres connection pooling
│   ├── auth.js             # Signup and Login handlers
│   ├── server.js           # Server setup & routes
│   └── .env                # Port, Database URL, JWT Secrets
│
├── docker/                 # Database and Engine Config
│   ├── docker-compose.yml  # Config for Postgres & Hasura
│   └── init.sql            # Script creating users & friends tables
│
└── frontend/               # Vite React Client
    ├── src/
    │   ├── apollo.js       # Apollo Client setup with headers
    │   ├── queries.js      # GraphQL Operations
    │   ├── App.jsx         # UI view management & logic
    │   └── index.css       # HSL glassmorphic stylesheet
    └── package.json
```
