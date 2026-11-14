const Expense = require("../models/Expense");


// @desc    Get all expenses for logged-in user (with optional filters)
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const query = { user: req.user._id };

    if (req.query.category && req.query.category !== "All") {
      query.category = req.query.category;
    }

    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Add minAmount and maxAmount filters
    if (req.query.minAmount || req.query.maxAmount) {
      query.amount = {};
      if (req.query.minAmount) query.amount.$gte = Number(req.query.minAmount);
      if (req.query.maxAmount) query.amount.$lte = Number(req.query.maxAmount);
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      user: req.user._id,
    };

    // If it's a recurring expense, set the next due date based on interval
    if (expenseData.isRecurring && expenseData.recurrenceInterval !== "None" && expenseData.date) {
      const nextDate = new Date(expenseData.date);
      if (expenseData.recurrenceInterval === "Monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (expenseData.recurrenceInterval === "Weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (expenseData.recurrenceInterval === "Yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      expenseData.nextDueDate = nextDate;
    }

    const expense = await Expense.create(expenseData);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get a single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    let updateData = { ...req.body };
    
    // Update nextDueDate if interval changed or it's being toggled
    if (updateData.isRecurring && updateData.recurrenceInterval !== "None") {
        const currentDate = updateData.date ? new Date(updateData.date) : new Date();
        const nextDate = new Date(currentDate);
        if (updateData.recurrenceInterval === "Monthly") {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (updateData.recurrenceInterval === "Weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (updateData.recurrenceInterval === "Yearly") {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        updateData.nextDueDate = nextDate;
    } else {
        updateData.nextDueDate = null;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ADVANCED FEATURES ---

// @desc    Get expense analytics (monthly comparison, top category, daily average)
// @route   GET /api/expenses/analytics/summary
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const prevMonthStart = new Date(currentMonthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setMilliseconds(-1);

    const expenses = await Expense.find({ user: req.user._id });

    let currentMonthTotal = 0;
    let prevMonthTotal = 0;
    const categoryTotals = {};

    expenses.forEach(exp => {
      const expDate = new Date(exp.date);
      
      // Calculate monthly totals
      if (expDate >= currentMonthStart && expDate <= currentMonthEnd) {
        currentMonthTotal += exp.amount;
      } else if (expDate >= prevMonthStart && expDate < currentMonthStart) {
        prevMonthTotal += exp.amount;
      }

      // Calculate categories (all time or current month - let's do current month)
      if (expDate >= currentMonthStart && expDate <= currentMonthEnd) {
        if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
        categoryTotals[exp.category] += exp.amount;
      }
    });

    // Find highest spending category
    let highestCategory = "None";
    let highestCategoryAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > highestCategoryAmount) {
        highestCategoryAmount = amt;
        highestCategory = cat;
      }
    }

    // Compare with last month
    let percentChange = 0;
    if (prevMonthTotal > 0) {
      percentChange = ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
    }

    // Average daily expense
    const today = new Date();
    const daysInCurrentMonth = today.getDate(); // Up to today
    const averageDaily = currentMonthTotal / (daysInCurrentMonth || 1);

    res.json({
      success: true,
      data: {
        currentMonthTotal,
        prevMonthTotal,
        percentChange: percentChange.toFixed(1),
        highestCategory,
        highestCategoryAmount,
        averageDaily: averageDaily.toFixed(2)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process pending recurring transactions
// @route   POST /api/expenses/process-recurring
// @access  Private
const processRecurringTransactions = async (req, res) => {
  try {
    const today = new Date();
    // Find all recurring expenses where nextDueDate is today or earlier
    const pendingRecurring = await Expense.find({
      user: req.user._id,
      isRecurring: true,
      nextDueDate: { $lte: today },
      recurrenceInterval: { $ne: "None" }
    });

    let processedCount = 0;

    for (let exp of pendingRecurring) {
      let isDone = false;
      // Loop to handle if the due date is months in the past
      while (exp.nextDueDate <= today && !isDone) {
        // Create new expense clone
        await Expense.create({
          user: exp.user,
          title: `${exp.title} (Recurring)`,
          amount: exp.amount,
          category: exp.category,
          date: exp.nextDueDate, 
          description: "Auto-generated recurring expense",
          isRecurring: false, // The clone isn't the recurring parent
        });

        processedCount++;

        // Calculate next due date
        const nextDate = new Date(exp.nextDueDate);
        if (exp.recurrenceInterval === "Monthly") {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (exp.recurrenceInterval === "Weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (exp.recurrenceInterval === "Yearly") {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
            isDone = true; // Safety fallback
        }
        
        exp.nextDueDate = nextDate;
        
        // Safety exit for endless loops
        if (nextDate > today) {
            isDone = true;
        }
      }
      // Save updated parent expense
      await exp.save();
    }

    res.json({ success: true, message: `Processed ${processedCount} recurring transactions.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  getAnalytics,
  processRecurringTransactions
};
