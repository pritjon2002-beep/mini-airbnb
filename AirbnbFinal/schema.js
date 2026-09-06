const Joi = require("joi");
const review = require("./models/review");

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required().min(3),
    description: Joi.string().required().min(4),
    price: Joi.number().required().min(0),
    country: Joi.string().required().min(3),
    location: Joi.string().required().min(4),
    image: Joi.allow("", null),
    category: Joi.array().items(Joi.string()),
  }).required(),
});

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});

module.exports = {
  listingSchema,
  reviewSchema,
};
