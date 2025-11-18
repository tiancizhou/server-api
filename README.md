# MIO 卡片激活和查询系统

这是一个用于 MIO 卡片激活和查询的中转服务。

## 功能特点

### 用户端
- 🔍 查询卡片信息
- ✅ 用户确认后激活卡片
- 📋 一键复制卡片信息（支持 HTTP/HTTPS）
- 🎨 美观的用户界面
- 🚀 快速部署，支持内网穿透
- 🧪 内置测试模式（无需真实卡片）
- ✅ 智能格式验证（防止无效请求）

### 管理后台（新增）
- 📦 卡密批量导入（智能识别多种格式）
- 📋 一键取卡并复制（闲鱼发货专用）
- 📊 库存实时统计（可用/已售/已用）
- 🔄 自动标记已使用（用户激活后自动更新）
- 🗑️ 批量清理已使用卡密
- 🔐 密码保护（防止未授权访问）
- 💾 本地存储（JSON文件，无需数据库）

## 快速开始

### 方法一：Windows 服务（推荐，开机自启）⭐⭐⭐⭐⭐

将 Node.js 和 Natapp 注册为 Windows 系统服务，实现：
- ✅ 开机自动启动（Node.js + Natapp）
- ✅ 后台运行，无需保持窗口
- ✅ 服务崩溃自动重启
- ✅ 统一的服务管理界面
- ✅ 自动获取外网访问地址

**一键安装所有服务**（以管理员身份运行）：
```
nssm\install-all-services.bat
```

**服务管理**：
```
nssm\start-all-services.bat      # 启动所有服务
nssm\stop-all-services.bat       # 停止所有服务
nssm\status-all-services.bat     # 查看状态（推荐）✨
nssm\uninstall-all-services.bat  # 卸载所有服务
```

**只安装 Node.js 服务**（不需要外网访问）：
```
nssm\install-service.bat         # 仅安装 Node.js
nssm\start-service.bat           # 启动
nssm\stop-service.bat            # 停止
nssm\status-service.bat          # 查看状态
```

**Windows 命令**：
```
net start MIOCardService    # 启动 Node.js（会自动启动 Natapp）
net stop NatappTunnel       # 停止 Natapp
net stop MIOCardService     # 停止 Node.js
services.msc                # 打开服务管理器
```

**查看外网地址**：
- 运行 `status-all-services.bat` 查看实时日志
- 或查看日志文件：`logs\natapp-stdout.log`

详细说明请查看：[nssm/README.md](nssm/README.md)

### 方法二：单窗口启动⭐⭐⭐

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

### 方法三：双窗口启动

```
start-all.bat
```

特点：
- Node.js 服务器和 natapp 各占一个独立窗口
- 可以分别查看每个服务的详细输出
- 需要分别关闭两个窗口

停止服务：双击 `stop-all.bat` 或直接关闭窗口

### 方法四：手动启动

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

### 用户端 API

#### 获取卡片信息

```
GET /api/card/:cardId
```

#### 激活卡片

```
POST /api/card/activate/:cardId
```

### 管理后台 API

所有管理后台 API 需要在请求头中添加密码认证：
```
x-admin-password: your_password
```

#### 获取统计信息

```
GET /api/admin/stats
```

#### 获取卡密列表

```
GET /api/admin/cards?filter=all
# filter: all, available, sold, used
```

#### 批量导入卡密

```
POST /api/admin/cards/import
Content-Type: application/json

{
  "cards": ["mio-xxx", "mio-yyy"]
}
```

#### 获取下一个可用卡密

```
POST /api/admin/cards/get-next
```

#### 标记卡密为已售出

```
POST /api/admin/cards/mark-sold/:cardId
Content-Type: application/json

{
  "buyer": "买家信息（可选）"
}
```

#### 清理已使用的卡密

```
POST /api/admin/cards/cleanup
```

## 使用说明

### 用户端使用（前台页面）

