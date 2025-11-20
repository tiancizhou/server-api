# API抓包工具使用说明

## 功能说明

这个工具可以自动打开 https://misacard.com/activate 页面，点击"获取卡信息"按钮，并捕获API请求和响应信息，包括：
- API接口地址
- 请求方法（GET/POST等）
- 请求头（包括Authorization）
- 请求体
- 响应状态码
- 响应体

## 安装依赖

首先需要安装 Puppeteer（如果还没有安装）：

```bash
npm install
```

## 使用方法

运行抓包工具：

```bash
npm run capture
```

或者直接运行：

```bash
node capture-api.js
```

## 工作流程

1. 工具会自动打开浏览器（Chrome/Chromium）
2. 访问 https://misacard.com/activate 页面
3. 等待页面加载完成
4. 自动查找并点击"获取卡信息"按钮
5. 捕获所有网络请求和响应
6. 在控制台输出详细的API信息

## 输出信息

工具会在控制台输出：

- **请求信息**：
  - 请求方法（GET/POST等）
  - 完整的API URL
  - 所有请求头（特别标注Authorization）
  - 请求体（如果有）

- **响应信息**：
  - 响应状态码
  - 响应头
  - 响应体（JSON格式）

## 注意事项

1. **如果自动点击失败**：
   - 工具会等待30秒，您可以手动点击页面上的按钮
   - 或者打开浏览器开发者工具（F12）手动查看网络请求

2. **浏览器窗口**：
   - 工具会显示浏览器窗口，方便您观察页面
   - 浏览器会在30秒后自动关闭

3. **网络请求过滤**：
   - 只显示API相关的请求（包含 `/api/` 或 `misacard.com` 的请求）
   - 静态资源（图片、CSS、JS等）会被过滤

## 手动抓包方法（备选）

如果自动抓包工具无法正常工作，您可以手动抓包：

1. 打开浏览器，访问 https://misacard.com/activate
2. 按 F12 打开开发者工具
3. 切换到 **Network（网络）** 标签
4. 点击页面上的"获取卡信息"按钮
5. 在Network标签中找到API请求（通常是 `/api/` 开头的请求）
6. 点击该请求，查看：
   - **Headers（请求头）**：找到 `Authorization` 字段
   - **Payload（请求体）**：查看发送的数据
   - **Response（响应）**：查看返回的数据

## 获取到的信息示例

抓包成功后，您会看到类似这样的信息：

```
📤 捕获到请求:
   方法: GET
   URL: https://api.misacard.com/api/card/xxx
   Authorization: Bearer xxxxxx

📥 捕获到响应:
   URL: https://api.misacard.com/api/card/xxx
   状态码: 200
   响应体: {...}
```

将这些信息配置到管理后台的API配置中即可。

