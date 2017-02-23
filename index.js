const express = require('express');
const path = require('path');
const router = require('./router/page');

const app = express();

// 设置模板目录
app.set('views', path.join(__dirname, 'views'));

// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

// 设置路由
app.use(router);

app.listen(3000, () => {
  console.log('Server started, listening port 3000.');
});
