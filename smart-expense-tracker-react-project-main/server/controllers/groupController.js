const Group = require("../models/Group");
const GroupExpense = require("../models/GroupExpense");
const User = require("../models/User");

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Group name is required." });

    const newGroup = await Group.create({
      name,
      createdBy: req.user.id,
      members: [req.user.id], // The creator is automatically a member
    });

    res.status(201).json({ success: true, data: newGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Add a member to a group by email
// @route   POST /api/groups/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "User email is required." });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found." });

    // Verify requesting user is in the group
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: "User with this email not found." });

    if (group.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: "User is already a member." });
    }

    group.members.push(userToAdd._id);
    await group.save();

    res.status(200).json({ success: true, message: "Member added successfully.", data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get all groups for the logged-in user
// @route   GET /api/groups
// @access  Private
exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id }).populate("members", "name email");
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get a single group's details
// @route   GET /api/groups/:id
// @access  Private
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("members", "name email");
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (!group.members.some(m => m._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    // Fetch related expenses
    const expenses = await GroupExpense.find({ group: req.params.id })
      .populate("paidBy", "name")
      .populate("participants", "name")
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: { group, expenses } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Add a group expense
// @route   POST /api/groups/:id/expenses
// @access  Private
exports.addGroupExpense = async (req, res) => {
  try {
    const { title, amount, category, date, description, paidBy, participants } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    // Default to current user paying if not specified
    const payer = paidBy || req.user.id;
    
    // Default to splitting among all group members if participants not passed
    const splitAmong = participants && participants.length > 0 ? participants : group.members;

    const newExpense = await GroupExpense.create({
      title,
      amount,
      category: category || "Other",
      date: date || Date.now(),
      description,
      group: req.params.id,
      paidBy: payer,
      participants: splitAmong,
    });

    res.status(201).json({ success: true, data: newExpense });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get group analytics and who owes whom
// @route   GET /api/groups/:id/analytics
// @access  Private
exports.getGroupAnalytics = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("members", "name");
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (!group.members.some(m => m._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    const expenses = await GroupExpense.find({ group: req.params.id });

    let totalGroupSpend = 0;
    const memberTotals = {}; // Tracks total amount paid by each member (for visuals)
    const balances = {};     // Net tracking array for "who owes who"

    // Initialize tracking maps
    group.members.forEach(m => {
      memberTotals[m._id.toString()] = { _id: m._id, name: m.name, totalPaid: 0 };
      balances[m._id.toString()] = { _id: m._id, name: m.name, netBalance: 0 };
    });

    // Process each expense
    expenses.forEach(exp => {
      totalGroupSpend += exp.amount;
      const payerId = exp.paidBy.toString();
      
      // Safety check in case a member who paid left the group
      if (!balances[payerId]) return;

      // Payer's tracking
      memberTotals[payerId].totalPaid += exp.amount;
      balances[payerId].netBalance += exp.amount;

      // Divide among participants
      const splitAmount = exp.amount / exp.participants.length;

      exp.participants.forEach(p => {
        const participantId = p.toString();
        if (balances[participantId]) {
          balances[participantId].netBalance -= splitAmount;
        }
      });
    });

    // Separate into debtors (negative balance) and creditors (positive balance)
    let debtors = [];
    let creditors = [];

    Object.values(balances).forEach(b => {
      if (b.netBalance < -0.01) { // -0.01 deals with float division errors
        debtors.push({ ...b, amountOwed: Math.abs(b.netBalance) });
      } else if (b.netBalance > 0.01) {
        creditors.push({ ...b, amountCredit: b.netBalance });
      }
    });

    // Greedy debt settlement algorithm
    // Sort so biggest debtor pays biggest creditor first
    debtors.sort((a, b) => b.amountOwed - a.amountOwed);
    creditors.sort((a, b) => b.amountCredit - a.amountCredit);

    const settlementSummary = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];

      let settlementAmount = Math.min(debtor.amountOwed, creditor.amountCredit);
      
      settlementSummary.push({
        from: debtor.name,
        fromId: debtor._id,
        to: creditor.name,
        toId: creditor._id,
        amount: parseFloat(settlementAmount.toFixed(2)),
      });

      debtor.amountOwed -= settlementAmount;
      creditor.amountCredit -= settlementAmount;

      if (debtor.amountOwed < 0.01) i++;
      if (creditor.amountCredit < 0.01) j++;
    }

    res.status(200).json({
      success: true,
      data: {
        totalGroupSpend,
        memberTotals: Object.values(memberTotals),
        settlementSummary,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
