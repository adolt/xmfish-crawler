const express = require('express');
const superagent = require('superagent');
const cheerio = require('cheerio');
const eventproxy = require('eventproxy');
const he = require('he');
const utils = require('../lib/utils');
const config = require('../config/config');

const baseUrl = config.baseUrl;
const fetchCount = config.fetchCount;
const rentCode = config.rentCode;

let rentInfo = []; // 缓存信息
let curCnt = 1; // 当前条数
let pageIndex = 1; // 页面页数
let innerPageIdx = -1; // 单页内部页数
let rent = '0-'; // 查询参数：租金范围
let keywords = ''; // 查询参数：关键字
let queryStr = `/web/search_hire.html?h=&hf=&ca=&r=&s=${rentCode[rent]}&a=&rm=&f=&d=&tp=&l=0&tg=&hw=&o=&ot=1&xiaoqu=${keywords}&tst=0&page=${pageIndex}`;

const router = express.Router();
const ep = eventproxy.create();

// 渲染页面
router.get('/', (req, res, next) => {
  // 抓取查询到的url
  ep.once('request', superagent.get(baseUrl + queryStr)
    .end(ep.done('query', (sres) => {
      if (curCnt <= rentInfo.length) {
        return null;
      }
      const $ = cheerio.load(sres.text, { decodeEntities: true });

      const urls = [];
      Array.prototype.slice.call($('.list-img a')).slice(innerPageIdx * fetchCount, (innerPageIdx + 1) * fetchCount).forEach((cur) => {
        const curUrl = $(cur).attr('href');
        urls.push(baseUrl + curUrl);
      });
      console.log(urls);
      return urls;
    })));
  // 抓取每个url对应的租房详情
  ep.once('query', (urls) => {
    if (urls !== null) {
      urls.forEach((curUrl) => {
        superagent.get(curUrl)
          .end(ep.group('fetch_all', (sres) => {
            console.log(`fetch ${curUrl} successfully`);

            const $ = cheerio.load(sres.text);

            return {
              title: $('.secondMain .hd h3').text(),
              updateTime: $('.secondMain .hd span').eq(0).text(),
              imgUrl: $('.secondFocus .con li').eq(0).children().eq(0)
                .attr('src'),
              labels: he.decode($('div[class=fl]>table>tr>td>span').eq(8).html().replace(/[ ]{4}|\s/gi, '')).split(/\s/gi).slice(0, -1),
              basicInfo: utils.formatBasicInfo($),
              description: $('.infoContent').html(),
            };
          }));
      });
    }
  });
  // 缓存抓取的信息
  let i = 0;
  ep.after('fetch_all', fetchCount, (records) => {
    // 确保fetch_all已拿到正确的记录
    records.forEach(() => {
      i += 1;
    });
    if (i === fetchCount && curCnt > rentInfo.length) {
      rentInfo = rentInfo.concat(records);
      i = 0;
      ep.emit('load');
    }
  });
  // 渲染页面
  ep.once('load', () => {
    // 防止多次响应
    if (!res.headersSent) {
      res.render('index', {
        records: rentInfo.slice(0, curCnt),
      });
    }
  });
  // 异常处理
  ep.fail((err) => {
    next(err);
  });

  if (curCnt % 4 === 1) {
    innerPageIdx += 1;
    if (innerPageIdx === 20) {
      pageIndex += 1; // 单页76条, 4 * 19时单页获取完
      innerPageIdx = 0;
    }
    ep.done('request');
  } else {
    ep.emit('load');
  }
});

// 加载
router.get('/more', (req, res) => {
  curCnt += 1;
  res.redirect('..');
});

// 筛选
router.get('/query', (req, res) => {
  keywords = req.query.keywords;
  rent = req.query.range;
  rentInfo = [];
  curCnt = 1;
  pageIndex = 1;
  innerPageIdx = -1;
  queryStr = `/web/search_hire.html?h=&hf=&ca=&r=&s=${rentCode[rent]}&a=&rm=&f=&d=&tp=&l=0&tg=&hw=&o=&ot=1&xiaoqu=${keywords}&tst=0&page=${pageIndex}`;

  res.end();
});

module.exports = router;
