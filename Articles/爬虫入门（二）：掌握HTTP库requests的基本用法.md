
我们知道，Python内置了urllib等模块用于HTTP请求，然而它的API使用起来并不优雅，于是[Requests](https://github.com/requests/requests)基于urllib进行了高度封装，使用起来更加简洁、更加人性化。它是Python的一个非常强大的HTTP库。看一下它霸气的介绍
>Requests is the only Non-GMO HTTP library for Python, safe for human consumption.

本文主要参考官方文档，梳理了一些常见的用法。更加详细的文档还是看[官方文档](http://www.python-requests.org/en/master/)比较直接.

<!--more--> 
## 特性
- International Domains and URLs（国际域名和URLs）
- Keep-Alive & Connection Pooling（Keep-Alive & 连接池）
- Sessions with Cookie Persistence（带持久 Cookie 的会话）
- Browser-style SSL Verification（浏览器式SSL认证）
- Basic/Digest Authentication（基本/摘要式的身份认证）
- Elegant Key/Value Cookies（优雅的 key/value Cookie）
- Automatic Decompression（自动解压）
- Automatic Content Decoding（自动内容解码）
- Unicode Response Bodies（Unicode 响应体）
- Multipart File Uploads（文件分块上传）
- HTTP(S) Proxy Support（HTTP(S) 代理支持）
- Connection Timeouts（连接超时）
- Streaming Downloads（流下载）
- .netrc Support（支持 .netrc）
- Chunked Requests（分块请求）
当今 Web 服务的需求基本上都可以满足。

## 用法
#### 普通HTTP请求
向我的博客发起一个 get 请求，获取到它页面的源代码。可以得到一个 response对象，就是这么简洁
```
import requests
response = requests.get('https://coderlzc.bitcron.com')
print response.text
```
对于post请求，只需要把get换成post就可以了
```
import requests
response = requests.get('https://coderlzc.bitcron.com')
print response.text
```
同理，对于put，delete，head 以及 options都是一样的
```
response = requests.put('https://coderlzc.bitcron.com')
response = requests.delete('https://coderlzc.bitcron.com')
response = requests.head('https://coderlzc.bitcron.com')
response = requests.options('https://coderlzc.bitcron.com')
```
####  带参数的HTTP请求
当请求的地址需要拼接参数时，requests提供了一个`params`关键字参数，这是一个字符串字典。打印url可以看到url已经被正确编码了`http://httpbin.org/?age=25&name=lzc`
```
import requests

base_url = 'http://httpbin.org/'
params = {
    'name': 'lzc',
    'age': 25
}
response = requests.get(base_url, params=params)
print response.url
# http://httpbin.org/?age=25&name=lzc
# print response.text
```
带参数的post请求还是表较常见的，比如说登录等功能，需要将信息以表单的形式发给服务器，requests提供了一个 data 参数，它是一个字典.
```
data = {'key1': 'value1', 'key2': 'value2'}
response = requests.post("http://httpbin.org/post", data=data)
print response.text
```
打印返回结果可以看到，已经将data编码为表单形式了
```
{
  "args": {},
  "data": "",
  "files": {},
  "form": {
    "key1": "value1",
    "key2": "value2"
  },
  "headers": {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "close",
    "Content-Length": "23",
    "Content-Type": "application/x-www-form-urlencoded",
    "Host": "httpbin.org",
    "User-Agent": "python-requests/2.13.0"
  },
  "json": null,
  "origin": "138.197.199.82",
  "url": "http://httpbin.org/post"
}
```
#### HTTP响应
发起请求后，requests会将http响应封装成一个response对象，它常用的属性和方法如下 ：

属性名       |      结果    
|:----:|:-------|:------|
text            |    HTTP字符       
encoding   |    响应编码，这个值可以改变，改变之后text属性也会根据编码而变化       
content     |    未编码的二进制数据       
json()         |    返回JSON数据      
raw            |    结果的原始字节流    
url	         |    请求的URL   
status_code      |    状态码    
headers     |    请求头字典   
cookies     |    	cookies字典  
history      |    如果发生重定向，所有请求对象都会保存到这里    

requests会根据 HTTP 头对响应的编码作出推测。可以查看当前的编码
```
print response.encoding
```
特别是当调用`response.text`文本不能正常显示时，可以通过`response.encoding` 属性来改变它，这个属性用的还是比较多的
```
response.encoding = 'utf-8'
```
以上所有的属性都可以通过`print response.XXX`打印出来看看，自然就明白了
#### 请求头headers
在实际应用中，想要模拟浏览器的请求行为，构造请求头是必须的。构造方式其实就是一个字典，比如说构造`User-Agent`和`Cookie`
```
import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36',
    'Cookie': 'XXX'
}
response = requests.get('http://httpbin.org/get', headers=headers)
print response.text
```
打印返回结果可以看到，已经成功向服务器发送了headers信息
```
{
  "args": {},
  "headers": {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "close",
    "Cookie": "XXX",
    "Host": "httpbin.org",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36"
  },
  "origin": "74.207.248.116",
  "url": "http://httpbin.org/get"
}
```
#### 超时
requests 发送请求时，默认请求下线程一直阻塞，如果遇到服务器没有响应的情况时，它将导致整个应用程序一直处于阻塞状态而没法处理其他请求。有其他编程经验的开发者肯定会明白设置超时时间是多么重要。所以你总是应该为你的请求设置一个超时时间。
```
requests.get('https://coderlzc.bitcron.com', timeout=10)
```
#### 结语
学会了以上常见内容就可以正常访问一些普通网站了，当然reqeusts远远不止这些功能，而大部分网站也不会让你这么轻松访问，特别是很多网站都有反爬虫机制，这是一场矛与盾的较量










