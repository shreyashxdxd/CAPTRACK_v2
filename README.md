# CAPTRACK_v2 (Second Prototype of the same Project)

> Track your capital. Know where your money goes.

CAPTRACK is a lightweight, mobile-friendly personal spending analysis web app that helps users understand how they spend their money.

Users create a local account, enter their monthly salary, add expenses with categories, and CAPTRACK generates a visual breakdown of their spending.

Account and expense data is stored in MySQL through the local backend. Receipt images are processed in the browser by OCR and are never uploaded or stored.

---

## Features

- Enter monthly salary
- Add multiple expenses
- Categorize expenses
- Add descriptions to expenses
- Remove expenses
- Visual spending breakdown
- Interactive spending donut chart
- Percentage of income spent
- Remaining income calculation
- Automatic spending insight
- Fully responsive design
- Fast client-side calculations
- Local account registration and login
- MySQL-backed user and expense persistence
- Receipt OCR without receipt storage
- Spending timeline and recurring expense patterns
- Twelve-week spending heatmap
- Persistent financial goals with progress tracking

---

## How It Works

CAPTRACK follows a simple three-step flow:

```CAPTRACK
   │
   ▼
Monthly Salary
   │
   ▼
Add Expenses
   │
   ▼
Spending Analysis
```

### 1. Enter Your Salary

Enter your monthly income.

Monthly Salary

₹30,000

### 2. Add Expenses

Add as many expenses as needed.

Each expense contains:

- Amount
- Category
- Description

Example:

Lunch
Food
₹500

Auto
Transport
₹200

Shopping
Personal
₹800

### 3. Analyze Your Spending

CAPTRACK calculates:

- Total amount spent
- Percentage of salary spent
- Remaining income
- Spending percentage by category
- Largest spending category

The results are presented through an interactive visual breakdown.

---

## Example

For a monthly salary of ₹30,000:

Food             ₹500
Transport        ₹200
Personal         ₹800
Medical          ₹300
Entertainment    ₹200

CAPTRACK calculates:

Total Spent       ₹2,000
Income Spent      6.7%
Remaining        ₹28,000

Category breakdown:

Personal          40%
Food              25%
Medical           15%
Transport         10%
Entertainment     10%

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React

### Development

- JavaScript
- npm
- Git
- Node.js and Express
- MySQL (XAMPP)

---

## Project Structure

```CAPTRACK/
│
├── public/
│
├── src/
│   ├── App.jsx
│   ├── api.js
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── index.js
│   └── schema.sql
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js
- npm
- Git
- XAMPP with Apache and MySQL available

installed on your system.

### Clone the repository

git clone <YOUR_REPOSITORY_URL>

### Navigate into the project

cd CAPTRACK

### Install dependencies

npm install

### Configure MySQL

1. Start MySQL in the XAMPP Control Panel.
2. Open phpMyAdmin at `http://localhost/phpmyadmin`.
3. Import `server/schema.sql`. It creates the `captrack` database and only the `users` and `expenses` tables.
4. Copy `.env.example` to `.env` and update the database values if your XAMPP MySQL setup uses a password.

The backend stores user name, username, a password hash, salary, and expense fields. It has no receipt or image column and no file-upload endpoint.

### Start the development server

npm run dev

In a second terminal, start the API:

npm run server

Or start both services together:

npm run dev:full

The application will be available at:

http://localhost:5173

The API runs at `http://localhost:3001`.

---

## Production Build

To create a production build:

npm run build

To preview the production build locally:

npm run preview

---

## Future Development

CAPTRACK is currently focused on manual expense analysis.

The next major version will introduce OCR-powered expense tracking.

Users will be able to upload images of:

- Bills
- Tickets
- Receipts
- Invoices

CAPTRACK will then extract useful information from the image automatically.

The planned pipeline is:

```Receipt Image
     │
     ▼
Image Preprocessing
     │
     ▼
OCR
     │
     ▼
Text Extraction
     │
     ├── Amount
     ├── Merchant
     ├── Date
     └── Items
     │
     ▼
Expense Categorization
     │
     ▼
Spending Analysis
```

Future versions may also include:

- Receipt OCR
- Automatic expense categorization
- Expense history
- Monthly spending trends
- Spending predictions
- Budget recommendations
- Advanced financial insights
- Persistent user data
- Cloud storage

---

## Project Goal

CAPTRACK aims to make personal financial analysis simple, visual, and accessible.

Instead of forcing users to maintain complicated spreadsheets or financial dashboards, CAPTRACK focuses on one simple question:

> Where is my money going?

---

## License

This project is currently developed as a personal/educational project.

More information about licensing will be added in future releases.

---

## Built With

Built with React, Tailwind CSS, Recharts, and a questionable amount of caffeine.

CAPTRACK — Track your capital. Know where your money goes.
