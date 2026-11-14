const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createGroup,
  addMember,
  getUserGroups,
  getGroupDetails,
  addGroupExpense,
  getGroupAnalytics
} = require("../controllers/groupController");

// All group routes are protected
router.use(protect);

router.route("/")
  .get(getUserGroups)
  .post(createGroup);

router.route("/:id")
  .get(getGroupDetails);

router.route("/:id/members")
  .post(addMember);

router.route("/:id/expenses")
  .post(addGroupExpense);

router.route("/:id/analytics")
  .get(getGroupAnalytics);

module.exports = router;
