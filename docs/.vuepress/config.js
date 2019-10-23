// const sidebar = require('../../utils/autoSidebar')

module.exports = {
  title: 'Yagami',
  description: '个人记录',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }], // 增加一个自定义的 favicon(网页标签的图标)
  ],
  markdown: {
    lineNumbers: true // 代码块显示行号
  },
  base: '/',
  themeConfig: {
    // sidebarDepth: 2, // e'b将同时提取markdown中h2 和 h3 标题，显示在侧边栏上。
    lastUpdated: 'Last Updated', // 文档更新时间：每个文件git最后提交的时间
    sidebarDepth: 2,
    nav:[
	      { text: '前端', link: '/html/' }, // 内部链接 以docs为根目录
	      { text: 'iOS', link: '/ios/' }, // 内部链接 以docs为根目录
	      { text: 'Java', link: '/java/' }, // 内部链接 以docs为根目录
	      { text: 'Python', link: '/python/' }, // 内部链接 以docs为根目录
	      { text: '算法', link: '/algorithm/' }, // 内部链接 以docs为根目录
	      { text: '博客', link: 'http://lzcdev.xyz/' },// 外部链接   
	      { text: 'Github', link: 'https://github.com/lzcdev/' }// 外部链接   
      ],
      sidebar: {
        '/html/': [
          {
            title: 'CSS',
            collapsable: true,
            children: [
              '/html/CSS/第一篇文章',
              '/html/CSS/什么'
            ]
          },
          {
            title: 'JS',
            collapsable: true,
            children: [
              '/html/JS/第二篇文章',
              '/html/JS/jslogan的'
            ]           
          },
          {
            title: 'Vue',
            collapsable: true,
            children: [
              '/html/Vue/Vuepress 使用'
            ]
          }
        ],
        '/ios/': [
          'ios 1',
          'ios 222',
        ],
        '/java/': [
          'ja'
        ],
        '/python/': [
          'p'
        ],
        '/algorithm/': [
          '算法'
        ],
      } 
  },
  // plugins: ['autobar']
}






























