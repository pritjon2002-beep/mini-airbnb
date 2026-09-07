const Review = require("../models/review");
const Listing = require("../models/listing");

//create Route
module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);

  newReview.author = req.user._id;

  listing.reviews.push(newReview._id);

  let newList = await listing.save();
  let newRev = await newReview.save();

  req.flash("success", "Review Added Successfully");

  res.redirect(`/listings/${listing._id}`);
};

//destroy route
module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;

  let delReview = await Review.findByIdAndDelete(reviewId);

  let listing = await Listing.findByIdAndUpdate(id, {
    $pull: { reviews: reviewId },
  });

  req.flash("success", "Review Deleted Successfully");
  res.redirect(`/listings/${id}`);
};
