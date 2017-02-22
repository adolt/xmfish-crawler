const path = require('path');
const express = require('express');
const superagent = require('superagent');
const cheerio = require('cheerio');
const eventproxy = require('eventproxy');
const he = require('he');

const utils = require('./lib/utils');

const app = express();
const ep = eventproxy.create();

const baseUrl = 'http://fangzi.xmfish.com';
const fetchCount = 4; // 并发数 >6 时挂掉

let rentInfo = []; // 信息
let curCnt = 1; // 当前条数
let pageIndex = 1; // 页面页数
let innerPageIdx = -1; // 单页内部页数

// 组装查询参数
// 租金范围 对应 url中s参数的值
const rentCode = {
  undefined: '',
  '0-': '',
  '0-3': 100,
  '3-5': 101,
  '5-10': 102,
  '10-20': 103,
  '20-30': 200,
  '30-50': 300,
  '50-': 500,
};
let rent = '';
let keywords = '';
const queryStr = `/web/search_hire.html?h=&hf=&ca=&r=&s=${rentCode[rent]}&a=&rm=&f=&d=&tp=&l=0&tg=&hw=&o=&ot=1&xiaoqu=${keywords}&tst=0&page=${pageIndex}`;

app.locals.filter = {
  key: keywords,
  range: rent,
};

// 设置模板目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

app.get('/', (req, res, next) => {
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

  ep.once('load', () => {
    // 防止多次响应
    if (!res.headersSent) {
      res.render('index', {
        records: rentInfo.slice(0, curCnt),
      });
    }
  });

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

app.get('/more', (req, res) => {
  curCnt += 1;
  res.redirect('..');
});

app.get('/query', (req, res) => {
  keywords = req.query.keywords;
  rent = req.query.range;
  rentInfo = [];
  curCnt = 1;
  pageIndex = 1;
  innerPageIdx = -1;

  res.end();
});

app.listen(3000, () => {
  console.log('Server started, listening port 3000.');
});
