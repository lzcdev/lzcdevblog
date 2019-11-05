# 阿里云ECS相关



## 登录

```
ssh root@47.96.73.255
密码
```

## 文件夹说明

```
[root@izbp16rj3olbfn65dbpsp4z ~]# ls
certbot-auto  halo-latest.jar  hello  nohup.out  sign  wyxq
```

cerbot-auto 是为各种域名申请 https 用的,如果 https 证书过期

```
./certbot-auto renew
```

halo-latest.jar 和 nohup.out 是 halo 博客用的

hello 这个文件夹是一个测试 Python 文件夹

sign 这个文件夹是之前各种 App 签到的一个 Python 脚本

wyxq 这个文件夹是之前网易星球签到的一个 Python 脚本


## 定时任务

[https://help.aliyun.com/knowledge_detail/41445.html](https://help.aliyun.com/knowledge_detail/41445.html)

注意！！！Python 路径和脚本路径一定要用绝对路径！！！

列出所有定时任务
```
crontab -l   

0 * * * * /usr/bin/python /root/wyxq/wyxq.py
00 08 * * * /usr/bin/python /root/sign/wyxq_sign.py
0 0,12 * * * /usr/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && ./certbot-auto renew
```      
列出所有的定时任务，如果没有定时任务，返回 no crontab for root 信息。

新建定时任务
```
crontab -e   
```        
打开 crontab 定时任务编辑界面，按 I 键进入编辑模式。

## Nginx

进入 Nginx 配置目录
```
[root@izbp16rj3olbfn65dbpsp4z nginx]# cd conf.d/
[root@izbp16rj3olbfn65dbpsp4z conf.d]# ls
default.conf  ghost.conf  halo.conf  netnease.conf  node.conf
```

### 端口转发

服务器一般只放开 80\443 的权限，其他的端口需要通过 Nginx 转发到 80 端口，比如我这里部署 halo 的 jar 包的时候，跑在 8090 端口上，需要用 Nginx 转发到 80 端口
```
[root@izbp16rj3olbfn65dbpsp4z conf.d]# cat halo.conf
server {
    listen 80;

    server_name lzcdev.top www.lzcdev.top;

    location / {
        proxy_set_header HOST $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_pass  http://172.16.43.70:8090/;
    }
}
```

<Vssue />