const he = require('he');

class Utils {
    constructor() {}

    formatBasicInfo($) {

        return {
            payment: he.decode($('div[class=fl]>table>tr>td>span').eq(7).html().replace(/	|\s/gi, '')),
            price: '￥' + $('div[class=fl]>table>tr>td>span>b').text(),
            tel: 'Tel:' + $('.secondTel').text(),
            type: he.decode($('div[class=fl]>table>tr>td>span').eq(2).html().replace(/	|\s/gi, '')),
            floor: he.decode($('div[class=fl]>table>tr>td>span').eq(3).html().replace(/	|\s/gi, '')),
            headFor: he.decode($('div[class=fl]>table>tr>td>span').eq(4).html().replace(/	|\s/gi, '')),
            decoration: he.decode($('div[class=fl]>table>tr>td>span').eq(5).html().replace(/	|\s/gi, ''))
        };
    }
}

module.exports = new Utils();