1. 在输入框中输入卡密（支持两种格式）：
   - UUID 格式：`mio-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - 纯数字格式：`8-20位数字`
2. 点击"获取卡信息"按钮
3. 系统会自动检查卡片状态
4. 如果卡片未激活，会显示激活提示框
5. 用户确认后点击"立即激活"按钮
6. 激活成功后显示完整的卡片信息
7. 可以点击📋图标快速复制各项信息

### 管理后台使用（闲鱼发货）⭐ 新功能

**访问地址**：`http://localhost:5200/admin` 或通过内网穿透后的域名

#### 1. 登录后台
- 默认密码：`admin123`
- 可通过环境变量 `ADMIN_PASSWORD` 修改密码

#### 2. 批量导入卡密
1. 打开你从卡渠道下载的卡密文件（txt格式）
2. 全选并复制所有内容（支持智能识别格式）：
   ```
   卡密: mio-xxx 额度: 0 有效期: 1小时
   卡密: mio-yyy 额度: 0 有效期: 1小时
   ```
3. 粘贴到"批量导入卡密"文本框
4. 点击"导入卡密"按钮
5. 系统会自动去重并显示导入结果

**支持的格式**：
- `卡密: mio-xxx 额度: 0 有效期: 1小时`（自动提取）
- `mio-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`（纯卡密）
- `8-20位纯数字`

#### 3. 闲鱼发货流程（重点）⚡
1. 买家下单后，打开管理后台
2. 点击"📋 获取下一个卡密并复制"按钮
3. 卡密自动复制到剪贴板
4. 粘贴到闲鱼对话框发送给买家
5. 发送后点击"✓ 已发货，标记为已售出"按钮
6. 系统自动更新库存，防止重复发货

**优势**：
- ✅ 一键复制，无需手动查找卡密
- ✅ 自动标记，防止重复发货
- ✅ 买家激活后自动标记为"已使用"
- ✅ 实时库存统计，低库存预警

#### 4. 库存管理
- **统计卡片**：顶部显示总数、可用、已售、已用数量
- **筛选查看**：点击按钮筛选不同状态的卡密
- **清理数据**：点击"🗑️ 清理已使用"批量删除已用卡密

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
- `service-stdout.log` - Node.js 服务标准输出日志
- `service-stderr.log` - Node.js 服务错误日志
- `natapp-stdout.log` - Natapp 服务输出日志（包含外网 URL）
- `natapp-stderr.log` - Natapp 服务错误日志
- `node-YYYYMMDD-HHMMSS.log` - 手动启动时的 Node.js 日志

### 测试模式

双击页面标题或访问 `?test=1` 参数启用测试模式，可以使用模拟数据测试功能

## 技术栈

- 后端：Node.js + Express
- 前端：原生 HTML + CSS + JavaScript
- HTTP 客户端：Axios

## 配置说明

### 修改管理后台密码

**方法一：环境变量**（推荐）
```bash
# Windows PowerShell
$env:ADMIN_PASSWORD="your_strong_password"
npm start

# Windows CMD
set ADMIN_PASSWORD=your_strong_password
npm start
```

**方法二：直接修改 server.js**
```javascript
const ADMIN_PASSWORD = 'your_strong_password';
```

### 数据存储

- 卡密数据存储在 `data/cards.json` 文件中
- 文件会自动创建，无需手动配置
- 建议定期备份 `data/` 目录
- 数据文件已添加到 `.gitignore`，不会被提交到 Git

## 注意事项

- ⚠️ 确保网络能够访问 https://misacard.com
- ⚠️ 服务默认运行在 5200 端口
- ⚠️ 使用内网穿透时注意安全性
- 🔐 **重要**：修改默认管理密码，防止未授权访问
- 💾 定期备份 `data/cards.json` 文件
- 🗑️ 定期清理已使用的卡密，释放存储空间
- 📊 建议保持可用库存数量 > 10，避免缺货

