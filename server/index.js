import "dotenv/config";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

const app = express();
const port = Number(process.env.API_PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || "captrack-local-development-secret";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "captrack",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

function createToken(user) {
  return jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
}

function requireAuth(request, response, next) {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return response.status(401).json({ message: "Authentication required." });
  }

  try {
    request.userId = jwt.verify(token, jwtSecret).userId;
    return next();
  } catch {
    return response.status(401).json({ message: "Your session has expired." });
  }
}

function validateCredentials(name, username, password, salary) {
  if (!name?.trim() || !username?.trim() || !password || Number(salary) <= 0) {
    return "Name, username, password, and a positive salary are required.";
  }

  if (username.trim().length < 3 || password.length < 6) {
    return "Username must have 3 characters and password must have 6 characters.";
  }

  return null;
}

function getCurrentMonthEnd() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
}

app.get("/api/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    return response.json({ ok: true });
  } catch {
    return response.status(503).json({ ok: false, message: "MySQL is unavailable." });
  }
});

app.post("/api/auth/register", async (request, response) => {
  const { name, username, password, salary } = request.body;
  const validationError = validateCredentials(name, username, password, salary);

  if (validationError) return response.status(400).json({ message: validationError });

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      "INSERT INTO users (name, username, password_hash, salary) VALUES (?, ?, ?, ?)",
      [name.trim(), username.trim(), passwordHash, Number(salary)]
    );
    const user = { id: result.insertId, name: name.trim(), username: username.trim(), salary: Number(salary) };

    return response.status(201).json({ token: createToken(user), user, expenses: [] });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({ message: "That username is already registered." });
    }

    console.error(error);
    return response.status(500).json({ message: "Could not create the account." });
  }
});

app.post("/api/auth/login", async (request, response) => {
  const { username, password } = request.body;

  if (!username?.trim() || !password) {
    return response.status(400).json({ message: "Username and password are required." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, name, username, password_hash, salary FROM users WHERE username = ? LIMIT 1",
      [username.trim()]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({ message: "Those credentials do not match." });
    }

    const [expenses] = await pool.execute(
      "SELECT id, amount, category, description, created_at AS createdAt FROM expenses WHERE user_id = ? ORDER BY created_at DESC, id DESC",
      [user.id]
    );

    return response.json({
      token: createToken(user),
      user: { id: user.id, name: user.name, username: user.username, salary: Number(user.salary) },
      expenses,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: "Could not log in." });
  }
});

app.get("/api/me", requireAuth, async (request, response) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, username, salary FROM users WHERE id = ? LIMIT 1",
      [request.userId]
    );
    const user = rows[0];

    if (!user) return response.status(404).json({ message: "User not found." });

    const [expenses] = await pool.execute(
      "SELECT id, amount, category, description, created_at AS createdAt FROM expenses WHERE user_id = ? ORDER BY created_at DESC, id DESC",
      [user.id]
    );

    return response.json({
      user: { id: user.id, name: user.name, username: user.username, salary: Number(user.salary) },
      expenses,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: "Could not load your account." });
  }
});

app.post("/api/expenses", requireAuth, async (request, response) => {
  const { amount, category, description } = request.body;

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !category?.trim()) {
    return response.status(400).json({ message: "A positive amount and category are required." });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO expenses (user_id, amount, category, description) VALUES (?, ?, ?, ?)",
      [request.userId, Number(amount), category.trim(), description?.trim() || null]
    );
    const [rows] = await pool.execute(
      "SELECT id, amount, category, description, created_at AS createdAt FROM expenses WHERE id = ?",
      [result.insertId]
    );

    return response.status(201).json({ expense: rows[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: "Could not save the expense." });
  }
});

app.delete("/api/expenses/:id", requireAuth, async (request, response) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [request.params.id, request.userId]
    );

    if (!result.affectedRows) return response.status(404).json({ message: "Expense not found." });
    return response.status(204).end();
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: "Could not delete the expense." });
  }
});

app.get("/api/goals", requireAuth, async (request, response) => {
  try {
    const [goals] = await pool.execute(
      "SELECT id, title, target_amount AS targetAmount, saved_amount AS savedAmount, target_date AS targetDate, created_at AS createdAt FROM goals WHERE user_id = ? ORDER BY created_at DESC, id DESC",
      [request.userId]
    );
    return response.json({ goals });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: "Could not load your goals." });
  }
});

app.post("/api/goals", requireAuth, async (request, response) => {
  const { title, targetAmount, savedAmount } = request.body;

  if (!title?.trim() || !Number.isFinite(Number(targetAmount)) || Number(targetAmount) <= 0 || Number(savedAmount || 0) < 0) {
    return response.status(400).json({ message: "A title and positive target amount are required." });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO goals (user_id, title, target_amount, saved_amount, target_date) VALUES (?, ?, ?, ?, ?)",
      [request.userId, title.trim(), Number(targetAmount), Number(savedAmount || 0), getCurrentMonthEnd()]
    );
    const [goals] = await pool.execute(
      "SELECT id, title, target_amount AS targetAmount, saved_amount AS savedAmount, target_date AS targetDate, created_at AS createdAt FROM goals WHERE id = ?",
      [result.insertId]
    );
    return response.status(201).json({ goal: goals[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: "Could not save your goal." });
  }
});

app.delete("/api/goals/:id", requireAuth, async (request, response) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM goals WHERE id = ? AND user_id = ?",
      [request.params.id, request.userId]
    );
    if (!result.affectedRows) return response.status(404).json({ message: "Goal not found." });
    return response.status(204).end();
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: "Could not delete your goal." });
  }
});

async function initializeDatabase() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS goals (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id INT UNSIGNED NOT NULL,
        title VARCHAR(120) NOT NULL,
        target_amount DECIMAL(12, 2) NOT NULL,
        saved_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        target_date DATE NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY goals_user_created_idx (user_id, created_at),
        CONSTRAINT goals_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
  } catch (error) {
    console.error("Could not initialize the goals table:", error.message);
  }
}

initializeDatabase().finally(() => {
  app.listen(port, () => {
    console.log(`CAPTRACK API listening at http://localhost:${port}`);
  });
});
