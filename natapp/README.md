# natapp 配置说明

这个目录用于存放 natapp 内网穿透工具。

## 获取 natapp

1. 访问 [natapp.cn](https://natapp.cn/) 注册账号
2. 在管理面板中创建一条隧道（选择免费隧道或付费隧道）
3. 下载 Windows 版客户端
4. 将下载的 `natapp.exe` 放到此目录

## 配置

1. 复制 `config.ini.example` 为 `config.ini`：
   ```bash
   copy config.ini.example config.ini
   ```

2. 编辑 `config.ini`，将 `YOUR_AUTHTOKEN_HERE` 替换为你在 natapp 管理面板中获取的 authtoken：
   ```ini
   [default]
   authtoken=你的authtoken
   ```

3. 保存文件

## 注意事项

⚠️ **重要**：
- `config.ini` 包含你的认证令牌，**不要**提交到公开仓库
- `natapp.exe` 是二进制文件，已在 `.gitignore` 中排除
- 仅提交 `config.ini.example` 模板文件

## 目录结构

```
natapp/
├── README.md              # 本说明文件
├── config.ini.example     # 配置模板（可提交）
├── config.ini            # 实际配置（不提交，包含敏感信息）
└── natapp.exe            # natapp 客户端（不提交）
```

## 使用启动脚本

项目根目录的启动脚本会自动查找 `natapp\natapp.exe`：
- `start-combined.bat` - 单窗口启动（推荐）
- `start-all.bat` - 双窗口启动
- `start-with-logs.bat` - 带日志记录启动

如果 natapp.exe 不在此目录，脚本会尝试在以下位置查找：
1. 项目目录\natapp\natapp.exe（优先）
2. 项目目录\natapp.exe
3. C:\tools\natapp\natapp.exe
4. C:\Tools\natapp.exe
5. 桌面\natapp.exe
6. 下载文件夹\natapp.exe

