import Dexie, { type Table } from 'dexie'

export interface WeeklyTask {
  id?: number
  weekStart: string
  dayOfWeek: number
  subTaskId: string // 子任务标识，如 'tue_squat'
  completed: boolean
  completedAt: string | null
}

export interface StepCount {
  id?: number
  date: string
  steps: number
}

export interface Meal {
  id?: number
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner'
  foods: string
  note: string
}

export interface Measurement {
  id?: number
  date: string
  leftThigh: number
  rightThigh: number
  weight?: number
  bodyFat?: number
  createdAt?: string
}

export interface WaterIntake {
  id?: number
  date: string
  cups: number // 当日喝水杯数
}

export interface DailyReminder {
  id?: number
  date: string
  sleep: boolean
  mindset: boolean
}

export interface NotificationSettings {
  id?: number
  key: string
  enabled: boolean
  time: string
}

export interface AppSettings {
  id?: number
  key: string
  value: string
}

export interface Exercise {
  id?: number
  name: string
  defaultCount: number
  unit: string
  perSet?: string // 每组详情，如 "15次"，仅单位=组时使用
}

export interface DayPlan {
  id?: number
  dayOfWeek: number
  exerciseId: number
  count: number
}

class AppDatabase extends Dexie {
  weeklyTasks!: Table<WeeklyTask, number>
  stepCounts!: Table<StepCount, number>
  meals!: Table<Meal, number>
  measurements!: Table<Measurement, number>
  waterIntake!: Table<WaterIntake, number>
  dailyReminders!: Table<DailyReminder, number>
  notificationSettings!: Table<NotificationSettings, number>
  appSettings!: Table<AppSettings, number>
  exercises!: Table<Exercise, number>
  dayPlans!: Table<DayPlan, number>

  constructor() {
    super('SevenWeeksDB')
    this.version(3).stores({
      weeklyTasks: '++id, [weekStart+subTaskId], weekStart',
      stepCounts: '++id, date',
      meals: '++id, [date+mealType], date',
      measurements: '++id, date',
      waterIntake: '++id, date',
      dailyReminders: '++id, date',
      notificationSettings: '++id, key',
      appSettings: '++id, key',
      exercises: '++id',
      dayPlans: '++id, dayOfWeek',
    })
  }
}

export const db = new AppDatabase()

// 初始化通知设置
export async function initNotificationSettings() {
  const defaults = [
    { key: 'morningPlan', time: '07:30', enabled: true },
    { key: 'breakfast', time: '08:00', enabled: true },
    { key: 'lunch', time: '12:00', enabled: true },
    { key: 'dinner', time: '18:00', enabled: true },
    { key: 'exercise', time: '20:00', enabled: true },
    { key: 'measurement', time: '08:00', enabled: true },
    { key: 'review', time: '21:00', enabled: true },
  ]
  for (const d of defaults) {
    const existing = await db.notificationSettings.where('key').equals(d.key).first()
    if (!existing) {
      await db.notificationSettings.add(d)
    }
  }
}

// 初始化预置训练项目
export async function initDefaultExercises() {
  const count = await db.exercises.count()
  if (count > 0) return

  const defaults = [
    { name: '快走', defaultCount: 20, unit: '分钟' },
    { name: '深蹲', defaultCount: 4, unit: '组', perSet: '15次' },
    { name: '俯卧撑', defaultCount: 4, unit: '组', perSet: '10次' },
    { name: '臀桥', defaultCount: 3, unit: '组', perSet: '20次' },
    { name: '平板支撑', defaultCount: 3, unit: '组', perSet: '40秒' },
    { name: '卷腹', defaultCount: 3, unit: '组', perSet: '15次' },
    { name: '快走或慢跑', defaultCount: 45, unit: '分钟' },
    { name: '拉伸', defaultCount: 10, unit: '分钟' },
    { name: '弓步蹲', defaultCount: 3, unit: '组', perSet: '左右各12次' },
    { name: '登山跑', defaultCount: 4, unit: '组', perSet: '40秒' },
    { name: '超人式', defaultCount: 3, unit: '组', perSet: '15次' },
    { name: '平板转腰', defaultCount: 3, unit: '组', perSet: '20次' },
    { name: '仰卧抬腿', defaultCount: 3, unit: '组', perSet: '12次' },
    { name: '爬楼', defaultCount: 5, unit: '组', perSet: '10-15层' },
    { name: '轻松走路或拉伸', defaultCount: 30, unit: '分钟' },
  ]
  await db.exercises.bulkAdd(defaults)
}

// 初始化预置天计划
export async function initDefaultDayPlans() {
  const count = await db.dayPlans.count()
  if (count > 0) return

  const exercises = await db.exercises.toArray()
  const find = (name: string) => exercises.find(e => e.name === name)!.id!

  const plans = [
    { dayOfWeek: 1, exerciseId: find('快走'), count: 60 },
    { dayOfWeek: 2, exerciseId: find('深蹲'), count: 4 },
    { dayOfWeek: 2, exerciseId: find('俯卧撑'), count: 4 },
    { dayOfWeek: 2, exerciseId: find('臀桥'), count: 3 },
    { dayOfWeek: 2, exerciseId: find('平板支撑'), count: 3 },
    { dayOfWeek: 2, exerciseId: find('卷腹'), count: 3 },
    { dayOfWeek: 2, exerciseId: find('快走'), count: 20 },
    { dayOfWeek: 3, exerciseId: find('快走或慢跑'), count: 45 },
    { dayOfWeek: 4, exerciseId: find('快走'), count: 45 },
    { dayOfWeek: 4, exerciseId: find('拉伸'), count: 10 },
    { dayOfWeek: 5, exerciseId: find('弓步蹲'), count: 3 },
    { dayOfWeek: 5, exerciseId: find('登山跑'), count: 4 },
    { dayOfWeek: 5, exerciseId: find('超人式'), count: 3 },
    { dayOfWeek: 5, exerciseId: find('平板转腰'), count: 3 },
    { dayOfWeek: 5, exerciseId: find('仰卧抬腿'), count: 3 },
    { dayOfWeek: 6, exerciseId: find('爬楼'), count: 5 },
    { dayOfWeek: 6, exerciseId: find('快走'), count: 15 },
    { dayOfWeek: 0, exerciseId: find('轻松走路或拉伸'), count: 30 },
  ]
  await db.dayPlans.bulkAdd(plans)
}

// 获取步数目标，默认 10000
export async function getStepGoal(): Promise<number> {
  const setting = await db.appSettings.where('key').equals('stepGoal').first()
  return setting ? parseInt(setting.value) : 10000
}

// 设置步数目标
export async function setStepGoal(goal: number) {
  const existing = await db.appSettings.where('key').equals('stepGoal').first()
  if (existing) {
    await db.appSettings.update(existing.id!, { value: String(goal) })
  } else {
    await db.appSettings.add({ key: 'stepGoal', value: String(goal) })
  }
}

// 获取喝水目标，默认 8
export async function getWaterGoal(): Promise<number> {
  const setting = await db.appSettings.where('key').equals('waterGoal').first()
  return setting ? parseInt(setting.value) : 8
}

// 设置喝水目标
export async function setWaterGoal(goal: number) {
  const existing = await db.appSettings.where('key').equals('waterGoal').first()
  if (existing) {
    await db.appSettings.update(existing.id!, { value: String(goal) })
  } else {
    await db.appSettings.add({ key: 'waterGoal', value: String(goal) })
  }
}