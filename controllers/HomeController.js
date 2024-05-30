const { app } = require("../utils/common");
var i18n = require("i18n");
var glob = require("glob");
var fs = require("fs");
var language_dict = {};
var puppeteer = require("puppeteer");

glob.sync("./language/*.json").forEach(function (file) {
    let dash = file.split("/");
    if (dash.length == 2) {
        let dot = dash[1].split(".");
        if (dot.length == 2) {
            let lang = dot[0];
            fs.readFile(file, function (err, data) {
                language_dict[lang] = JSON.parse(data.toString());
            });
        }
    } else {
        console.log("Error, failed to create language files!");
    }
});

function decodeSpecialCharacters(encodedLink) {
    let decodedLink = encodedLink
        .replace(/\\u0025/g, "%")
        .replace(/\\u0026/g, "&")
        .replace(/\\u002F/g, "/")
        .replace(/\\u003A/g, ":")
        .replace(/\\u003F/g, "?")
        .replace(/\\u0023/g, "#")
        .replace(/\\u0024/g, "$")
        .replace(/\\u002B/g, "+")
        .replace(/\\u002C/g, ",")
        .replace(/\\u0020/g, " ")
        .replace(/\\u005F/g, "_")
        .replace(/\\u002E/g, ".")
        .replace(/\\u003D/g, "=")
        .replace(/\\u0025/g, "%")
        .replace(/\\u007B/g, "{")
        .replace(/\\u007D/g, "}")
        .replace(/\\u003C/g, "<")
        .replace(/\\u003E/g, ">")
        .replace(/\\u005B/g, "[")
        .replace(/\\u005D/g, "]")
        .replace(/\\u0022/g, '"')
        .replace(/\\u005C/g, "\\")
        .replace(/\\u005E/g, "^")
        .replace(/\\u0026/g, "&")
        .replace(/\\u003B/g, ";")
        .replace(/\\u007C/g, "|")
        .replace(/\\u0060/g, "`")
        .replace(/\\u0027/g, "'")
        .replace(/\\u002D/g, "-")
        .replace(/\\u0021/g, "!")
        .replace(/\\u0040/g, "@")
        .replace(/\\u002A/g, "*")
        .replace(/\\u0028/g, "(")
        .replace(/\\u0029/g, ")")
        .replace(/\\u003A/g, ":")
        .replace(/\\u002F/g, "/")
        .replace(/\\u003F/g, "?")
        .replace(/\\u0023/g, "#")
        .replace(/\\u0024/g, "$")
        .replace(/\\u002B/g, "+")
        .replace(/\\u002C/g, ",")
        .replace(/\\u0020/g, " ")
        .replace(/\\u005F/g, "_")
        .replace(/\\u002E/g, ".")
        .replace(/\\u003D/g, "=")
        .replace(/\\u0025/g, "%")
        .replace(/\\u007B/g, "{")
        .replace(/\\u007D/g, "}")
        .replace(/\\u003C/g, "<")
        .replace(/\\u003E/g, ">")
        .replace(/\\u005B/g, "[")
        .replace(/\\u005D/g, "]")
        .replace(/\\u0022/g, '"')
        .replace(/\\u005C/g, "\\")
        .replace(/\\u005E/g, "^")
        .replace(/\\u0026/g, "&")
        .replace(/\\u003B/g, ";")
        .replace(/\\u007C/g, "|")
        .replace(/\\u0060/g, "`")
        .replace(/\\u0027/g, "'")
        .replace(/\\u002D/g, "-")
        .replace(/\\u0021/g, "!")
        .replace(/\\u0040/g, "@")
        .replace(/\\u002A/g, "*")
        .replace(/\\u0028/g, "(")
        .replace(/\\u0029/g, ")");
    return decodedLink;
}

const getFacebookUrlFromRaw = (html) => {
    let videos = {};

    // get full hd quality
    try {
        let url, audio_url;
        let representations = JSON.parse(
            html
                .split('"extensions":{"all_video_dash_prefetch_representations":[{"representations":')[1]
                .split(',"video_id":')[0]
        );

        for (let i of representations) {
            if (i.height >= 1080 && i.width >= 1920 && i.mime_type == "video/mp4") {
                url = i.base_url;
            } else if (i.height == 0 && i.width == 0 && i.mime_type == "audio/mp4") {
                audio_url = i.base_url;
            }
        }

        audio_url && (videos.audio = audio_url);
        url && (videos.fullhd = { url: url, quality: "1080 (FULL HD)", render: "yes" });
    } catch (error) {
        console.log("Full HD Quality not found!" + error);
    }

    // get hd qulity
    try {
        let hd_url =
            decodeSpecialCharacters(html.split('"browser_native_hd_url":"')[1].split('"')[0]).replace(/\\/g, "") +
            "&dl=1";
        hd_url && (videos.hd = { url: hd_url, quality: "720p (HD)", render: "no" });
    } catch (error) {
        console.log("Error, HD quality nor found!" + error);
    }

    // get sd quality
    try {
        let sd_url =
            decodeSpecialCharacters(html.split('"browser_native_sd_url":"')[1].split('"')[0]).replace(/\\/g, "") +
            "&dl=1";

        sd_url && (videos.sd = { url: sd_url, quality: "360p (SD)", render: "no" });
    } catch (e) {
        console.log("Error, SD quality not found!");
    }

    if (!videos.sd) {
        videos.error = "Can not find video url source!";
    }

    return videos;
};

const crawlFacebookVideoData = async (video_url) => {
    const browser = await puppeteer.launch({
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto(video_url);
    const content = await page.content();
    let minimal_content = content;

    try {
        minimal_content = content.split("is_rss_podcast_video")[1].split("sequence_number")[0];
    } catch (error) {
        console.log("Error, can not get minimal content!" + error);
    }

    await browser.close();

    return content.includes("www.facebook.com/login") && !content.includes("browser_native_sd_url")
        ? { private: true }
        : getFacebookUrlFromRaw(minimal_content);
};

const getLanguageCode = (req) => {
    var code;
    try {
        code = req.params.code;
    } catch (error) {}
    code = language_dict.hasOwnProperty(code) ? code : "vi";
    i18n.setLocale(req, code);
    return code;
};

class HomeController {
    // [GET] - /facebook-video-downloader
    facebookPublicDownloadPage(req, res, next) {
        let canonical = app.WEBSITE_URL + req.url;

        res.render("pages/facebook_video_downloader", {
            ...app,
            languageCode: getLanguageCode(req),
            canonical,
        });
    }

    // [GET] - /facebook-private-video-downloader
    facebookPrivateDownloadPage(req, res) {
        let canonical = app.WEBSITE_URL + req.url;

        res.render("pages/facebook_private_video_downloader", {
            ...app,
            languageCode: getLanguageCode(req),
            canonical,
        });
    }

    // [POST] - /get-public-facebook-video
    getPublicFacebookVideo(req, res, next) {
        const video_url = req.body.video_url;
        crawlFacebookVideoData(video_url)
            .then((response) => res.json(response))
            .catch((err) => res.json({ msg: "Server Error, can not crawl video source" + err }));
    }

    // [POST] - /get-private-facebook-video
    getPrivateFaceBookVideo(req, res, next) {
        const page_source = req.body.page_source;
        res.json(getFacebookUrlFromRaw(page_source));
    }
}

module.exports = new HomeController();
