# 前端部署指南

本文档说明如何部署 Luban 聊天应用的前端部分。

## 部署模式

### 1. 独立部署（推荐）

前端部署在 Nginx 服务器中，通过 Nginx 代理 API 请求到后端。

### 2. 开发模式

前端使用开发服务器（如 http-server），直接请求 localhost:8080 的后端 API。

## 构建和部署

### 1. 开发环境

```bash
# 克隆项目
cd frontend

# 启动开发服务器
./dev-server.sh

# 或直接使用 Python
python3 -m http.server 3000 -d .
```

访问 http://localhost:3000

### 2. 生产环境构建

```bash
# 构建生产版本
./deploy.sh production

# 或指定环境变量
VITE_API_URL=/api ./deploy.sh custom
```

这会在 `dist/` 目录生成生产文件。

### 3. Docker 部署

```bash
# 构建镜像
docker build -t luban-frontend .

# 运行容器
docker run -d -p 80:80 luban-frontend
```

### 4. Docker Compose 部署（完整环境）

```bash
# 启动完整环境（前端 + 后端 + 数据库）
docker-compose -f docker-compose.dev.yml up -d
```

## Nginx 配置

### 基本配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # API 代理
    location /api/ {
        proxy_pass http://backend-server:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA 路由处理
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 高级配置（包含安全头和缓存）

参考 `nginx.conf` 文件。

## 环境变量配置

### 开发环境

创建 `.env.development` 文件：
```
VITE_API_URL=http://localhost:8080
```

### 生产环境

创建 `.env.production` 文件：
```
VITE_API_URL=/api
```

### 自定义环境

在部署时设置环境变量：
```bash
VITE_API_URL=https://api.your-domain.com ./deploy.sh
```

## API 路由说明

前端会根据环境自动配置 API 基础 URL：

- **开发环境**: `http://localhost:8080`
- **生产环境**: `/`（相对路径，通过 Nginx 代理）

所有 API 请求都会添加对应的前缀，例如：
- `/api/chat` → `http://localhost:8080/api/chat`（开发）
- `/api/chat` → `/api/chat`（生产，通过 Nginx 代理）

## 故障排除

### 1. API 请求失败

**问题**: 前端无法连接到后端 API

**解决方案**:
- 检查 Nginx 配置中的代理设置
- 确保后端服务器正在运行
- 检查防火墙设置

### 2. 跨域问题 (CORS)

**问题**: 浏览器控制台显示 "Access-Control-Allow-Origin" 错误

**解决方案**:

#### 开发环境
1. **使用开发服务器**：
   ```bash
   cd frontend
   ./dev-server.sh  # 自动配置 CORS
   ```

2. **确保后端已启动**：
   ```bash
   go run ../cmd/server.go
   ```

3. **使用测试页面**：
   ```bash
   # 创建测试页面
   ./fix-cors.sh

   # 打开 cors_proxy.html 进行测试
   ```

#### 生产环境
1. **Nginx 配置已包含 CORS 支持**
2. **确保前端和后端在同一个域名下**
3. **Nginx 配置示例**：
   ```nginx
   location /api/ {
       proxy_pass http://backend:8080/;
       # CORS headers
       add_header Access-Control-Allow-Origin $http_origin always;
       add_header Access-Control-Allow-Credentials true always;
       add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE" always;
       add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
   }
   ```

### 2. 404 错误

**问题**: 刷新页面时出现 404 错误

**解决方案**:
- 确保 Nginx 配置了 SPA 路由处理
- 检查 `try_files` 指令

### 3. CORS 错误

**问题**: 浏览器控制台显示 CORS 错误

**解决方案**:
- 在 Nginx 中添加 CORS 头部
- 或在后端配置 CORS

## 静态资源优化

### 1. 文件名哈希

为了更好的缓存控制，可以给文件名添加哈希：
```bash
# 在部署脚本中添加
for file in css/*.js; do
    mv "$file" "${file%.js}.${hash}.js"
done
```

### 2. 压缩文件

启用 Nginx 的 gzip 压缩：
```nginx
gzip on;
gzip_types text/plain text/css text/js application/json;
```

## 安全配置

1. **Content Security Policy (CSP)**
2. **XSS 保护**
3. **HTTPS 重定向**
4. **CSRF 保护**

参考 `nginx.conf` 中的安全配置。