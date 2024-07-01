
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var partials = require("express-partials");
var i18n = require("i18n");
const glob = require("glob");
const fs = require("fs");
const routes = require("./routes");
const os = require("os");
const puppeteer = require("puppeteer");
const favicon = require('serve-favicon'); // Add this line

var app = express();

i18n.configure({
  locales: ["vi", "en", "ja", "ko", "it", "ms", "ro", "jv", "bn", "cs", "de", "es", "fr", "hi", "id", "pa", "pt", "ru", "th", "tr", "uk"],
  directory: __dirname + "/language",
  cookie: "lang",
  header: "accept-language",
});
app.use(i18n.init);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(partials());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, 'public', '/image/fb-icon.png'))); // Add this line

// viết câu lệnh xử lý khi người dùng truy cập trang chủ
app.get('/',function (req,res) {
  let lang  = 'en';
  i18n.setLocale(req,'en')
  res.render('index', {lang : lang})
})
// viết câu lệnh xử lý khi người dùng truy cập trang có ngôn ngữ cụ thể :
// ví dụ : https://dotsave.app/en

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/facebook-private-video-downloader', async (req, res) => {
  const  url  = req.body.url ;
  console.log("URL Video Facebook: " + url);
  if (url) {
    try {
      const videoData = await crawlFacebookVideoData(url);
      res.json(videoData);
    } catch (error) {
      console.error("Error while extracting video data:", error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  } else {
    res.status(400).json({ error: 'Invalid URL. Please provide a valid Facebook video URL.' });
  }
});


app.get('/:lang',function (req,res,next) {
  // lấy ra địa chỉ truy vấn
  const q = req.url;
  // tách ra language code từ địa chỉ truy vấn
  let dash = q.split("/");
  let lang = undefined
  if (dash.length >= 2) {
    let code = dash[1];
    console.log(language_dict)
    console.log('code = ' + code)
    console.log(language_dict[code])
    if (code !== '' && language_dict.hasOwnProperty(code)) {
      lang = code;
      console.log('AAAA' + lang)
    } else {
      next(createError(404))
      return
    }
  }
  if (lang == undefined) lang = 'en'
  i18n.setLocale(req,lang)
  res.render('index', {lang : lang})
})

// Lấy danh sách các giao diện mạng của máy tính
const networkInterfaces = os.networkInterfaces();

// Duyệt qua danh sách và lấy ra địa chỉ IPv4
let serverIP = null;
Object.keys(networkInterfaces).forEach((interfaceName) => {
  const interfaces = networkInterfaces[interfaceName];
  interfaces.forEach((interfaceInfo) => {
    if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
      serverIP = interfaceInfo.address;
    }
  });
});

console.log("=====================================");
console.log(`Server IP: ${serverIP}:${process.env.PORT}`);
console.log("Website URL: " + process.env.WEBSITE_URL);
console.log("=====================================");

routes(app);

// catch 404 and forward to error handler
const language_dict = {};

glob.sync('../language/*.json').forEach(function (file) {
  let dash = file.split("/");
  if (dash.length == 3) {
    let dot = dash[2].split(".");
    if (dot.length == 2) {
      let lang = dot[0];
      fs.readFile(file, function (err, data) {
        language_dict[lang] = JSON.parse(data.toString());
      });
    }
  }
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
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

    // audio_url && (videos.audio = audio_url);
    // url && (videos.fullhd = { url: url, quality: "1080 (FULL HD)", render: "yes" });
  } catch (error) {
    console.log("Full HD Quality not found!" + error);
  }

  // get hd qulity
  try {
    let hd_url = decodeSpecialCharacters(html.split('"browser_native_hd_url":"')[1].split('"')[0]).replace(/\\/g, "") + "&dl=1";
    if (hd_url) {
      videos.hd = { url: hd_url, quality: "720 (HD)", render: "no" };
    }
  } catch (error) {
    console.log("Error, HD quality not found! " + error);
  }

  // get sd quality
  try {
    let sd_url =
        decodeSpecialCharacters(html.split('"browser_native_sd_url":"')[1].split('"')[0]).replace(/\\/g, "") +
        "&dl=1";

    sd_url && (videos.sd = { url: sd_url, quality: "360 (SD)", render: "no" });
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
  console.log(video_url)
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

module.exports = app;
