const he = require('he');

function formatBasicInfo($) {
  return {
    payment: he.decode($('div[class=fl]>table>tr>td>span').eq(7).html().replace(/[ ]{4}|\s/gi, '')),
    price: `￥${$('div[class=fl]>table>tr>td>span>b').text()}`,
    tel: `Tel:${$('.secondTel').text()}`,
    type: he.decode($('div[class=fl]>table>tr>td>span').eq(2).html().replace(/[ ]{4}|\s/gi, '')),
    floor: he.decode($('div[class=fl]>table>tr>td>span').eq(3).html().replace(/[ ]{4}|\s/gi, '')),
    headFor: he.decode($('div[class=fl]>table>tr>td>span').eq(4).html().replace(/[ ]{4}|\s/gi, '')),
    decoration: he.decode($('div[class=fl]>table>tr>td>span').eq(5).html().replace(/[ ]{4}|\s/gi, '')),
  };
}

module.exports = { formatBasicInfo };
