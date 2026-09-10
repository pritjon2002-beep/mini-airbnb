const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.createBooking = async (req, res) => {
  let { id } = req.params;
  let { checkIn, checkOut } = req.body.booking;

  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  let checkInDate = new Date(checkIn);
  let checkOutDate = new Date(checkOut);

  let today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    req.flash("error", "Check-in date cannot be in the past");
    return res.redirect(`/listings/${id}`);
  }

  // Check-out must be after check-in
  if (checkOutDate <= checkInDate) {
    req.flash("error", "Check-out date must be after check-in date");
    return res.redirect(`/listings/${id}`);
  }

  // Check for overlapping bookings on this listing
  let overlapping = await Booking.findOne({
    listing: id,
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  });

  if (overlapping) {
    req.flash(
      "error",
      "These dates are already booked. Please choose different dates.",
    );
    return res.redirect(`/listings/${id}`);
  }

  // Calculate total price
  let nights = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
  let totalPrice = nights * listing.price;

  let newBooking = new Booking({
    listing: id,
    user: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    totalPrice,
  });

  await newBooking.save();
  req.flash("success", "Booking confirmed!");
  res.redirect(`/listings/${id}`);
};
