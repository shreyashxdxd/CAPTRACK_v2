import { useState } from "react";
import ReceiptScanner from "./components/ReceiptScanner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Car,
  Check,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Plus,
  Receipt,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Utensils,
  UserPlus,
  UserRound,
  Wallet,
} from "lucide-react";

const categories = [
  { name: "Food", icon: Utensils },
  { name: "Transport", icon: Car },
  { name: "Personal", icon: ShoppingBag },
  { name: "Medical", icon: HeartPulse },
  { name: "Entertainment", icon: Gamepad2 },
  { name: "Education", icon: GraduationCap },
  { name: "Bills", icon: Home },
  { name: "Other", icon: Receipt },
];

const weeklyData = [
  { day: "Mon", amount: 1240 },
  { day: "Tue", amount: 860 },
  { day: "Wed", amount: 1980 },
  { day: "Thu", amount: 1120 },
  { day: "Fri", amount: 2460 },
  { day: "Sat", amount: 1740 },
  { day: "Sun", amount: 920 },
];

const previousWeeklyData = [
  { day: "Mon", amount: 1420 },
  { day: "Tue", amount: 1180 },
  { day: "Wed", amount: 1760 },
  { day: "Thu", amount: 1340 },
  { day: "Fri", amount: 2320 },
  { day: "Sat", amount: 1960 },
  { day: "Sun", amount: 1080 },
];

const weeklyCategories = [
  { name: "Food", amount: 4380, color: "bg-white" },
  { name: "Transport", amount: 2140, color: "bg-zinc-400" },
  { name: "Personal", amount: 1800, color: "bg-zinc-600" },
  { name: "Bills", amount: 1200, color: "bg-zinc-700" },
];

const weeklyTotal = weeklyData.reduce((total, day) => total + day.amount, 0);
const previousWeeklyTotal = previousWeeklyData.reduce(
  (total, day) => total + day.amount,
  0
);
const predictedWeeklySpend = Math.round(
  (previousWeeklyTotal + weeklyTotal) / 2
);
const predictedMonthlySpend = Math.round(predictedWeeklySpend * 4.33);
const weeklyTrendPercentage =
  ((weeklyTotal - previousWeeklyTotal) / previousWeeklyTotal) * 100;
const highestWeeklySpend = Math.max(...weeklyData.map((day) => day.amount));
const loggedInSalary = 50000;
const weeklyBudget = loggedInSalary / 4;

