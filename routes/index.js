const homeRouter = require("./home.route");

function routes(app) {
  app.use("/", homeRouter);
}

module.exports = routes;