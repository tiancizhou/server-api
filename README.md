# MIO 卡片激活和查询系统

这是一个用于 MIO 卡片激活和查询的中转服务。

## 功能特点

- 🔍 查询卡片信息
- ✅ 用户确认后激活卡片
- 📋 一键复制卡片信息（支持 HTTP/HTTPS）
- 🎨 美观的用户界面
- 🚀 快速部署，支持内网穿透
- 🧪 内置测试模式（无需真实卡片）
- ✅ 智能格式验证（防止无效请求）

## 快速开始

### 方法一：单窗口启动（推荐）⭐⭐⭐

Windows 用户直接双击运行：

```
start-combined.bat
```

特点：
- ✅ 在一个窗口中同时运行两个服务
- ✅ 输出统一显示，更简洁
- ✅ natapp 外网地址直接显示在窗口中
- ✅ 关闭窗口自动停止所有服务
- ✅ 自动记录 Node.js 日志到 `logs/` 目录

### 方法二：双窗口启动

```
start-all.bat
```

特点：
- Node.js 服务器和 natapp 各占一个独立窗口
- 可以分别查看每个服务的详细输出
- 需要分别关闭两个窗口

停止服务：双击 `stop-all.bat` 或直接关闭窗口

### 方法三：手动启动

#### 1. 安装依赖

```bash
cd server-api
npm install
```

#### 2. 启动服务

```bash
npm start
# 或使用 start.bat（仅启动本地服务器）
```

服务将在 http://localhost:5200 启动

#### 3. 配置内网穿透

启动服务后，使用内网穿透工具将服务暴露到公网：

```bash
# natapp（推荐，已集成在项目中）
.\natapp\natapp.exe

# 或使用其他路径的 natapp
C:\Tools\natapp.exe

# ngrok 示例
ngrok http 5200

# frp 示例
frpc -c frpc.ini
```

**注意**：
- natapp 已包含在项目的 `natapp\` 目录中
- 启动脚本会自动查找并使用项目目录下的 natapp.exe
- 如果项目目录中没有 natapp，脚本会尝试在系统常见路径中查找

## API 接口

### 获取卡片信息

```
GET /api/card/:cardId
```

### 激活卡片

```
POST /api/card/activate/:cardId
```

## 使用说明

### 基本操作

1. 在输入框中输入卡密（支持两种格式）：
   - UUID 格式：`mio-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - 纯数字格式：`8-20位数字`
2. 点击"获取卡信息"按钮
3. 系统会自动检查卡片状态
4. 如果卡片未激活，会显示激活提示框
5. 用户确认后点击"立即激活"按钮
6. 激活成功后显示完整的卡片信息
7. 可以点击📋图标快速复制各项信息

### 日志功能

启用日志记录模式：
```bat
start-with-logs.bat
```

查看和管理日志：
```bat
view-logs.bat
```

日志文件位置：`logs/` 目录
- `node-YYYYMMDD-HHMMSS.log` - Node.js 服务器日志（自动记录）
- natapp 不记录日志，可在 natapp 窗口直接查看实时输出

### 测试模式

双击页面标题或访问 `?test=1` 参数启用测试模式，可以使用模拟数据测试功能

## 技术栈

- 后端：Node.js + Express
- 前端：原生 HTML + CSS + JavaScript
- HTTP 客户端：Axios

## 注意事项

- 确保网络能够访问 https://misacard.com
- 服务默认运行在 5200 端口
- 使用内网穿透时注意安全性

