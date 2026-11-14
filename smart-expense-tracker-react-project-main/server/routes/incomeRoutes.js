const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getIncomes,
  addIncome,
  getIncome,
  updateIncome,
  deleteIncome,
} = require("../controllers/incomeController");

// Protect all routes
router.use(protect);

router.route("/").get(getIncomes).post(addIncome);
router.route("/:id").get(getIncome).put(updateIncome).delete(deleteIncome);

module.exports = router;
