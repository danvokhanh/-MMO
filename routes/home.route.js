var express = require("express");
var homeRouter = express.Router();
var homeCtrl = require("../controllers/HomeController");

// render pages

homeRouter.get(
    ["/facebook-private-video-downloader", "/facebook-private-video-downloader/:code"],
    homeCtrl.facebookPrivateDownloadPage
);

homeRouter.get(["/:code", "/"], homeCtrl.facebookPublicDownloadPage);

homeRouter.post("/get-public-facebook-video", homeCtrl.getPublicFacebookVideo);

homeRouter.post("/get-private-facebook-video", homeCtrl.getPrivateFaceBookVideo);

module.exports = homeRouter;
