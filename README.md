# 麻将记账助手

一款简单实用的麻将记账工具，帮助您轻松记录四人麻将游戏的每局输赢情况。

## 主要功能

- **玩家管理**：添加、删除玩家，自定义头像
- **游戏记录**：记录每局游戏的输赢情况，确保总分平衡
- **历史记录**：查看过去的游戏记录和详情
- **长期统计**：分析玩家长期输赢情况

## 技术特点

- 纯HTML/CSS/JavaScript实现，无需后端服务器
- 响应式设计，适配各种设备屏幕
- 使用localStorage存储数据
- 支持PWA，可安装到设备主屏幕
- 离线可用

## 如何使用

1. 直接在浏览器中打开index.html文件
2. 或者部署到任意Web服务器上
3. 手机访问时可添加到主屏幕，获得更好的体验

## 转换为APK（安卓应用）

如果需要将此Web应用程序转换为APK文件以便在安卓设备上安装，可以使用以下工具之一：

1. **PWA2APK**：访问 https://pwa2apk.com，输入您部署此应用的URL，按照步骤操作

2. **Bubblewrap**：Google的官方工具
   ```
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest=https://your-deployed-url/manifest.json
   bubblewrap build
   ```

3. **TWA (Trusted Web Activity)**：使用Android Studio创建TWA项目

4. **Cordova/PhoneGap**：将此项目导入Cordova，然后构建APK

## 数据存储

应用程序使用浏览器的localStorage存储所有数据，包括：
- 玩家信息
- 游戏记录
- 统计数据

注意：清除浏览器数据会导致应用数据丢失，请谨慎操作。

## 开发者

如需贡献代码或报告问题，请联系开发者。 