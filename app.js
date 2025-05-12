const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

app.use(cors());

const productRoutes = require("./api/routes/products");
const orderRoutes = require("./api/routes/orders");
const notificationRoutes = require("./api/routes/notifications");
const authRoutes = require("./api/routes/auth");

mongoose.connect(
  "mongodb+srv://Admin:" +
    process.env.MONGO_ATLAS_PW +
    "@node-rest-shop.o25uu2s.mongodb.net/?retryWrites=true&w=majority&appName=node-rest-shop",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/notifications", notificationRoutes);
app.use("/auth", authRoutes);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
