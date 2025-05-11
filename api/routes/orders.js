const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuth = require("../middleware/check-auth");

const Order = require("../models/order");
const Product = require("../models/product");

//Obetener la lista de ordenes
router.get("/", checkAuth, (req, res, next) => {
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
router.post("/", checkAuth, (req, res, next) => {
  const productId = req.body.productId;
  const quantity = req.body.quantity;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: "Not enough stock available",
        });
      }

      // Crear la orden
      const order = new Order({
        _id: new mongoose.Types.ObjectId(),
        quantity: quantity,
        product: productId,
      });

      // Actualizar el stock
      product.stock -= quantity;

      // Verificar si el stock está por debajo del punto de reorden
      if (product.stock <= product.reorderPoint) {
        // Aquí deberías agregar la lógica para enviar una notificación
        console.log("Producto bajo el punto de reorden. Notificación enviada.");
        // Puedes guardar la notificación en la base de datos o enviarla por email
      }

      return product.save().then(() => order.save());
    })
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Order stored",
        createdOrder: {
          _id: result._id,
          product: result.product,
          quantity: result.quantity,
        },
        request: {
          type: "GET",
          url: "https://localhost:3000/orders/" + result._id,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// Obetener una orden especifica por su ID
router.get("/:orderId", checkAuth, (req, res, next) => {
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
router.delete("/:orderId", checkAuth, (req, res, next) => {
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
