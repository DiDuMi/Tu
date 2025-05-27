# FFmpeg 安装指南

## 🚀 快速安装

### 方法1：使用自动安装脚本（推荐）

#### Windows批处理脚本
```bash
# 右键以管理员身份运行
scripts/install-ffmpeg.bat
```

#### PowerShell脚本
```powershell
# 右键PowerShell以管理员身份运行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\install-ffmpeg.ps1
```

### 方法2：使用包管理器

#### Chocolatey（推荐）
```bash
# 安装Chocolatey（如果未安装）
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装FFmpeg
choco install ffmpeg -y
```

#### Scoop
```bash
# 安装Scoop（如果未安装）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 安装FFmpeg
scoop install ffmpeg
```

#### winget（Windows 10/11）
```bash
winget install ffmpeg
```

### 方法3：手动安装

1. **下载FFmpeg**
   - 访问：https://ffmpeg.org/download.html
   - 点击"Windows"图标
   - 选择"Windows builds by BtbN"或"gyan.dev"
   - 下载"ffmpeg-master-latest-win64-gpl.zip"

2. **解压安装**
   - 解压到`C:\ffmpeg`
   - 确保目录结构为：`C:\ffmpeg\bin\ffmpeg.exe`

3. **添加到PATH环境变量**
   - 右键"此电脑" → "属性" → "高级系统设置"
   - 点击"环境变量"
   - 在"系统变量"中找到"Path"，点击"编辑"
   - 点击"新建"，输入：`C:\ffmpeg\bin`
   - 点击"确定"保存所有设置

4. **验证安装**
   - 重新打开命令提示符
   - 运行：`ffmpeg -version`
   - 运行：`ffprobe -version`

## 🔍 验证安装

安装完成后，请验证FFmpeg是否正确安装：

```bash
# 检查FFmpeg版本
ffmpeg -version

# 检查FFprobe版本
ffprobe -version
```

如果看到版本信息，说明安装成功。

## 🛠️ 故障排除

### 问题1：命令未找到
```
'ffmpeg' 不是内部或外部命令
```

**解决方案：**
1. 确认FFmpeg已正确安装到`C:\ffmpeg\bin`
2. 检查PATH环境变量是否包含`C:\ffmpeg\bin`
3. 重新启动命令提示符或重启电脑
4. 重新运行验证命令

### 问题2：权限错误
```
拒绝访问
```

**解决方案：**
1. 以管理员身份运行命令提示符
2. 确保有足够的磁盘空间
3. 检查防病毒软件是否阻止安装

### 问题3：下载失败
```
网络连接错误
```

**解决方案：**
1. 检查网络连接
2. 尝试使用VPN或代理
3. 手动下载安装包
4. 使用其他安装方法

## 📋 安装后配置

### 重启Node.js应用
安装FFmpeg后，需要重启您的Node.js应用程序：

```bash
# 停止当前服务
Ctrl + C

# 重新启动
npm run dev
```

### 验证视频处理功能
1. 访问：http://localhost:3000/test/upload-test
2. 上传一个视频文件
3. 检查服务器日志，应该看到：
   ```
   🎬 开始视频处理和压缩
   ✅ 视频压缩成功
   ```

## 🎯 预期效果

安装FFmpeg后，您的视频上传功能将：

- ✅ 自动压缩所有上传的视频
- ✅ 根据文件大小智能选择压缩参数
- ✅ 生成视频缩略图
- ✅ 优化视频格式为MP4
- ✅ 提供详细的压缩日志

## 📞 获取帮助

如果安装过程中遇到问题：

1. **查看错误日志**：记录具体的错误信息
2. **检查系统要求**：确保Windows版本兼容
3. **尝试不同方法**：如果一种方法失败，尝试其他安装方法
4. **重启系统**：有时需要重启才能生效

## 🔄 卸载FFmpeg

如果需要卸载FFmpeg：

### Chocolatey
```bash
choco uninstall ffmpeg
```

### Scoop
```bash
scoop uninstall ffmpeg
```

### 手动卸载
1. 删除`C:\ffmpeg`文件夹
2. 从PATH环境变量中移除`C:\ffmpeg\bin`
3. 重启命令提示符

---

**注意**：安装完成后，请重新启动您的Node.js应用程序以使FFmpeg生效。
