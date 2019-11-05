# halo博客

## 主题调试

本地路径下需要有 `halo` 的 `jar` 包,例如 `halo-1.1.1.jar`

在终端中执行 `java -jar halo-版本号.jar --spring.profiles.active=dev`,本地会生成 `halo-dev` 的文件夹，主题存放在 `/Users/lzc/halo-dev/templates/themes/`下面

``` bash
java -jar halo-1.1.1.jar --spring.profiles.active=dev
```

执行成功后，打开 [http://localhost:8090/](http://localhost:8090/) 即可看到前端效果

后台管理端 [http://localhost:8090/admin/index.html#/dashboard]( http://localhost:8090/admin/index.html#/dashboard)


## Icarus主题添加点击爱心效果

在 `/source/js` 文件夹下新建 `clicklove.js`，内容为

```js
!function (e, t, a) {
  function n () {
    c(".heart{width: 10px;height: 10px;position: fixed;background: #f00;transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);}.heart:after,.heart:before{content: '';width: inherit;height: inherit;background: inherit;border-radius: 50%;-webkit-border-radius: 50%;-moz-border-radius: 50%;position: fixed;}.heart:after{top: -5px;}.heart:before{left: -5px;}"),
      o(),
      r()
  }
  function r () {
    for (var e = 0; e < d.length; e++)
      d[e].alpha <= 0 ? (t.body.removeChild(d[e].el), d.splice(e, 1)) : (d[e].y-- , d[e].scale += .004, d[e].alpha -= .013, d[e].el.style.cssText = "left:" + d[e].x + "px;top:" + d[e].y + "px;opacity:" + d[e].alpha + ";transform:scale(" + d[e].scale + "," + d[e].scale + ") rotate(45deg);background:" + d[e].color + ";z-index:99999");
    requestAnimationFrame(r)
  }
  function o () {
    var t = "function" == typeof e.onclick && e.onclick;
    e.onclick = function (e) {
      t && t(), i(e)
    }
  } function i (e) {
    var a = t.createElement("div");
    a.className = "heart", d.push({ el: a, x: e.clientX - 5, y: e.clientY - 5, scale: 1, alpha: 1, color: s() }), t.body.appendChild(a)
  }
  function c (e) {
    var a = t.createElement("style"); a.type = "text/css";
    try {
      a.appendChild(t.createTextNode(e))
    }
    catch (t) {
      a.styleSheet.cssText = e
    }
    t.getElementsByTagName("head")[0].appendChild(a)
  }
  function s () {
    return "rgb(" + ~~(255 * Math.random()) + "," + ~~(255 * Math.random()) + "," + ~~(255 * Math.random()) + ")"
  }
  var d = [];
  e.requestAnimationFrame = function () {
    return e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame || function (e) {
      setTimeout(e, 1e3 / 60)
    }
  }(),
    n()
}
  (window, document);%
```

编辑 `/layout/layout.ftl` 文件，添加 `
 <script src="${static!}/source/js/clicklove.js"></script>` 即可

## 主题上传失败
主题快上传成功的时候显示网络错误

这可能是由于 `Nginx` 的上传大小限制所导致的。可以在 `Nginx` 的配置文件下的 `server` 节点加入 `client_max_body_size 1024m;` 即可解决，详细配置参考如下：
```nginx
server {
    listen       80;
    server_name  localhost;
    client_max_body_size 1024m;
}
```
修改完记得刷新 `Nginx`
```bash
# 检查配置是否有误
sudo nginx -t

# 重载 Nginx 配置
sudo nginx -s reload
```

<Vssue />
