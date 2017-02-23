module.exports = {
  baseUrl: 'http://fangzi.xmfish.com',

  fetchCount: 4, // 并发数 >6 时挂掉

  rentCode: {
    '0-': '',
    '0-3': 100,
    '3-5': 101,
    '5-10': 102,
    '10-20': 103,
    '20-30': 200,
    '30-50': 300,
    '50-': 500,
  },
};
