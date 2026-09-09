// 1. Imports

//dotenv
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
app.set("trust proxy", 1);
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const CustomExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");

//uses google dns instead of system to solve :- Error: querySrv ECONNREFUSED _mongodb._tcp.cluster0airbnb.gzqhiz1.mongodb.net
const dns = require("dns");
const { error } = require("console");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dbURL = process.env.MONGO_URL;
// 2. Database Connection
async function database() {
  await mongoose.connect(dbURL);
}

database()
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((err) => {
    console.log(err);
  });

// 3. App Configuration (EJS, middleware)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.engine("ejs", ejsMate); // we can use layouts for diff boilerplate.

app.use(express.static(path.join(__dirname, "public"))); // we join public folder now we can use static files

//saves mongo session
const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 60 * 60,
  ttl: 30 * 24 * 60 * 60,
});

store.on("error", () => {
  console.log("Error in Mongo session", error);
});

//session
const sessionOption = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser(User.serializeUser()); //Stores the user's ID in the session after login.
passport.deserializeUser(User.deserializeUser()); //Uses the stored ID to find the user again on later requests.

app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.failureMsg = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

//redirect to /listings
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// 4. Routes

//listing router
app.use("/listings", listingRouter);

//review router
app.use("/listings/:id/reviews", reviewRouter);

// booking router
app.use("/listings/:id/bookings", bookingRouter);

//user router
app.use("/", userRouter);

// app.get("/testListing", async(req,res)=> {
//     let sampleListing = new Listing({
//         title: "Mumbai Beach",
//         description: "Very beautiful beach in Mumbai that should be loved by everyone",
//         price: 1000,
//         location : "Mumbai Beach",
//         country: "India",

//     });
//     await sampleListing.save();
//     console.log("Listing Saved to Database Sucessfully");
//     res.send("Listing Saved to Database Sucessfully");

// })

app.all("/{*splat}", (req, res, next) => {
  next(new CustomExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  let { status = 500, message } = err;
  res.status(status).render("error.ejs", { err });
});

// 5. Server Start
app.listen(8080, () => {
  console.log(`Server is running on http://localhost:8080`);
});
