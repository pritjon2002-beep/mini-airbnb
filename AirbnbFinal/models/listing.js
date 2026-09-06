const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },

  image: {
    url: String,
    filename: String,
  },

  price: {
    type: Number,
    min: 500,
    max: 10000,
  },

  location: {
    type: String,
  },

  country: {
    type: String,
  },

  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],

  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  geometry: {
    type: {
      type: String,
      enum: ["Point"], // only allow "Point" type
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },

  category: {
    type: String,
    enum: [
      "Trending",
      "Rooms",
      "Mountains",
      "Amazing Pools",
      "Iconic Cities",
      "Castles",
      "Camping",
      "Farms",
      "Arctic",
      "Cabins",
      "Tiny Homes",
    ],
  },
});

// mongoose middleware to handle deletion
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    let delRev = await Review.deleteMany({ _id: { $in: listing.reviews } });
    console.log(`mongoose middleware-deleted reviews : ${delRev}`);
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
