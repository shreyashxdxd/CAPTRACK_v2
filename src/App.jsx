import { useEffect, useState } from "react";
import ReceiptScanner from "./components/ReceiptScanner";
import {
  createExpense,
  deleteExpense,
  deleteGoal,
  createGoal,
  loadGoals,
  loadAccount,
  loginUser,
  registerUser,
} from "./api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Car,
  Check,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Plus,
  Receipt,
  Repeat2,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Target,
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

function formatCurrency(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function buildDailyData(expenses, weekOffset = 0) {
  const today = startOfDay(new Date());
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - weekOffset * 7);
  const firstDate = new Date(endDate);
  firstDate.setDate(endDate.getDate() - 6);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    const amount = expenses.reduce((total, expense) => {
      const expenseDate = new Date(expense.createdAt || expense.created_at);
      return expenseDate >= date && expenseDate < nextDate
        ? total + Number(expense.amount)
        : total;
    }, 0);

    return {
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      amount,
    };
  });
}

function getExpenseDate(expense) {
  return new Date(expense.createdAt || expense.created_at);
}

function buildHeatmap(expenses) {
  const today = startOfDay(new Date());
  const firstDate = new Date(today);
  firstDate.setDate(today.getDate() - 83);

  return Array.from({ length: 84 }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    const amount = expenses.reduce((total, expense) => {
      const expenseDate = getExpenseDate(expense);
      return expenseDate >= date && expenseDate < nextDate
        ? total + Number(expense.amount)
        : total;
    }, 0);

    return { date, amount };
  });
}

function getRecurringExpenses(expenses) {
  const grouped = {};

  expenses.forEach((expense) => {
    const description = expense.description?.trim().toLowerCase();
    if (!description) return;
    const key = `${expense.category}:${description}`;
    grouped[key] ||= [];
    grouped[key].push(expense);
  });

  return Object.values(grouped)
    .filter((items) => items.length >= 2)
    .map((items) => ({
      category: items[0].category,
      description: items[0].description,
      count: items.length,
      average: items.reduce((total, item) => total + Number(item.amount), 0) / items.length,
    }))
    .sort((first, second) => second.average - first.average);
}

