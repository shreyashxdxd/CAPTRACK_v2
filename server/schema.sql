CREATE DATABASE IF NOT EXISTS captrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE captrack;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salary DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_username_unique (username)
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(40) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY expenses_user_created_idx (user_id, created_at),
  CONSTRAINT expenses_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

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
);
