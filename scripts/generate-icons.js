// 生成 PWA 图标的简易脚本
// 在浏览器控制台或 Node.js 中运行，生成 192x192 和 512x512 的 PNG 图标

const fs = require('fs')
const path = require('path')

// 创建简单的 SVG 图标并保存
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <text x="256" y="200" text-anchor="middle" font-size="120" fill="white">🏃</text>
  <text x="256" y="360" text-anchor="middle" font-size="64" fill="white" font-weight="bold">蜕变</text>
  <circle cx="256" cy="256" r="230" fill="none" stroke="white" stroke-width="4" stroke-dasharray="20 10" opacity="0.5"/>
</svg>`

const dir = path.join(__dirname, '..', 'public', 'icons')
fs.writeFileSync(path.join(dir, 'icon-512.svg'), svgIcon)

// 由于无法直接生成 PNG，我们用 SVG 作为替代
// 现代浏览器和 PWA 也支持 SVG 图标
const manifest = {
  name: '自律打卡·蜕变自己',
  short_name: '7周蜕变',
  icons: [
    { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  ],
}

console.log('Icons generated successfully!')
console.log('Please manually create 192x192 and 512x512 PNG icons for best compatibility.')