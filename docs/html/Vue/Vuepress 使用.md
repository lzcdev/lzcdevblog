# Vuepress 使用


## 安装

### 安装 Node
> 确保你的 Node.js 版本 >= 8

### 安装Vuepress
```
npm install -g vuepress
```

## 创建并启动项目

在终端创建项目文件夹，并创建一个 README.md 文件
```
mkdir vuepress-blog && cd vuepress-blog && touch README.md
```
启动项目
```
vupress dev .
```
这样一个最原始的项目就创建好了

## 其他配置
### 搭建项目常用目录结构


在根目录下新建 docs 目录

在根目录下新建 package.json 文件

在 package.json 中添加以下代码
```
{
  "scripts": {
    "docs:dev": "vuepress dev docs",
    "docs:build": "vuepress build docs",
    "deploy": "bash deploy.sh"
  }
}
```
这样就可以通过`npm run docs:dev`来启动项目了
