const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const checkAuth = require("../middleware/check-auth");

router.post("/signup", (req, res, next) => {
  const { email, password, rol } = req.body;

  User.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }

      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: email,
        password: password, // el hash se hará automáticamente en el middleware
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
      
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed: User not found",
        });
      }

      // Comparar la contraseña ingresada con el hash de la base de datos usando bcrypt
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed: Comparison error",
          });
        }

        if (!result) {
          return res.status(401).json({
            message: "Auth failed: Invalid password",
          });
        }

        // Si la contraseña es correcta, generamos el token
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


router.delete("/:userId", checkAuth, (req, res, next) => {
  if (req.userData.rol !== "admin") {
    return res.status(403).json({
      message: "Unauthorized access. Only admins can delete users.",
    });
  }

  User.deleteOne({ _id: req.params.userId })
    .then((result) => {
      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }
      res.status(200).json({
        message: "User deleted successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
