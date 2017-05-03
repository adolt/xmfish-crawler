# xmfish-crawler
用nodejs实现的简单爬虫，爬取[小鱼房产](http://fangzi.xmfish.com/web/search_hire.html)的租房信息，并重新渲染页面展示。
# Install
`mkdir xmfish-crawler`

`cd xmfish-crawler`

`git init`

`git pull https://github.com/adolt/xmfish-crawler.git`

`cnpm i --save`

# Start
`npm start`

打开浏览器输入 localhost:3000 即可看到爬取的内容

# Todo
- [x] 在页面提供条件筛选（爬的网站不支持条件筛选😅）
- [x] 在页面提供无限加载
- [x] 增加内容loading提示
- [x] 增加Travis CI
