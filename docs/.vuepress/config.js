// const sidebar = require('../../utils/autoSidebar')

module.exports = {
  title: 'lzcdev的学习记录',
  description: 'Talk is cheap. Show me the Code',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }], // 增加一个自定义的 favicon(网页标签的图标)
  ],
  markdown: {
    lineNumbers: true // 代码块显示行号
  },
  base: '/',
  themeConfig: {
    lastUpdated: 'Last Updated',
    sidebarDepth: 2,
    nav: [
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
          title: 'Vue',
          collapsable: true,
          children: [
            '/html/Vue/Vuepress配置笔记'
          ]
        },
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
        }
      ],
      '/ios/': [
        '深入理解Category',
        'Fastlane自动化构建',
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
  plugins: [
    ['@vuepress/back-to-top', true],
    ['@vssue/vuepress-plugin-vssue', {
      // 设置 `platform` 而不是 `api`
      platform: 'github',
      // 其他的 Vssue 配置
      owner: 'lzcdev',
      repo: 'lzcdevblog',
      clientId: 'bb016e51ba736882ec2c',
      clientSecret: 'ec552d8fb56a7d848abc56047e27d458227c5aee',
    }]
  ]

}






























