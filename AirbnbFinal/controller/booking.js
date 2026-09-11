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

  // Re-check for conflicts right after saving (race-condition safety net)
  let conflicting = await Booking.find({
    listing: id,
    // check for overlaps among other bookings, but ignore the one I just created myself
    _id: { $ne: newBooking._id },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  });

  if (conflicting.length > 0) {
    await Booking.findByIdAndDelete(newBooking._id);
    req.flash(
      "error",
      "Sorry, someone just booked these dates. Please choose different ones.",
    );
    return res.redirect(`/listings/${id}`);
  }

  req.flash("success", "Booking confirmed!");
  res.redirect(`/listings/${id}`);
};

//mybookings
module.exports.myBookings = async (req, res) => {
  let bookings = await Booking.find({ user: req.user._id })
    .populate("listing")
    .sort({ checkIn: 1 });

  res.render("bookings/my-bookings.ejs", { bookings });
};

//cancel booking
module.exports.cancelBooking = async (req, res) => {
  let { bookingId } = req.params;

  let booking = await Booking.findById(bookingId);

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/my-bookings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "You can only cancel your own bookings");
    return res.redirect("/my-bookings");
  }

  await Booking.findByIdAndDelete(bookingId);
  req.flash("success", "Booking cancelled successfully");
  res.redirect("/my-bookings");
};
