const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controller/listings.js");
//multer
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage }); // saves files in cloudinary storage  file

//listings route

router
  .route("/")
  //Home or Listings or index route
  .get(wrapAsync(listingController.index))
  // Create Route
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing),
  );

// New Listing Route
router.get("/new", isLoggedIn, listingController.showNewForm);

//search
router.get("/search", wrapAsync(listingController.searchListings));

// Category Filter Route (must be before /:id)
router.get(
  "/category/:category",
  wrapAsync(listingController.filterByCategory),
);

router
  .route("/:id")
  //Show Route
  .get(wrapAsync(listingController.showListing))
  //Update Route
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

// Edit
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.editListingForm),
);

module.exports = router;