function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("captrack_token"));
  const [authLoading, setAuthLoading] = useState(Boolean(authToken));

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
  const [goals, setGoals] = useState([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalSavedAmount, setGoalSavedAmount] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerSalary, setRegisterSalary] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [apiError, setApiError] = useState("");
  const loggedInSalary = Number(user?.salary || salary || 0);
  const weeklyBudget = loggedInSalary / 4;
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

  const weeklyData = buildDailyData(dashboardExpenses);
  const previousWeeklyData = buildDailyData(dashboardExpenses, 1);
  const weeklyTotal = weeklyData.reduce((total, day) => total + day.amount, 0);
  const previousWeeklyTotal = previousWeeklyData.reduce(
    (total, day) => total + day.amount,
    0
  );
  const predictedWeeklySpend = weeklyTotal || previousWeeklyTotal
    ? Math.round((previousWeeklyTotal + weeklyTotal) / 2)
    : 0;
  const predictedMonthlySpend = Math.round(predictedWeeklySpend * 4.33);
  const weeklyTrendPercentage = previousWeeklyTotal > 0
    ? ((weeklyTotal - previousWeeklyTotal) / previousWeeklyTotal) * 100
    : 0;
  const highestWeeklySpend = Math.max(...weeklyData.map((day) => day.amount), 0);
  const weeklyCategories = Object.entries(dashboardCategoryTotals)
    .map(([name, amount]) => ({ name, amount, color: "bg-zinc-400" }))
    .sort((first, second) => second.amount - first.amount);
  const lowestSpendDay = weeklyData.filter((day) => day.amount > 0).sort(
    (first, second) => first.amount - second.amount
  )[0];
  const topCategory = weeklyCategories[0];
  const weeklyRhythm = weeklyTotal === 0
    ? "No data yet"
    : highestWeeklySpend > weeklyTotal / 7 * 1.75
      ? "Variable"
      : "Steady";

  const weeklyBudgetRemaining = Math.max(weeklyBudget - weeklyTotal, 0);
  const weeklyBudgetPercentage = loggedInSalary > 0 ? (weeklyTotal / loggedInSalary) * 100 : 0;
  const heatmap = buildHeatmap(dashboardExpenses);
  const recurringExpenses = getRecurringExpenses(dashboardExpenses);

  useEffect(() => {
    if (!authToken) return;

    Promise.all([loadAccount(authToken), loadGoals(authToken)])
      .then(([account, goalResult]) => {
        const { user: accountUser, expenses: accountExpenses } = account;
        setUser(accountUser);
        setSalary(String(accountUser.salary));
        setExpenses(accountExpenses);
        setDashboardExpenses(accountExpenses);
        setGoals(goalResult.goals);
        setScreen("dashboard");
      })
      .catch(() => {
        localStorage.removeItem("captrack_token");
        setAuthToken(null);
      })
      .finally(() => setAuthLoading(false));
  }, [authToken]);

    if (authLoading) {
      return <main className="min-h-screen bg-[#08111f]" />;
    }

  const handleSalarySubmit = () => {
    if (!salary || Number(salary) <= 0) return;
    setScreen("expenses");
  };

  const handleLogin = async () => {
    try {
      const result = await loginUser({ username: loginUsername, password: loginPassword });
      localStorage.setItem("captrack_token", result.token);
      setAuthToken(result.token);
      setUser(result.user);
      setSalary(String(result.user.salary));
      setExpenses(result.expenses);
      setDashboardExpenses(result.expenses);
      loadGoals(result.token).then((goalResult) => setGoals(goalResult.goals));
      setLoginError("");
      setScreen("dashboard");
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleRegister = async () => {
    try {
      const result = await registerUser({
        name: registerName,
        username: registerUsername,
        password: registerPassword,
        salary: registerSalary,
      });
      localStorage.setItem("captrack_token", result.token);
      setAuthToken(result.token);
      setUser(result.user);
      setSalary(String(result.user.salary));
      setExpenses([]);
      setDashboardExpenses([]);
      setGoals([]);
      loadGoals(result.token).then((goalResult) => setGoals(goalResult.goals));
      setRegisterError("");
      setScreen("dashboard");
    } catch (error) {
      setRegisterError(error.message);
    }
  };

  const handleAddExpense = async () => {
    if (!amount || Number(amount) <= 0) return;

    const newExpense = {
      id: Date.now(),
      amount: Number(amount),
      category,
      description: description.trim(),
    };

    try {
      const savedExpense = authToken
        ? (await createExpense(authToken, newExpense)).expense
        : newExpense;
      setExpenses((current) => [...current, savedExpense]);
      setDashboardExpenses((current) => [...current, savedExpense]);
      setApiError("");
    } catch (error) {
      setApiError(error.message);
      return;
    }

    setAmount("");
    setDescription("");
    setCategory("Food");
    setShowExpenseForm(false);
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
  };

  const handleAddDashboardExpense = async () => {
    if (!dashboardAmount || Number(dashboardAmount) <= 0) return;

    const newExpense = {
      amount: Number(dashboardAmount),
      category: dashboardCategory,
      description: dashboardDescription.trim(),
    };

    try {
      const savedExpense = authToken
        ? (await createExpense(authToken, newExpense)).expense
        : { id: Date.now(), ...newExpense };
      setDashboardExpenses((current) => [...current, savedExpense]);
      setExpenses((current) => [...current, savedExpense]);
      setApiError("");
    } catch (error) {
      setApiError(error.message);
      return;
    }

    setDashboardAmount("");
    setDashboardCategory("Food");
    setDashboardDescription("");
    setShowDashboardExpenseForm(false);
  };

  const handleDeleteExpense = async (id) => {
    try {
      if (authToken) await deleteExpense(authToken, id);
      setExpenses((current) => current.filter((expense) => expense.id !== id));
      setDashboardExpenses((current) => current.filter((expense) => expense.id !== id));
    } catch (error) {
      setApiError(error.message);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalTitle.trim() || !goalTargetAmount || !authToken) return;

    try {
      const { goal } = await createGoal(authToken, {
        title: goalTitle,
        targetAmount: Number(goalTargetAmount),
        savedAmount: Number(goalSavedAmount || 0),
      });
      setGoals((current) => [goal, ...current]);
      setGoalTitle("");
      setGoalTargetAmount("");
      setGoalSavedAmount("");
      setApiError("");
    } catch (error) {
      setApiError(error.message);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await deleteGoal(authToken, id);
      setGoals((current) => current.filter((goal) => goal.id !== id));
    } catch (error) {
      setApiError(error.message);
    }
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
    setGoals([]);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("captrack_token");
  };

  return (
  <main className="min-h-screen bg-[#08111f] text-white selection:bg-white selection:text-black">

    {showOCR && (
      <ReceiptScanner
        onExpenseDetected={async (newExpense) => {
          try {
            const savedExpense = authToken
              ? (await createExpense(authToken, newExpense)).expense
              : { id: Date.now(), ...newExpense };
            setExpenses((current) => [...current, savedExpense]);
            setDashboardExpenses((current) => [...current, savedExpense]);
            setApiError("");
          } catch (error) {
            setApiError(error.message);
          }
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
        {apiError && (
          <div className="mt-4 border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-blue-200">
            {apiError}
          </div>
        )}
        {/* Header */}
        <header className="flex items-center justify-between">
  {screen !== "home" ? (
    <button
      onClick={() => setScreen(user ? "dashboard" : "home")}
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
            onClick={() => {
              setRegisterError("");
              setScreen("register");
            }}
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

        {loginError && <p className="mt-4 text-sm text-blue-200">{loginError}</p>}

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

        {/* ================= REGISTER ================= */}
{screen === "register" && (
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
          Create your account
        </p>
        <h2 className="mt-3 text-4xl font-black">Start tracking.</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Your account stores your name, salary, and expenses in your local MySQL database.
        </p>

        <label className="mt-8 block text-xs font-semibold uppercase tracking-widest text-zinc-600">Name</label>
        <input
          autoFocus
          value={registerName}
          onChange={(event) => setRegisterName(event.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-zinc-500"
          placeholder="Your name"
        />

        <label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-zinc-600">Monthly salary</label>
        <input
          type="number"
          min="0"
          value={registerSalary}
          onChange={(event) => setRegisterSalary(event.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-zinc-500"
          placeholder="50000"
        />

        <label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-zinc-600">Username</label>
        <input
          value={registerUsername}
          onChange={(event) => setRegisterUsername(event.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-zinc-500"
          placeholder="Choose a username"
        />

        <label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-zinc-600">Password</label>
        <input
          type="password"
          value={registerPassword}
          onChange={(event) => setRegisterPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleRegister();
          }}
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-zinc-500"
          placeholder="At least 6 characters"
        />

        {registerError && <p className="mt-4 text-sm text-blue-200">{registerError}</p>}

        <button
          onClick={handleRegister}
          className="mt-6 flex w-full items-center justify-between rounded-xl bg-white px-5 py-4 font-bold text-black transition hover:bg-zinc-200"
        >
          CREATE ACCOUNT
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
            Good to see you, {user?.name || "there"}.
          </h2>
          <p className="mt-3 text-zinc-400">
            A clear look at the week behind you.
          </p>
        </div>

        <span className="w-fit rounded-full border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400">
          Last 7 days
        </span>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 text-black">
          <p className="text-sm text-zinc-500">Total spent this week</p>
          <p className="mt-2 text-5xl font-black">{formatCurrency(weeklyTotal)}</p>
          {dashboardExpenses.length > 0 && previousWeeklyTotal > 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-300">
              <TrendingUp size={15} /> {Math.abs(weeklyTrendPercentage).toFixed(1)}% {weeklyTrendPercentage <= 0 ? "lower" : "higher"} than last week
            </p>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No previous week data yet.</p>
          )}
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-600">Daily average</p>
          <p className="mt-2 text-3xl font-black">{formatCurrency(Math.round(weeklyTotal / 7))}</p>
          <p className="mt-3 text-sm text-zinc-500">Based on your last 7 days.</p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-600">Weekly budget</p>
          <p className="mt-2 text-3xl font-black">{formatCurrency(weeklyBudgetRemaining)}</p>
          <p className="mt-3 text-sm text-zinc-500">
            {weeklyBudgetPercentage.toFixed(1)}% of {formatCurrency(loggedInSalary)} salary used
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

        {dashboardExpenses.length > 0 ? (
        <>
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
            <p className="mt-2 text-sm text-zinc-500">Of your {formatCurrency(loggedInSalary)} monthly salary</p>
          </div>
        </div>
        </>
        ) : (
          <div className="mt-7 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
            Add your first expense to generate a forecast from your own data.
          </div>
        )}

        {dashboardExpenses.length > 0 && (
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
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold">Your expenses</h3>
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
                  <p className="text-sm text-zinc-600">Total recorded</p>
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
                        fill={["#f8fbff", "#b7c9dc", "#71839a", "#2d4563", "#1b2d46", "#dceeff"][index % 6]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                    contentStyle={{
                      backgroundColor: "#0d1b2f",
                      border: "1px solid #1b2d46",
                      borderRadius: "12px",
                      color: "#ffffff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-zinc-600">TOTAL</span>
                <span className="mt-1 text-xl font-black">{formatCurrency(dashboardTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Spending timeline</p>
              <h3 className="mt-2 text-xl font-bold">Your recent rhythm</h3>
            </div>
            <CalendarDays size={20} className="text-zinc-600" />
          </div>

          {dashboardExpenses.length > 0 ? (
            <div className="mt-6 space-y-5">
              {Object.entries(
                dashboardExpenses
                  .filter((expense) => getExpenseDate(expense) >= heatmap[54].date)
                  .sort((first, second) => getExpenseDate(second) - getExpenseDate(first))
                  .reduce((groups, expense) => {
                    const dateKey = getExpenseDate(expense).toISOString().slice(0, 10);
                    groups[dateKey] ||= [];
                    groups[dateKey].push(expense);
                    return groups;
                  }, {})
              ).slice(0, 6).map(([dateKey, dayExpenses]) => (
                <div key={dateKey} className="flex gap-4 border-l border-zinc-700 pl-4">
                  <div className="min-w-20">
                    <p className="text-sm font-semibold">{new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    <p className="mt-1 text-xs text-zinc-600">{dayExpenses.length} {dayExpenses.length === 1 ? "entry" : "entries"}</p>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {dayExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-zinc-400">{expense.description || expense.category}</span>
                        <span className="shrink-0 font-semibold">{formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">Your timeline will appear after your first expense.</p>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Pattern watch</p>
              <h3 className="mt-2 text-xl font-bold">Recurring expenses</h3>
            </div>
            <Repeat2 size={20} className="text-zinc-600" />
          </div>
          {recurringExpenses.length > 0 ? (
            <div className="mt-6 space-y-3">
              {recurringExpenses.slice(0, 4).map((item) => (
                <div key={`${item.category}-${item.description}`} className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.description}</p>
                    <p className="mt-1 text-xs text-zinc-600">{item.count} entries · {item.category}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{formatCurrency(item.average)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">Repeated descriptions will appear here as patterns emerge.</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 animate-fade-up">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Spending heatmap</p>
            <h3 className="mt-2 text-xl font-bold">Your last 12 weeks</h3>
          </div>
          <span className="text-xs text-zinc-600">Each square is one day</span>
        </div>
        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-zinc-800/80 bg-black/40 p-4 sm:p-5">
          <div className="grid grid-cols-12 gap-2.5 sm:gap-3">
          {heatmap.map((cell) => {
            const intensity = cell.amount === 0 ? "bg-zinc-900" : cell.amount < 500 ? "bg-zinc-700" : cell.amount < 1200 ? "bg-blue-900" : cell.amount < 2200 ? "bg-blue-700" : "bg-blue-400";
            return <div key={cell.date.toISOString()} title={`${cell.date.toLocaleDateString("en-IN")}: ${formatCurrency(cell.amount)}`} className={`aspect-square min-w-0 rounded-md shadow-sm transition duration-200 hover:scale-125 hover:shadow-lg ${intensity}`} />;
          })}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-zinc-600">
            Less
            <span className="h-3 w-3 rounded-sm bg-zinc-900" />
            <span className="h-3 w-3 rounded-sm bg-zinc-700" />
            <span className="h-3 w-3 rounded-sm bg-blue-900" />
            <span className="h-3 w-3 rounded-sm bg-blue-700" />
            <span className="h-3 w-3 rounded-sm bg-blue-400" />
            More
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 animate-fade-up">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Financial goals</p>
            <h3 className="mt-2 text-xl font-bold">Give your money a destination</h3>
          </div>
          <Target size={21} className="text-zinc-600" />
        </div>

        <p className="mt-2 text-sm text-zinc-500">Set a target for this month and track your progress before the month closes.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="Goal name" className="rounded-xl border border-zinc-800 bg-black px-3 py-3 text-sm outline-none focus:border-zinc-500" />
          <input type="number" min="0" value={goalTargetAmount} onChange={(event) => setGoalTargetAmount(event.target.value)} placeholder="Target amount" className="rounded-xl border border-zinc-800 bg-black px-3 py-3 text-sm outline-none focus:border-zinc-500" />
          <input type="number" min="0" value={goalSavedAmount} onChange={(event) => setGoalSavedAmount(event.target.value)} placeholder="Already saved" className="rounded-xl border border-zinc-800 bg-black px-3 py-3 text-sm outline-none focus:border-zinc-500" />
          <button onClick={handleCreateGoal} disabled={!goalTitle.trim() || !goalTargetAmount} className="rounded-xl bg-white px-3 py-3 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30">ADD GOAL</button>
        </div>

        {goals.length > 0 ? (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {goals.map((goal) => {
              const progress = Math.min((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100, 100);
              return (
                <div key={goal.id} className="rounded-2xl border border-zinc-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{goal.title}</p>
                      <p className="mt-1 text-xs text-zinc-600">{formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}</p>
                    </div>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="text-xs text-zinc-600 transition hover:text-white">Remove</button>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-900"><div className="h-full rounded-full bg-blue-400 transition-all duration-700" style={{ width: `${progress}%` }} /></div>
                  <p className="mt-2 text-xs text-zinc-600">{progress.toFixed(0)}% complete · Current month</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">Create a goal to start tracking progress.</p>
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
                  style={{ height: `${highestWeeklySpend > 0 ? Math.max((day.amount / highestWeeklySpend) * 78, 8) : 8}%` }}
                />
                <span className="pb-3 text-xs font-semibold text-zinc-500">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
          <h3 className="text-xl font-bold">Where it went</h3>
                <p className="mt-1 text-sm text-zinc-600">Your recorded categories</p>

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
                    style={{ width: `${dashboardTotal > 0 ? (item.amount / dashboardTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Lowest day</p>
          <p className="mt-3 text-2xl font-black">{lowestSpendDay?.day || "No data"}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {lowestSpendDay ? `${formatCurrency(lowestSpendDay.amount)} recorded` : "Add expenses to see this."}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Watch this</p>
          <p className="mt-3 text-2xl font-black">{topCategory?.name || "No data"}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {topCategory && dashboardTotal > 0 ? `${((topCategory.amount / dashboardTotal) * 100).toFixed(1)}% of recorded spend` : "Add expenses to see this."}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Weekly rhythm</p>
          <p className="mt-3 text-2xl font-black">{weeklyRhythm}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {weeklyTotal > 0 ? "Based on your last 7 days." : "Add expenses to see this."}
          </p>
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