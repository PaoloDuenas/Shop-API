const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuth = require("../middleware/check-auth");
const Notification = require("../models/notification");
const Order = require("../models/order");
const Product = require("../models/product");
const checkAdmin = require("../middleware/check-admin");

//Obetener la lista de ordenes
router.get("/", checkAuth, checkAdmin, (req, res, next) => {
  Order.find()
    .select("product quantity _id")
    .populate('product')
    .exec()
    .then((docs) => {
      res.status(200).json({
        count: docs.length,
        order: docs.map((doc) => {
          return {
            _id: doc._id,
            product: doc.product,
            quantity: doc.quantity,
            request: {
              type: "GET",
              url: "https://localhost:3000/orders/" + doc._id,
            },
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

//Postear ordenes, (funcionando)
router.post("/", checkAuth, checkAdmin, async (req, res, next) => {
  const productId = req.body.productId;
  const quantity = req.body.quantity;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    // Crear la orden
    const order = new Order({
      _id: new mongoose.Types.ObjectId(),
      quantity: quantity,
      product: productId,
    });

    // Actualizar el stock
    product.stock -= quantity;

    // Crear y guardar la notificación
    if (product.stock <= product.reorderPoint) {
      const notification = new Notification({
        productId: product._id,
        message: `El stock del producto '${product.name}' está por debajo del punto de reorden.`,
      });

      await notification.save();
      console.log("Producto bajo el punto de reorden. Notificación guardada.");
    }

    await product.save();
    const savedOrder = await order.save();

    res.status(201).json({
      message: "Order stored",
      createdOrder: {
        _id: savedOrder._id,
        product: savedOrder.product,
        quantity: savedOrder.quantity,
      },
      request: {
        type: "GET",
        url: "http://localhost:3000/orders/" + savedOrder._id,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});


// Obetener una orden especifica por su ID
router.get("/:orderId", checkAuth, checkAdmin, (req, res, next) => {
  const id = req.params.orderId;
  Order.findById(id)
    .select("product quantity _id")
    .populate("product")
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json({
          order: doc,
          request: {
            type: "GET",
            url: "https://localhost:3000/orders/" + doc._id,
          },
        });
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

//Borrar orden por su ID
router.delete("/:orderId", checkAuth, checkAdmin, (req, res, next) => {
  Order.deleteOne({ _id: req.params.orderId })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Order deleted",
        request: {
          type: "POST",
          url: "https://localhost:3000/orders/",
          body: { productId: "ID", quantity: "Number" },
        },
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
