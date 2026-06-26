export interface SubTask {
  id: string // 唯一标识，如 'mon_walk', 'tue_squat'
  name: string // 如 '快走 60分钟'
  detail: string // 如 '60分钟'
}

export interface PlanDay {
  dayOfWeek: number // 0=周日, 1=周一, ..., 6=周六
  dayName: string
  dayNameCN: string
  plan: string
  training: string
  duration: string
  goal: string
  icon: string
  subTasks: SubTask[]
}

export const weekPlan: PlanDay[] = [
  {
    dayOfWeek: 1,
    dayName: 'MON',
    dayNameCN: '周一',
    plan: '快走日（中等速度）',
    training: '快走',
    duration: '60分钟',
    goal: '燃脂消耗促进腿部循环',
    icon: '🏃',
    subTasks: [
      { id: 'mon_walk', name: '快走', detail: '60分钟' },
    ],
  },
  {
    dayOfWeek: 2,
    dayName: 'TUE',
    dayNameCN: '周二',
    plan: '力量训练A（全身+核心）',
    training: '深蹲 15次×4组\n俯卧撑 8-12次×4组\n臀桥 20次×3组\n平板支撑 40秒×3组\n卷腹 15次×3组\n+ 快走 20分钟',
    duration: '20-30分钟+20分钟',
    goal: '提升代谢紧致身体',
    icon: '💪',
    subTasks: [
      { id: 'tue_squat', name: '深蹲', detail: '15次×4组' },
      { id: 'tue_pushup', name: '俯卧撑', detail: '8-12次×4组' },
      { id: 'tue_bridge', name: '臀桥', detail: '20次×3组' },
      { id: 'tue_plank', name: '平板支撑', detail: '40秒×3组' },
      { id: 'tue_crunch', name: '卷腹', detail: '15次×3组' },
      { id: 'tue_walk', name: '快走', detail: '20分钟' },
    ],
  },
  {
    dayOfWeek: 3,
    dayName: 'WED',
    dayNameCN: '周三',
    plan: '快走/慢跑日（微喘能说话）',
    training: '快走或慢跑',
    duration: '45-60分钟',
    goal: '燃脂减脂心肺提升',
    icon: '🏃',
    subTasks: [
      { id: 'wed_run', name: '快走或慢跑', detail: '45-60分钟' },
    ],
  },
  {
    dayOfWeek: 4,
    dayName: 'THU',
    dayNameCN: '周四',
    plan: '拉伸 + 快走（放松肌肉）',
    training: '快走 40-50分钟\n拉伸 10分钟',
    duration: '40-50分钟+10分钟',
    goal: '缓解疲劳促进恢复',
    icon: '🧘',
    subTasks: [
      { id: 'thu_walk', name: '快走', detail: '40-50分钟' },
      { id: 'thu_stretch', name: '拉伸', detail: '10分钟' },
    ],
  },
  {
    dayOfWeek: 5,
    dayName: 'FRI',
    dayNameCN: '周五',
    plan: '力量训练B（全身+核心）',
    training: '弓步蹲 左右各12次×3组\n登山跑 40秒×4组\n超人式 15次×3组\n平板转腰 20次×3组\n仰卧抬腿 12次×3组',
    duration: '20-30分钟+20分钟',
    goal: '塑形紧致避免肌肉流失',
    icon: '💪',
    subTasks: [
      { id: 'fri_lunge', name: '弓步蹲', detail: '左右各12次×3组' },
      { id: 'fri_climber', name: '登山跑', detail: '40秒×4组' },
      { id: 'fri_superman', name: '超人式', detail: '15次×3组' },
      { id: 'fri_twist', name: '平板转腰', detail: '20次×3组' },
      { id: 'fri_legraise', name: '仰卧抬腿', detail: '12次×3组' },
    ],
  },
  {
    dayOfWeek: 6,
    dayName: 'SAT',
    dayNameCN: '周六',
    plan: '爬楼 + 快走（中等强度）',
    training: '爬楼 10-15层×5-8组\n（下楼坐电梯）\n快走 15-20分钟',
    duration: '15-20分钟+20分钟',
    goal: '提高燃脂效率塑造腿部线条',
    icon: '🏃',
    subTasks: [
      { id: 'sat_stairs', name: '爬楼', detail: '10-15层×5-8组' },
      { id: 'sat_walk', name: '快走', detail: '15-20分钟' },
    ],
  },
  {
    dayOfWeek: 0,
    dayName: 'SUN',
    dayNameCN: '周日',
    plan: '休息/轻松走路（散步放松）',
    training: '轻松走路或拉伸放松',
    duration: '30-60分钟',
    goal: '主动恢复保持活动量',
    icon: '🚶',
    subTasks: [
      { id: 'sun_relax', name: '轻松走路或拉伸', detail: '30-60分钟' },
    ],
  },
]

// 获取一周总任务数
export function getTotalWeekTasks(): number {
  return weekPlan.reduce((sum, day) => sum + day.subTasks.length, 0)
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return formatDate(d)
}

export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getTodayDate(): string {
  return formatDate(new Date())
}

export function getDayOfWeekCN(date: Date = new Date()): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
}

export function getDayOfWeek(date: Date = new Date()): number {
  return date.getDay()
}

export function isTodayMonday(): boolean {
  return new Date().getDay() === 1
}