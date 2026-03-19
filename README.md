# 私人财务账本 PWA

这是一个可直接部署的 React + Vite + PWA 版本，用于个人记录：
- 预期赚钱
- 自有财产
- 负债
- 还款记录
- 收入 / 支出流水
- 预算
- 资金日历
- 本地密码锁

## 本地运行

```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
```

## 部署到手机使用

### 方案 1：Vercel
1. 把整个项目上传到 GitHub
2. 在 Vercel 导入仓库
3. 部署完成后，用手机浏览器打开网址
4. iPhone 用 Safari -> 分享 -> 添加到主屏幕
5. Android 用 Chrome -> 菜单 -> 添加到主屏幕 / 安装应用

### 方案 2：Netlify
1. 本地执行 `npm run build`
2. 把 `dist` 文件夹拖到 Netlify
3. 用手机打开部署网址并添加到主屏幕

## 数据说明
- 所有数据默认保存在浏览器本地 localStorage
- 导出功能会下载 JSON 备份文件
- 导入功能可恢复备份
- 换浏览器或清缓存会丢失本地数据，建议定期导出备份
