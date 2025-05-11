module.exports = (req, res, next) => {
  if (req.userData && req.userData.rol === "admin") {
    next();
  } else {
    return res.status(403).json({
      message: "Acceso denegado: se requiere rol de administrador",
    });
  }
};
