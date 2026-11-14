const Income = require("../models/Income");

// @desc    Get all income entries for logged-in user
// @route   GET /api/income
// @access  Private
const getIncomes = async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.user._id }).sort({ date: -1 });
    res.json({ success: true, count: incomes.length, data: incomes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new income entry
// @route   POST /api/income
// @access  Private
const addIncome = async (req, res) => {
  try {
    const income = await Income.create({
      ...req.body,
      user: req.user._id,
    });
    res.status(201).json({ success: true, data: income });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get a single income entry
// @route   GET /api/income/:id
// @access  Private
const getIncome = async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!income) {
      return res.status(404).json({ success: false, message: "Income not found" });
    }
    res.json({ success: true, data: income });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an income entry
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!income) {
      return res.status(404).json({ success: false, message: "Income not found" });
    }
    res.json({ success: true, data: income });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an income entry
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!income) {
      return res.status(404).json({ success: false, message: "Income not found" });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getIncomes,
  addIncome,
  getIncome,
  updateIncome,
  deleteIncome,
};
