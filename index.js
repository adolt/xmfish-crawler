const path = require('path');
const express = require('express');
const superagent = require('superagent');
const cheerio = require('cheerio');
const eventproxy = require('eventproxy');
const he = require('he');

const utils = require('./lib/utils');

const app = express();
const ep = eventproxy.create();

// 租金范围 对应 url中s参数的值(后续界面查询使用)
const rentCode = {
    '0': '',
    '0-3': 100,
    '3-5': 101,
    '5-10': 102,
    '10-20': 103,
    '20-30': 200,
    '30-50': 300,
    '50': 500
};

const baseUrl = 'http://fangzi.xmfish.com';
const maxFetchCount = 6; // 并发数 >6 时挂掉

var rentInfo = [];
var curCnt = 1;
// 组装查询参数(后续界面查询使用)
var rent = '',
    keywords = '',
    pageIndex = '1';

var queryStr = `/web/search_hire.html?h=&hf=&ca=&r=&s=${rent}&a=&rm=&f=&d=&tp=&l=0&tg=&hw=&o=&ot=1&xiaoqu=${keywords}&tst=0&page=${pageIndex}`;

// 设置模板目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

app.get('/', (req, res, next) => {

    ep.on('request', superagent.get(baseUrl + queryStr)
        .end(ep.doneLater('query', (sres) => {
            var $ = cheerio.load(sres.text, { decodeEntities: true });

            var urls = [];
            Array.prototype.slice.call($('.list-img a')).slice(0, maxFetchCount).forEach((cur) => {
                let curUrl = $(cur).attr('href');
                urls.push(baseUrl + curUrl);
            });
            console.log(urls);
            return urls;
        })));

    ep.on('query', (urls) => {
        urls.forEach((curUrl) => {
            superagent.get(curUrl)
                .end(ep.group('fetch_all', (sres) => {
                    console.log(`fetch ${curUrl} successfully`);

                    var $ = cheerio.load(sres.text);

                    return {
                        title: $('.secondMain .hd h3').text(),
                        updateTime: $('.secondMain .hd span').eq(0).text(),
                        imgUrl: $('.secondFocus .con li').eq(0).children().eq(0).attr('src'),
                        labels: he.decode($('div[class=fl]>table>tr>td>span').eq(8).html().replace(/    |\s/gi, '')).split(/\s/gi).slice(0, -1),
                        basicInfo: utils.formatBasicInfo($),
                        description: $('.infoContent').html()
                    };

                }));
        });
    });

    ep.after('fetch_all', maxFetchCount, (records) => {
        rentInfo = rentInfo.concat(records);

        ep.emit('load');
    });

    ep.on('load', () => {
        res.render('index', {
            records: rentInfo.slice(0, curCnt++)
        });
    });

    ep.fail((err) => {
        next(err);
    });

    if (curCnt % 6 === 1) {
        ep.done('request');
    } else {
        ep.emit('load');
    }

});

app.listen(3000, () => {
    console.log('Server started, listening port 3000.');
});
