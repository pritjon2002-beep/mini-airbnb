const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controller/booking.js");

router.post("/", isLoggedIn, wrapAsync(bookingController.createBooking));

module.exports = router;