function formatCurrency(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function App() {
  const [screen, setScreen] = useState("home");

  const [salary, setSalary] = useState("");
  const [expenses, setExpenses] = useState([]);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [dashboardExpenses, setDashboardExpenses] = useState([]);
  const [dashboardAmount, setDashboardAmount] = useState("");
  const [dashboardCategory, setDashboardCategory] = useState("Food");
  const [dashboardDescription, setDashboardDescription] = useState("");
  const [showDashboardExpenseForm, setShowDashboardExpenseForm] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupNotice, setSignupNotice] = useState(false);
  const totalSpent = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const remaining = Number(salary) - totalSpent;

  const salaryPercentage =
    Number(salary) > 0 ? (totalSpent / Number(salary)) * 100 : 0;

  const categoryTotals = {};

  expenses.forEach((expense) => {
    categoryTotals[expense.category] =
      (categoryTotals[expense.category] || 0) + expense.amount;
  });

  const dashboardTotal = dashboardExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );
  const dashboardCategoryTotals = {};

  dashboardExpenses.forEach((expense) => {
    dashboardCategoryTotals[expense.category] =
      (dashboardCategoryTotals[expense.category] || 0) + expense.amount;
  });

  const weeklyBudgetRemaining = Math.max(weeklyBudget - weeklyTotal, 0);
  const weeklyBudgetPercentage = (weeklyTotal / loggedInSalary) * 100;

  const handleSalarySubmit = () => {
    if (!salary || Number(salary) <= 0) return;
    setScreen("expenses");
  };

  const handleLogin = () => {
    if (loginUsername === "Arpit_Bala" && loginPassword === "Arpit@123") {
      setLoginError("");
      setSalary(String(loggedInSalary));
      setScreen("dashboard");
      return;
    }

    setLoginError("Those credentials do not match. Please try again.");
  };

  const handleAddExpense = () => {
    if (!amount || Number(amount) <= 0) return;

    const newExpense = {
      id: Date.now(),
      amount: Number(amount),
      category,
      description: description.trim(),
    };

    setExpenses((current) => [...current, newExpense]);

    setAmount("");
    setDescription("");
    setCategory("Food");
    setShowExpenseForm(false);
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
    setSignupNotice(false);
  };

  const handleAddDashboardExpense = () => {
    if (!dashboardAmount || Number(dashboardAmount) <= 0) return;

    setDashboardExpenses((current) => [
      ...current,
      {
        id: Date.now(),
        amount: Number(dashboardAmount),
        category: dashboardCategory,
        description: dashboardDescription.trim(),
      },
    ]);

    setDashboardAmount("");
    setDashboardCategory("Food");
    setDashboardDescription("");
    setShowDashboardExpenseForm(false);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((current) =>
      current.filter((expense) => expense.id !== id)
    );
  };

  const resetApp = () => {
    setScreen("home");
    setSalary("");
    setExpenses([]);
    setAmount("");
    setDescription("");
    setCategory("Food");
    setShowExpenseForm(false);
    setDashboardExpenses([]);
    setDashboardAmount("");
    setDashboardCategory("Food");
    setDashboardDescription("");
    setShowDashboardExpenseForm(false);
  };

  return (
  <main className="min-h-screen bg-[#070707] text-white selection:bg-white selection:text-black">

    {showOCR && (
      <ReceiptScanner
        onExpenseDetected={(newExpense) => {
          setExpenses((current) => [...current, newExpense]);
        }}
        onClose={() => {
          setShowOCR(false);
        }}
      />
    )}

    {/* Decorative background */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between">
  {screen !== "home" ? (
    <button
      onClick={resetApp}
      className="text-sm font-black tracking-[0.28em] text-white"
    >
      CAPTRACK
    </button>
  ) : (
    <div />
  )}

  {screen !== "home" && (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <Wallet size={14} />
      Personal Finance
    </div>
  )}
</header>

        {/* ================= HOME ================= */}
{screen === "home" && (
  <section className="flex-1 py-12 sm:py-20">
    <div className="mx-auto w-full max-w-5xl">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
          <Sparkles size={14} />
          Personal finance, made clear
        </div>

        <h1 className="mt-6 text-6xl font-black leading-[0.9] tracking-[-0.07em] sm:text-8xl">
          CAPTRACK
        </h1>

        <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
          See every rupee with more clarity. Track expenses, scan receipts,
          and understand the habits behind your spending.
        </p>
      </div>

      <div className="mt-12 grid gap-3 md:grid-cols-3">
        {[
          {
            icon: Receipt,
            title: "Scan receipts",
            text: "Turn a receipt image into a ready-to-review expense.",
          },
          {
            icon: BarChart3,
            title: "Read your patterns",
            text: "See category breakdowns before small costs become surprises.",
          },
          {
            icon: TrendingUp,
            title: "Build better weeks",
            text: "Use simple insights to make your next spending decision count.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="border-t border-zinc-800 bg-zinc-950/60 p-5 sm:p-6"
          >
            <Icon size={20} className="text-zinc-300" />
            <h2 className="mt-8 font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-zinc-800 pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
          Choose your way in
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <button
            onClick={() => setScreen("salary")}
            className="group flex items-center justify-between rounded-2xl bg-white px-5 py-5 text-left text-black transition hover:bg-zinc-200"
          >
            <span>
              <span className="block font-bold">Continue as Guest</span>
              <span className="mt-1 block text-xs text-zinc-500">Start with your salary</span>
            </span>
            <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => setSignupNotice(true)}
            className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-5 text-left transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <UserPlus size={19} className="text-zinc-400" />
            <span>
              <span className="block font-bold">Sign up</span>
              <span className="mt-1 block text-xs text-zinc-500">Create a new account</span>
            </span>
          </button>

          <button
            onClick={() => {
              setLoginError("");
              setScreen("login");
            }}
            className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-5 text-left transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <UserRound size={19} className="text-zinc-400" />
            <span>
              <span className="block font-bold">Login</span>
              <span className="mt-1 block text-xs text-zinc-500">Open your dashboard</span>
            </span>
          </button>
        </div>

        {signupNotice && (
          <div className="mt-4 border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm text-zinc-300">
            Sign Up option is currently unavailable.
          </div>
        )}
      </div>
    </div>
  </section>
)}

        {/* ================= LOGIN ================= */}
{screen === "login" && (
  <section className="flex flex-1 items-center justify-center py-16">
    <div className="w-full max-w-md">
      <button
        onClick={() => setScreen("home")}
        className="mb-12 flex items-center gap-2 text-sm text-zinc-600 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
          Welcome back
        </p>
        <h2 className="mt-3 text-4xl font-black">Your dashboard.</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Login to view your weekly spending snapshot.
        </p>

        <label className="mt-8 block text-xs font-semibold uppercase tracking-widest text-zinc-600">
          Username
        </label>
        <input
          autoFocus
          value={loginUsername}
          onChange={(event) => setLoginUsername(event.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-zinc-500"
          placeholder="Username"
        />

        <label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-zinc-600">
          Password
        </label>
        <input
          type="password"
          value={loginPassword}
          onChange={(event) => setLoginPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleLogin();
          }}
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-zinc-500"
          placeholder="Password"
        />

        {loginError && <p className="mt-4 text-sm text-red-300">{loginError}</p>}

        <button
          onClick={handleLogin}
          className="mt-6 flex w-full items-center justify-between rounded-xl bg-white px-5 py-4 font-bold text-black transition hover:bg-zinc-200"
        >
          LOGIN
          <ArrowRight size={19} />
        </button>
      </div>
    </div>
  </section>
)}

        {/* ================= DASHBOARD ================= */}
{screen === "dashboard" && (
  <section className="flex-1 py-10">
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-600">
            Weekly overview
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Good to see you, Arpit.
          </h2>
          <p className="mt-3 text-zinc-400">
            A clear look at the week behind you.
          </p>
        </div>

        <span className="w-fit rounded-full border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400">
          18 - 24 September 2026
        </span>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 text-black">
          <p className="text-sm text-zinc-500">Total spent this week</p>
          <p className="mt-2 text-5xl font-black">{formatCurrency(weeklyTotal)}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <TrendingUp size={15} /> 8.4% lower than last week
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-600">Daily average</p>
          <p className="mt-2 text-3xl font-black">{formatCurrency(Math.round(weeklyTotal / 7))}</p>
          <p className="mt-3 text-sm text-zinc-500">Your Friday was the busiest.</p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-600">Weekly budget</p>
          <p className="mt-2 text-3xl font-black">{formatCurrency(weeklyBudgetRemaining)}</p>
          <p className="mt-3 text-sm text-zinc-500">
            {weeklyBudgetPercentage.toFixed(1)}% of ₹50,000 salary used
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
              Forecast
            </p>
            <h3 className="mt-2 text-2xl font-black">What next week may look like.</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Based on the average of your previous and current weekly spending.
            </p>
          </div>
          <TrendingUp size={22} className="text-zinc-500" />
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 text-black">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Next week prediction
            </p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(predictedWeeklySpend)}</p>
            <p className="mt-2 text-sm text-zinc-500">Average weekly spend</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Monthly prediction
            </p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(predictedMonthlySpend)}</p>
            <p className="mt-2 text-sm text-zinc-500">4.33 predicted weeks combined</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Salary outlook
            </p>
            <p className="mt-3 text-3xl font-black">
              {((predictedMonthlySpend / loggedInSalary) * 100).toFixed(1)}%
            </p>
            <p className="mt-2 text-sm text-zinc-500">Of your ₹50,000 monthly salary</p>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-800 pt-5 text-sm leading-6 text-zinc-400">
          {weeklyTrendPercentage < 0 ? (
            <p>
              You are currently spending {Math.abs(weeklyTrendPercentage).toFixed(1)}% less than last week.
              Holding that improvement could leave approximately {formatCurrency(Math.max(loggedInSalary - predictedMonthlySpend, 0))} after predicted monthly spending.
            </p>
          ) : (
            <p>
              You are currently spending {weeklyTrendPercentage.toFixed(1)}% more than last week.
              Keeping this pace would leave approximately {formatCurrency(Math.max(loggedInSalary - predictedMonthlySpend, 0))} after predicted monthly spending.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold">Today's expenses</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Add a purchase to update your dashboard.
            </p>
          </div>

          {!showDashboardExpenseForm && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => {
                  setShowExpenseForm(true);
                  setScreen("expenses");
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-zinc-200"
              >
                <Plus size={17} />
                ADD EXPENSE
              </button>
              <button
                onClick={() => {
                  setScreen("expenses");
                  setShowOCR(true);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-white transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                <Receipt size={17} />
                SCAN RECEIPT
              </button>
            </div>
          )}
        </div>

        {showDashboardExpenseForm && (
          <div className="mt-6 border-t border-zinc-800 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                  Amount
                </label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-zinc-600">₹</span>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    value={dashboardAmount}
                    onChange={(event) => setDashboardAmount(event.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-10 py-4 outline-none focus:border-zinc-500"
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                  Description
                </label>
                <input
                  value={dashboardDescription}
                  onChange={(event) => setDashboardDescription(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-zinc-500"
                  placeholder="Lunch, commute, groceries..."
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Category
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const selected = dashboardCategory === item.name;

                  return (
                    <button
                      key={item.name}
                      onClick={() => setDashboardCategory(item.name)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${
                        selected
                          ? "border-white bg-white text-black"
                          : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDashboardExpenseForm(false)}
                className="flex-1 rounded-xl border border-zinc-800 py-4 text-sm font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDashboardExpense}
                disabled={!dashboardAmount || Number(dashboardAmount) <= 0}
                className="flex-[2] rounded-xl bg-white py-4 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ADD TODAY'S EXPENSE
              </button>
            </div>
          </div>
        )}

        {dashboardExpenses.length > 0 && (
          <div className="mt-6 grid gap-6 border-t border-zinc-800 pt-6 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-zinc-600">Added today</p>
                  <p className="mt-1 text-3xl font-black">{formatCurrency(dashboardTotal)}</p>
                </div>
                <span className="text-sm text-zinc-600">{dashboardExpenses.length} {dashboardExpenses.length === 1 ? "expense" : "expenses"}</span>
              </div>

              <div className="mt-5 space-y-2">
                {dashboardExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{expense.description || expense.category}</p>
                      <p className="mt-1 text-xs text-zinc-600">{expense.category}</p>
                    </div>
                    <span className="ml-3 text-sm font-bold">{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-64 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(dashboardCategoryTotals).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {Object.keys(dashboardCategoryTotals).map((categoryName, index) => (
                      <Cell
                        key={categoryName}
                        fill={["#ffffff", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#d4d4d8"][index % 6]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                    contentStyle={{
                      backgroundColor: "#09090b",
                      border: "1px solid #27272a",
                      borderRadius: "12px",
                      color: "#ffffff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-zinc-600">TODAY</span>
                <span className="mt-1 text-xl font-black">{formatCurrency(dashboardTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Daily spending</h3>
              <p className="mt-1 text-sm text-zinc-600">Your activity across the last seven days</p>
            </div>
            <BarChart3 size={20} className="text-zinc-600" />
          </div>

          <div className="mt-8 flex h-56 items-end justify-between gap-2 border-b border-zinc-800 px-1">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                <span className="text-[10px] text-zinc-600">₹{(day.amount / 1000).toFixed(1)}k</span>
                <div
                  className="w-full max-w-10 rounded-t-lg bg-zinc-300 transition-all hover:bg-white"
                  style={{ height: `${Math.max((day.amount / highestWeeklySpend) * 78, 8)}%` }}
                />
                <span className="pb-3 text-xs font-semibold text-zinc-500">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
          <h3 className="text-xl font-bold">Where it went</h3>
          <p className="mt-1 text-sm text-zinc-600">Top categories this week</p>

          <div className="mt-8 space-y-6">
            {weeklyCategories.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-zinc-400">{formatCurrency(item.amount)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-zinc-900">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${(item.amount / weeklyTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Best day</p>
          <p className="mt-3 text-2xl font-black">Tuesday</p>
          <p className="mt-1 text-sm text-zinc-500">Only ₹860 spent</p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Watch this</p>
          <p className="mt-3 text-2xl font-black">Food</p>
          <p className="mt-1 text-sm text-zinc-500">54% of your weekly spend</p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Weekly rhythm</p>
          <p className="mt-3 text-2xl font-black">Steady</p>
          <p className="mt-1 text-sm text-zinc-500">One high-spend day to review</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-6">
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Sparkles size={15} /> Built from your weekly activity
        </p>
        <button onClick={resetApp} className="text-sm font-semibold text-zinc-500 transition hover:text-white">
          Log out
        </button>
      </div>
    </div>
  </section>
)}

        {/* ================= SALARY ================= */}
{screen === "salary" && (
  <section className="flex flex-1 items-center justify-center py-16">
    <div className="w-full max-w-lg">

      <button
        onClick={() => setScreen("home")}
        className="mb-12 flex items-center gap-2 text-sm text-zinc-600 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="text-center">

        <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
          What's your
          <br />
          monthly salary?
        </h2>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-500">
          Enter your monthly income so CAPTRACK can put your spending into
          perspective.
        </p>

        <div className="relative mt-10">

          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-zinc-600">
            ₹
          </span>

          <input
            autoFocus
            type="number"
            min="0"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSalarySubmit();
            }}
            placeholder="30,000"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-12 py-5 text-center text-2xl font-semibold outline-none transition placeholder:text-zinc-700 focus:border-zinc-500"
          />

        </div>

        <button
          onClick={handleSalarySubmit}
          disabled={!salary || Number(salary) <= 0}
          className="group mt-4 flex w-full items-center justify-between rounded-2xl bg-white px-6 py-5 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span>CONTINUE</span>

          <ArrowRight
            size={20}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>

      </div>
    </div>
  </section>
)}

        {/* ================= EXPENSES ================= */}
        {screen === "expenses" && (
          <section className="flex-1 py-10">
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>

                  <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                    Today's expenses.
                  </h2>

                  <p className="mt-3 text-zinc-400">
                    Add everything you spent today.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4">
                  <p className="text-xs text-zinc-600">Monthly salary</p>
                  <p className="mt-1 text-lg font-bold">
                    {formatCurrency(salary)}
                  </p>
                </div>
              </div>

              {/* Add expense */}
              {!showExpenseForm && (
  <div className="mt-8 grid gap-3 sm:grid-cols-2">
    <button
      onClick={() => setShowExpenseForm(true)}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 py-5 font-bold transition hover:border-zinc-500 hover:bg-zinc-900"
    >
      <Plus size={19} />
      ADD EXPENSE
    </button>

    <button
      onClick={() => setShowOCR(true)}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-bold text-black transition hover:bg-zinc-200 active:scale-[0.98]"
    >
      <Receipt size={19} />
      SCAN IMAGE
    </button>
  </div>
)}

              {showExpenseForm && (
                <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">New expense</h3>

                    <button
                      onClick={() => setShowExpenseForm(false)}
                      className="text-sm text-zinc-600 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-7">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                      Amount
                    </label>

                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-zinc-600">
                        ₹
                      </span>

                      <input
                        autoFocus
                        type="number"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="500"
                        className="w-full rounded-xl border border-zinc-800 bg-black px-10 py-4 text-lg outline-none focus:border-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                      Category
                    </label>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {categories.map((item) => {
                        const Icon = item.icon;
                        const selected = category === item.name;

                        return (
                          <button
                            key={item.name}
                            onClick={() => setCategory(item.name)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${
                              selected
                                ? "border-white bg-white text-black"
                                : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-600 hover:text-white"
                            }`}
                          >
                            <Icon size={16} />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                      Description
                    </label>

                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Lunch, auto, movie..."
                      className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-zinc-500"
                    />
                  </div>

                  <button
                    onClick={handleAddExpense}
                    disabled={!amount || Number(amount) <= 0}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Check size={18} />
                    ADD EXPENSE
                  </button>
                </div>
              )}

              {/* Expense list */}
              {expenses.length > 0 && (
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold">Added expenses</h3>
                    <span className="text-sm text-zinc-600">
                      {expenses.length}{" "}
                      {expenses.length === 1 ? "expense" : "expenses"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {expenses.map((expense) => {
                      const categoryData = categories.find(
                        (item) => item.name === expense.category
                      );

                      const Icon = categoryData?.icon || Receipt;

                      return (
                        <div
                          key={expense.id}
                          className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900">
                            <Icon size={19} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">
                              {expense.description || expense.category}
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {expense.category}
                            </p>
                          </div>

                          <p className="font-bold">
                            {formatCurrency(expense.amount)}
                          </p>

                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-zinc-700 transition hover:text-red-400"
                            aria-label="Delete expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="mt-5 flex items-end justify-between rounded-3xl bg-white p-6 text-black">
                    <div>
                      <p className="text-sm text-zinc-500">
                        Total spent today
                      </p>

                      <p className="mt-1 text-4xl font-black">
                        {formatCurrency(totalSpent)}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-zinc-500">
                      {salaryPercentage.toFixed(1)}% of salary
                    </p>
                  </div>

                  <button
                    onClick={() => setScreen("analysis")}
                    className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white px-6 py-5 font-bold text-black transition hover:bg-zinc-200"
                  >
                    Analyze my spending
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================= ANALYSIS ================= */}
        {screen === "analysis" && (
          <section className="flex-1 py-10">
            <div className="mx-auto w-full max-w-4xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-600">
                    Your results
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                    Here's where it went.
                  </h2>
                </div>

                <button
                  onClick={() => setScreen("expenses")}
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
                >
                  <ArrowLeft size={16} />
                  Edit expenses
                </button>
              </div>

              {/* Main stats */}
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-white p-6 text-black sm:col-span-2">
                  <p className="text-sm text-zinc-500">Total spent</p>

                  <p className="mt-2 text-5xl font-black">
                    {formatCurrency(totalSpent)}
                  </p>

                  <p className="mt-3 text-sm text-zinc-500">
                    out of {formatCurrency(salary)} monthly income
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                    <p className="text-xs text-zinc-600">Income spent</p>
                    <p className="mt-2 text-2xl font-black">
                      {salaryPercentage.toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                    <p className="text-xs text-zinc-600">Remaining</p>
                    <p className="mt-2 text-2xl font-black">
                      {formatCurrency(Math.max(remaining, 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spending chart */}
<div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
  <div className="text-center">
    <h3 className="text-xl font-bold">
      Your spending
    </h3>

    <p className="mt-1 text-sm text-zinc-600">
      Where your money went today
    </p>
  </div>

  <div className="relative mx-auto mt-6 h-64 w-full max-w-sm">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={Object.entries(categoryTotals).map(
            ([name, value]) => ({
              name,
              value,
            })
          )}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {Object.entries(categoryTotals).map(
            ([categoryName], index) => (
              <Cell
                key={categoryName}
                fill={
                  [
                    "#ffffff",
                    "#a1a1aa",
                    "#71717a",
                    "#52525b",
                    "#3f3f46",
                    "#27272a",
                    "#d4d4d8",
                    "#18181b",
                  ][index % 8]
                }
              />
            )
          )}
        </Pie>

        <Tooltip
          formatter={(value) =>
            `₹${Number(value).toLocaleString("en-IN")}`
          }
          contentStyle={{
            backgroundColor: "#09090b",
            border: "1px solid #27272a",
            borderRadius: "12px",
            color: "#ffffff",
          }}
        />
      </PieChart>
    </ResponsiveContainer>

    {/* Center text */}
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-xs text-zinc-600">
        TOTAL
      </span>

      <span className="mt-1 text-2xl font-black">
        {formatCurrency(totalSpent)}
      </span>
    </div>
  </div>
</div>

              {/* Breakdown */}
              <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      Spending breakdown
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      Percentage of your total spending
                    </p>
                  </div>

                  <Receipt size={20} className="text-zinc-700" />
                </div>

                <div className="mt-7 space-y-5">
                  {Object.entries(categoryTotals)
                    .sort(([, a], [, b]) => b - a)
                    .map(([categoryName, categoryAmount]) => {
                      const percentage =
                        totalSpent > 0
                          ? (categoryAmount / totalSpent) * 100
                          : 0;

                      const categoryData = categories.find(
                        (item) => item.name === categoryName
                      );

                      const Icon = categoryData?.icon || Receipt;

                      return (
                        <div key={categoryName}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900">
                              <Icon size={16} />
                            </div>

                            <div className="flex-1">
                              <div className="flex justify-between gap-4">
                                <span className="font-medium">
                                  {categoryName}
                                </span>

                                <span className="font-bold">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-zinc-600">
                                {formatCurrency(categoryAmount)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
                            <div
                              className="h-full rounded-full bg-white transition-all duration-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Insight */}
{Object.entries(categoryTotals).length > 0 && (
  <div className="mt-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
      Quick insight
    </p>

    <p className="mt-3 text-lg leading-7 text-zinc-300">
      You spent the most on{" "}
      <span className="font-bold text-white">
        {
          Object.entries(categoryTotals).sort(
            ([, a], [, b]) => b - a
          )[0][0]
        }
      </span>
      {" — "}
      {formatCurrency(
        Object.entries(categoryTotals).sort(
          ([, a], [, b]) => b - a
        )[0][1]
      )}{" "}
      of your total spending.
    </p>
  </div>
)}

              <button
                onClick={resetApp}
                className="mx-auto mt-8 flex items-center gap-2 text-sm text-zinc-600 transition hover:text-white"
              >
                Start a new analysis
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
      </div>
    </main>
  );
}

export default App;