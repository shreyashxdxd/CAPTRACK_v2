import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "captrack",
  decimalNumbers: true,
});

const seedExpenses = [
  ["2026-09-01 09:15:00", 1200, "Bills", "Electricity bill"],
  ["2026-09-03 13:20:00", 850, "Food", "Groceries"],
  ["2026-09-05 18:40:00", 1400, "Personal", "Clothing and essentials"],
  ["2026-09-07 08:10:00", 520, "Transport", "Fuel"],
  ["2026-09-09 20:15:00", 1100, "Entertainment", "Dinner and movie"],
  ["2026-09-12 10:30:00", 750, "Medical", "Pharmacy"],
  ["2026-09-13 09:00:00", 900, "Food", "Weekly groceries"],
  ["2026-09-14 08:30:00", 400, "Transport", "Cab and metro"],
  ["2026-09-15 14:45:00", 2200, "Bills", "Rent and utilities"],
  ["2026-09-16 19:20:00", 1400, "Personal", "Household supplies"],
  ["2026-09-17 11:10:00", 650, "Medical", "Doctor visit"],
  ["2026-09-18 21:00:00", 850, "Entertainment", "Streaming and dinner"],
  ["2026-09-19 16:30:00", 600, "Education", "Course materials"],
  ["2026-09-20 12:15:00", 950, "Food", "Lunch and groceries"],
  ["2026-09-20 18:30:00", 220, "Transport", "Auto fare"],
  ["2026-09-21 09:20:00", 1800, "Bills", "Internet and subscriptions"],
  ["2026-09-21 13:10:00", 480, "Food", "Lunch"],
  ["2026-09-22 17:40:00", 1250, "Personal", "Personal care"],
  ["2026-09-22 19:15:00", 700, "Medical", "Medicines"],
  ["2026-09-23 08:40:00", 860, "Food", "Groceries"],
  ["2026-09-23 18:20:00", 300, "Transport", "Metro and auto"],
  ["2026-09-24 20:00:00", 1100, "Entertainment", "Weekend plans"],
  ["2026-09-24 13:30:00", 620, "Food", "Lunch and snacks"],
  ["2026-09-25 09:30:00", 1500, "Bills", "Phone and utilities"],
  ["2026-09-25 16:00:00", 900, "Education", "Books and learning"],
  ["2026-09-26 12:45:00", 780, "Food", "Lunch"],
  ["2026-09-26 17:30:00", 450, "Personal", "Daily essentials"],
];

async function seed() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash("Arpit@123", 12);
    await connection.execute(
      `INSERT INTO users (name, username, password_hash, salary)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         salary = VALUES(salary)`,
      ["Arpit Bala", "Arpit_Bala", passwordHash, 55000]
    );

    const [users] = await connection.execute(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      ["Arpit_Bala"]
    );
    const userId = users[0].id;

    await connection.execute("DELETE FROM expenses WHERE user_id = ?", [userId]);

    for (const [createdAt, amount, category, description] of seedExpenses) {
      await connection.execute(
        `INSERT INTO expenses (user_id, amount, category, description, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, amount, category, description, createdAt]
      );
    }

    await connection.commit();
    console.log(`Seeded Arpit_Bala with ${seedExpenses.length} expenses and a monthly salary of ₹55,000.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Could not seed Arpit_Bala:", error.message);
  process.exitCode = 1;
});
