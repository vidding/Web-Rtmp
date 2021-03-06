# Web-Rtmp
在网页上播放RTMP视频流，通过Websocket。

## 基本原理
- 服务端
	- 使用 [websockify](https://github.com/kanaka/websockify)  wrap 一个 rtmp 服务器地址。 ([yingDev的fork](https://github.com/yingDev/websockify) 去掉了base64子协议检查)
	
     ```bash
     ./websockify.py 1999 <rtmp_server>:1935
     ```
- 浏览器
	- 使用 [node-rtmpapi](https://github.com/delian/node-rtmpapi) 解析 RTMP 协议，完成握手和通信。 ([yingDev的fork](https://github.com/yingDev/node-rtmpapi) 增加了浏览器支持、修正了几个错误)

	- 提取其中的 H264 视频流

	- 喂给 [Broadway](https://github.com/mbebenita/Broadway) 解码
	
   	 ```js
    decoder.decode(frame);
   	 ```
    
## 使用
```js
//比如 rtmp://helloworld.com/live/abc ---> app='live', streamName='abc', rtmp_server='helloworld.com'
// ./websockify.py 1999 helloworld.com:1935
var player = new WebRtmpPlayer('ws://127.0.0.1:1999', '<app>', '<streamName>', 'rtmp://<rtmp_server>/<app>');
player.canvas.style['height'] = '100%';
document.getElementById("vidCont").appendChild(player.canvas);
```
    
## 运行
```bash
git clone https://github.com/yingDev/Web-Rtmp.git
cd Web-Rtmp
git submodule update --init --recursive
cnpm install
```

```bash
# set your rtmp params in test.js first, then 
webpack -w
```
```bash
# setup test server
./websockify/websockify.py 1999 <rtmp_server>:1935
```
```bash
open index.html
```

## 局限
- Broadway: 
   <blockquote> The decoder ...does not support weighted prediction for P-frames and CABAC entropy encoding...</blockquote>

 
## 参考资料
- Real-Time Messaging Protocol (RTMP) specification <br>
http://www.adobe.com/devnet/rtmp.html

- FLV and F4V File Format Specification <br>
http://www.adobe.com/devnet/f4v.html

- h264-live-player <br> https://github.com/131/h264-live-player
