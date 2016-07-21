EasyRTC 实例： 1. 认证和加入房间功能。 2. 支持设置分辨率，诊断运动物体(pull dev-redis)。 3. 自动选择turn server。 即将支持MCU

直接执行 node server.js 即可。访问地址：http://localhost:3000/ 

你也可以访问我的实例网站观看效果: rtc.yimily.org

*****************************************************************************
EasyRTC Server Example with auth and room joining, automatically choose turn server(is set by cluster.ini) to relay. Will support MCU using janus-gateway.

This folder contains all the files you'll need to create a simple server with EasyRTC, Express, and Socket.io. You can copy these files where you wish.

Files and Folders:

package.json - Provides project information allowing npm to find and install required modules.
server.js - Server code.
/static/ - Root folder for web server. Put html files here!
Running the Server:

Type node server.js in console.
Viewing the examples:

In your WebRTC enabled browser, visit your server address including the port. By default port 3000 is used.
http://localhost:3000/ (you can check the sample website here: rtc.yimily.org)

Feel free to open issues if any problem found, Or e-mail me.
