var fs      = require('fs');
var url     = require('url');
var cheerio = require('cheerio');
var request = require('request');
var cookie  = request.cookie('showall=1');
var jar     = request.jar();
    jar.add(cookie);

var inputUrl = process.argv[2];
var info     = url.parse(inputUrl,true);
var username = info.query.id;
var album    = info.query.book;
var path     = './download/' + username + '/' + album + '/';

var dirPath = [
    'download',
    'download/' + username ,
    'download/' + username+'/' + album
];

//建資料夾
Array.prototype.mkdir = function () {
    var that = this;
    that.map(function (dirPath) {
        fs.mkdir( dirPath.toString() ,function(e){
            if(!e || (e && e.code === 'EEXIST')){
                // callback();
            } else {
                console.log('建立目錄錯誤');
                process.exit();
            }
        });
    })
}


var getAlbumPic = function(inputUrl, callback) {
    request({
        uri: inputUrl,
        method: 'GET',
        jar: jar
    }, function(error, response, body) {
        var $    = cheerio.load(body);
        var data = [];
        var len = $('#ad_square .side a').length;

        $('#ad_square .side a').map(function(i, el) {
            data.push($(this).attr('href'));
        });
        console.log('讀取相簿完成');
        callback(data);
    });
}

var getSinglePic = function(inputUrl, callback) {
    request({
        uri: 'http://www.wretch.cc/album/'+ inputUrl,
        method: 'GET',
        jar: jar
    }, function(error, response, body) {
        var $ = cheerio.load(body);
        var pic = $('.displayimg').attr('src') || $('#DisplayImage').attr('src');;
        if (pic) {
            callback(pic);
        }else {
            console.log(inputUrl, '非照片不下載');
        }
    });
}

var downloadPic = function (pic, callback) {
    var re = /\d+\.jpg/;
    var picName = re.exec(pic)[0];
    request(pic).pipe(fs.createWriteStream( path + picName ));
    console.log(picName, '儲存成功');
    // callback();
    // **********************************************
    //    callback(); 應該寫在request的callback裡面
    // **********************************************
}



var main = function (arguments) {
    // 抓整個相簿的像片清單
    getAlbumPic(inputUrl, function (picList) {
        // 然後得到 picList 之後去找出每個照片的真實網址
        picList.map(function (inputUrl) {
            // 找到圖片網址之後傳給 downloadPic 做下載
            getSinglePic(inputUrl, downloadPic );
        });
    });
}

dirPath.mkdir();
main();