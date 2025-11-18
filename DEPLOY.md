# GitHub部署指南

## 📦 部署到GitHub Pages

### 方法一：使用GitHub Pages（推荐）

#### 1. 创建GitHub仓库
```bash
# 在GitHub上创建新仓库，例如：lanxin-diagnosis
```

#### 2. 初始化本地仓库
```bash
git init
git add .
git commit -m "Initial commit: 兰心慧诊系统"
```

#### 3. 关联远程仓库
```bash
git remote add origin https://github.com/your-username/lanxin-diagnosis.git
git branch -M main
git push -u origin main
```

#### 4. 启用GitHub Pages
1. 进入仓库的 Settings
2. 找到 Pages 选项
3. Source 选择 `main` 分支
4. 点击 Save

#### 5. 访问网站
等待几分钟后，访问：
```
https://your-username.github.io/lanxin-diagnosis/
```

### 方法二：使用Vercel部署

#### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

#### 2. 部署
```bash
vercel
```

#### 3. 访问
Vercel会自动生成访问链接

### 方法三：使用Netlify部署

#### 1. 访问 [Netlify](https://www.netlify.com/)

#### 2. 拖拽部署
- 将整个项目文件夹拖拽到Netlify
- 自动部署完成

#### 3. 访问
Netlify会生成访问链接

## 📱 手机端访问

### iOS设备
1. 使用Safari浏览器打开网址
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 即可像App一样使用

### Android设备
1. 使用Chrome浏览器打开网址
2. 点击菜单按钮（三个点）
3. 选择"添加到主屏幕"
4. 即可像App一样使用

### 微信内访问
直接在微信中打开链接即可使用

## 🔧 自定义域名（可选）

### 1. 购买域名
在阿里云、腾讯云等平台购买域名

### 2. 配置DNS
添加CNAME记录：
```
CNAME  www  your-username.github.io
```

### 3. 在GitHub设置
在仓库的 Settings > Pages 中设置自定义域名

## ⚙️ 配置说明

### 静态部署
当前配置为纯静态HTML页面，可直接部署到：
- GitHub Pages
- Vercel
- Netlify
- 任何静态网站托管服务

### 动态部署（需要后端）
如需使用完整的后端功能：

1. 部署到Heroku
```bash
heroku create lanxin-diagnosis
git push heroku main
```

2. 部署到Railway
- 连接GitHub仓库
- 自动部署

3. 部署到Render
- 连接GitHub仓库
- 选择Python环境
- 自动部署

## 📝 注意事项

1. **静态版本**
   - 当前index.html为静态版本
   - 可直接在GitHub Pages上运行
   - AI回复为模拟数据

2. **完整版本**
   - 需要部署Flask后端
   - 需要配置API接口
   - 需要服务器支持

3. **移动端优化**
   - 已针对手机屏幕优化
   - 支持触摸操作
   - 响应式设计

## 🚀 快速部署命令

```bash
# 1. 初始化Git
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Deploy: 兰心慧诊系统"

# 4. 添加远程仓库
git remote add origin https://github.com/your-username/lanxin-diagnosis.git

# 5. 推送
git push -u origin main
```

## 🌐 访问测试

部署完成后，在以下设备测试：
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] 微信浏览器
- [ ] PC浏览器

## 📊 性能优化

1. **CDN加速**
   - Bootstrap和图标库使用CDN
   - 加载速度快

2. **移动端优化**
   - 禁用缩放
   - 触摸优化
   - 流畅动画

3. **PWA支持**（可选）
   - 可添加manifest.json
   - 支持离线访问
   - 更像原生App

## 🎉 部署完成

部署成功后，您的兰心慧诊系统就可以在手机上访问了！

分享链接给用户，他们可以：
- 直接在浏览器中使用
- 添加到主屏幕作为App使用
- 在微信中分享和使用
