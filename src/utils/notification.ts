import { db } from '@/db'
import { isTodayMonday } from '@/data/planData'

// 检查是否应该发送通知
export async function checkAndNotify() {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const allSettings = await db.notificationSettings.toArray()

  for (const setting of allSettings) {
    if (!setting.enabled) continue
    if (setting.time !== currentTime) continue

    // 测量提醒仅在周一发送
    if (setting.key === 'measurement' && !isTodayMonday()) continue

    switch (setting.key) {
      case 'morningPlan':
        sendNotification('🌅 早安！', '新的一天，查看今天的训练计划吧～')
        break
      case 'breakfast':
        sendNotification('🥣 早餐时间到', '记得营养均衡，蛋白质+碳水+蔬菜！')
        break
      case 'lunch':
        sendNotification('🍱 午餐时间～', '七八分饱，荤素搭配，别吃撑哦！')
        break
      case 'dinner':
        sendNotification('🥗 晚餐时间到', '清淡为主，少主食，多蛋白+蔬菜！')
        break
      case 'exercise':
        sendNotification('🏃 运动时间', '别忘了今天的运动计划，坚持就是胜利！')
        break
      case 'measurement':
        sendNotification('📏 测量日', '今天该测大腿围啦～坚持就是胜利！')
        break
      case 'review':
        sendNotification('🌙 晚间复盘', '回顾今天的打卡，为明天加油！')
        break
    }
  }
}

function sendNotification(title: string, body: string) {
  new Notification(title, {
    body,
    icon: '/icons/icon-512.svg',
    badge: '/icons/icon-512.svg',
    tag: 'daily-reminder',
    requireInteraction: false,
  })
}

// 启动定时检查（每分钟检查一次）
let intervalId: number | null = null

export function startNotificationTimer() {
  if (intervalId) return
  // 立即检查一次
  checkAndNotify()
  // 每分钟检查一次
  intervalId = window.setInterval(checkAndNotify, 60000)
}

export function stopNotificationTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}