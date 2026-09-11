const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { isLoggedIn, saveRedirectUrl } = require("../middleware.js");
const userController = require("../controller/users.js");

//singup route
router
  .route("/signup")
  //get route
  .get(userController.renderSignupForm)
  //post route
  .post(wrapAsync(userController.signup));

//login route
router
  //get route
  .route("/login")
  .get(userController.renderLoginForm)
  //post route
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    wrapAsync(userController.login),
  );

//Google login
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

//Google callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Logged in with Google successfully");
    res.redirect("/listings");
  },
);

//user logout

router.get("/logout", userController.logout);

//my booking
router.get("/my-bookings", isLoggedIn, wrapAsync(bookingController.myBookings));

module.exports = router;
