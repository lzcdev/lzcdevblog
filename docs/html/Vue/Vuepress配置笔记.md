# Vuepress配置笔记


## 结构以及说明


文章写在`docs`文件夹下面，写好文章后记得配置侧边栏

项目主要的配置在`docs\.vuepress\config.js`里面，注意`.vuepress`这个文件夹是默认隐藏的

`docs`下的`README.md`是配置首页

`deploy.sh`是发布所需的脚本

`package.json`是一些基本配置，比如配置运行发布脚本

## 启动发布项目

启动项目
```
npm run docs:dev
```

发布到线上
```
npm run deploy
```

## 其他配置

### 导航栏

```
nav:[
    { text: '前端', link: '/html/' }, 
    { text: 'iOS', link: '/ios/' }, 
    { text: 'Java', link: '/java/' }, 
    { text: 'Python', link: '/python/' }, 
    { text: '算法', link: '/algorithm/' }, 
    { text: '博客', link: 'http://lzcdev.xyz/' },
    { text: 'Github', link: 'https://github.com/lzcdev/' }
  ]
```

### 侧边栏

目前是手动配置，每新增一篇新文章需要到这里写一下，后续会考虑加入脚本自动化

```
sidebar: {
  '/html/': [
    {
      title: 'Vue',
      collapsable: true,
      children: [
        '/html/Vue/Vuepress 配置笔记'
      ]
    }
  ]
}
     
```

### 评论
这里用的是 [vssue](https://vssue.js.org/zh/guide/)，根据文档集成就好


## 发布
这里使用[Gihub Pages](https://pages.github.com/)

新建仓库一：lzcdev.github.io,不用克隆到本地

新建仓库二：lzcdevblog，在这个仓库发布代码


<Vssue />
