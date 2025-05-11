const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");

// Endpoint para obtener notificaciones
router.get("/", (req, res, next) => {
  Notification.find()
    .populate("productId")
    .exec()
    .then((notifications) => {
      res.status(200).json({
        count: notifications.length,
        notifications: notifications.map((notification) => {
          return {
            _id: notification._id,
            productId: notification.productId,
            message: notification.message,
            date: notification.date,
          };
        }),
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
