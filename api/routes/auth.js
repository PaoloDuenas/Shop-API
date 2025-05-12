const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/user");

// Registro de nuevo usuario
router.post("/signup", (req, res, next) => {
  const { email, password, rol } = req.body;

  User.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }

      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({
            error: err,
          });
        }

        const user = new User({
          _id: new mongoose.Types.ObjectId(),
          email: email,
          password: hash, 
          rol: rol || "cliente",
        });

        user
          .save()
          .then((result) => {
            res.status(201).json({
              message: "User created successfully",
              userId: result._id,
              email: result.email,
              rol: result.rol,
            });
          })
          .catch((err) => {
            res.status(500).json({
              error: err,
            });
          });
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

// Login
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed",
        });
      }

      bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
          return res.status(401).json({
            message: "Auth failed",
          });
        }

        const token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
            rol: user.rol,
          },
          process.env.JWT_KEY,
          { expiresIn: "1h" }
        );

        res.status(200).json({
          message: "Auth successful",
          token: token,
        });
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
