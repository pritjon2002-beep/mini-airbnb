const Listing = require("../models/listing");
const axios = require("axios");

// Home / Index Route
module.exports.index = async (req, res) => {
  let allListings = await Listing.find({});
  res.render("./listings/index.ejs", { allListings });
};

// New Route
module.exports.showNewForm = (req, res) => {
  res.render("./listings/new.ejs");
};

// Create Route
module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;

  //step-1: ask Nominatim to convert location text into coordinates
  let geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: `${req.body.listing.location}, ${req.body.listing.country}`,
      format: "json",
      limit: 1,
    },
    headers: { "User-Agent": "wanderlust-app" },
  });

  //step-2: if no result found , location is invalid - stop here
  if (geoRes.data.length === 0) {
    req.flash("error", "Invalid location. Please enter a valid place.");
    return res.redirect("/listings/new");
  }

  //step-3: extract latitude and longitude form response
  const { lat, lon } = geoRes.data[0];

  let newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  //step-4: Attack geometry in GeoJSON format
  newListing.geometry = {
    type: "Point",
    coordinates: [parseFloat(lon), parseFloat(lat)],
  };
  await newListing.save();
  req.flash("success", "New Listing Created Successfully");
  res.redirect("/listings");
};

// Edit Route
module.exports.editListingForm = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing Doesnot Exists!");
    return res.redirect("/listings");
  }

  let originalImage = listing.image.url;
  let finalImage = originalImage.replace(
    "/upload",
    "/upload/h_250,w_300,e_blur:200",
  );
  console.log(finalImage);

  res.render("./listings/edit.ejs", { listing, finalImage });
};

// Update Route
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = req.body.listing;

  // Re-geocode using the (possibly updated) location + country
  let geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: `${listing.location}, ${listing.country}`,
      format: "json",
      limit: 1,
    },
    headers: { "User-Agent": "wanderlust-app" },
  });

  if (geoRes.data.length === 0) {
    req.flash("error", "Invalid location. Please enter a valid place.");
    return res.redirect(`/listings/${id}/edit`);
  }

  const { lat, lon } = geoRes.data[0];
  listing.geometry = {
    type: "Point",
    coordinates: [parseFloat(lon), parseFloat(lat)],
  };

  let updatedListing = await Listing.findByIdAndUpdate(id, listing);

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    updatedListing.image = { url, filename };
    await updatedListing.save();
  }

  req.flash("success", "Listing Updated Successfully");
  res.redirect(`/listings/${id}`);
};

// Show Route
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing Doesnot Exists!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

// Destroy Route
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deleteListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted Successfully");
  console.log(deleteListing);
  res.redirect("/listings");
};

//searchListing
module.exports.searchListings = async (req, res) => {
  let { q } = req.query;
  let allListings = await Listing.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
    ],
  });
  res.render("./listings/index.ejs", { allListings });
};

//filter by category
module.exports.filterByCategory = async (req, res) => {
  let { category } = req.params;
  let allListings = await Listing.find({ category: category });
  res.render("./listings/index.ejs", { allListings });
};
