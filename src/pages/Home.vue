<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db, getStepGoal, getWaterGoal, initDefaultExercises, initDefaultDayPlans, type DayPlan, type Exercise } from '@/db'
import { getTodayDate, getWeekStart, getDayOfWeek, getDayOfWeekCN } from '@/data/planData'
import { useRouter } from 'vue-router'

const router = useRouter()
const todayDate = getTodayDate()
const todayDay = getDayOfWeek()
const todayDayCN = getDayOfWeekCN()

const stepGoal = ref(10000)
const steps = ref(0)
const stepInput = ref(0)
const showStepInput = ref(false)
const showWaterInput = ref(false)

const waterCups = ref(0)
const waterGoal = ref(8)

const totalWeekTasks = ref(0)
const weekCompletedCount = ref(0)
const todayPlanName = ref('')
const todaySubTaskCount = ref(0)
const todayPlanDuration = ref('')

const stepTarget = computed(() => {
  if (steps.value >= stepGoal.value) return '达标'
  if (steps.value >= stepGoal.value * 0.8) return '接近'
  return '加油'
})

const weekProgress = computed(() => {
  if (totalWeekTasks.value === 0) return 0
  return Math.round((weekCompletedCount.value / totalWeekTasks.value) * 100)
})

async function loadData() {
  stepGoal.value = await getStepGoal()
  waterGoal.value = await getWaterGoal()

  await initDefaultExercises()
  await initDefaultDayPlans()

  const dayPlans = await db.dayPlans.toArray()
  const exercises = await db.exercises.toArray()
  totalWeekTasks.value = dayPlans.length

  const todayPlans = dayPlans.filter(dp => dp.dayOfWeek === todayDay)
  todaySubTaskCount.value = todayPlans.length
  if (todayPlans.length > 0) {
    const exIds = [...new Set(todayPlans.map(dp => dp.exerciseId))]
    const todayExs = exIds.map(id => exercises.find(e => e.id === id)).filter(Boolean) as Exercise[]
    todayPlanName.value = todayExs.map(e => e.name).join('、')
    todayPlanDuration.value = todayPlans.map(dp => {
      const ex = exercises.find(e => e.id === dp.exerciseId)
      return ex?.unit === '组' && ex?.perSet
        ? `${dp.count}${ex.unit} (${ex.perSet})`
        : `${dp.count}${ex?.unit || ''}`
    }).join(' + ')
  }

  const todayStep = await db.stepCounts.where('date').equals(todayDate).first()
  if (todayStep) steps.value = todayStep.steps

  const water = await db.waterIntake.where('date').equals(todayDate).first()
  waterCups.value = water?.cups || 0

  const weekStart = getWeekStart()
  const tasks = await db.weeklyTasks.where('weekStart').equals(weekStart).toArray()
  weekCompletedCount.value = tasks.filter(t => t.completed).length
}

async function saveSteps() {
  if (stepInput.value <= 0) return
  const existing = await db.stepCounts.where('date').equals(todayDate).first()
  if (existing) {
    await db.stepCounts.update(existing.id!, { steps: stepInput.value })
  } else {
    await db.stepCounts.add({ date: todayDate, steps: stepInput.value })
  }
  steps.value = stepInput.value
  showStepInput.value = false
}

async function addWater() {
  waterCups.value++
  const existing = await db.waterIntake.where('date').equals(todayDate).first()
  if (existing) {
    await db.waterIntake.update(existing.id!, { cups: waterCups.value })
  } else {
    await db.waterIntake.add({ date: todayDate, cups: waterCups.value })
  }
}

async function minusWater() {
  if (waterCups.value <= 0) return
  waterCups.value--
  const existing = await db.waterIntake.where('date').equals(todayDate).first()
  if (existing) {
    await db.waterIntake.update(existing.id!, { cups: waterCups.value })
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <div style="text-align: center; padding-top: 8px; margin-bottom: 16px;">
      <h1 style="font-size: 22px; font-weight: 700; color: var(--primary-dark);">自律打卡·蜕变自己</h1>
    </div>

    <!-- 今日日期 -->
    <div class="card" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 14px; opacity: 0.9;">{{ todayDate }}</div>
          <div style="font-size: 28px; font-weight: 700; margin-top: 4px;">{{ todayDayCN }}</div>
        </div>
        <div style="font-size: 48px; opacity: 0.9;">🏃</div>
      </div>
      <div style="margin-top: 12px; font-size: 15px; font-weight: 500;">
        {{ todayPlanName || '暂无计划' }}
      </div>
      <div style="margin-top: 8px; font-size: 13px; opacity: 0.85;">
        {{ todaySubTaskCount }} 项任务<span v-if="todayPlanDuration"> · {{ todayPlanDuration }}</span>
      </div>
    </div>

    <!-- 本周进度 -->
    <div class="card" style="background: var(--primary-100); border: 1px solid var(--primary-200);">
      <div class="card-title">
        <span>📊</span> 本周打卡进度
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 28px; font-weight: 700; color: var(--primary);">{{ weekProgress }}%</span>
        <span class="text-sm text-muted">{{ weekCompletedCount }}/{{ totalWeekTasks }} 项完成</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: weekProgress + '%' }"></div>
      </div>
    </div>

    <!-- 今日步数 -->
    <div class="card" style="background: var(--primary-100); border: 1px solid var(--primary-200);">
      <div class="card-title">
        <span>👟</span> 今日步数 · 目标 {{ stepGoal.toLocaleString() }}
      </div>
      <div v-if="steps > 0 && !showStepInput" style="text-align: center; padding: 12px 0;">
        <div style="font-size: 36px; font-weight: 700; color: var(--primary);">{{ steps.toLocaleString() }}</div>
        <div style="margin-top: 4px;">
          <span :class="stepTarget === '达标' ? 'tag tag-green' : stepTarget === '接近' ? 'tag tag-yellow' : 'tag tag-red'">
            {{ stepTarget === '达标' ? '✔ 达标' : stepTarget === '接近' ? '接近达标' : '继续加油' }}
          </span>
        </div>
        <div class="mt-8">
          <NButton size="small" text type="primary" @click="showStepInput = true">更新步数</NButton>
        </div>
      </div>
      <div v-else-if="steps === 0 && !showStepInput" style="text-align: center; padding: 12px 0;">
        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">今天还没记录步数哦</div>
        <NButton size="small" type="primary" @click="showStepInput = true">记录步数</NButton>
      </div>
      <div v-if="showStepInput" style="display: flex; gap: 8px; align-items: center;">
        <NInputNumber v-model:value="stepInput" :min="0" :max="999999" placeholder="输入今日步数" style="flex: 1;" />
        <NButton size="small" type="primary" @click="saveSteps">保存</NButton>
        <NButton size="small" @click="showStepInput = false">取消</NButton>
      </div>
    </div>

    <!-- 健康提醒 -->
    <div class="card" style="background: var(--primary-100); border: 1px solid var(--primary-200);">
      <div class="card-title">
        <span>💡</span> 健康提醒
      </div>

      <!-- 多喝水 -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer;" @click="showWaterInput = !showWaterInput">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 22px;">💧</span>
          <div>
            <div style="font-size: 14px; font-weight: 500;">多喝水</div>
            <div style="font-size: 12px; color: var(--text-muted);">加速代谢，帮助燃脂</div>
          </div>
        </div>
        <span :class="waterCups >= waterGoal ? 'tag tag-green' : 'tag tag-yellow'">{{ waterCups }}/{{ waterGoal }}</span>
      </div>
      <div v-if="showWaterInput" style="display: flex; align-items: center; gap: 8px; padding: 6px 0 10px 30px; border-bottom: 1px solid var(--border);">
        <NButton size="tiny" circle @click="minusWater" :disabled="waterCups <= 0">−</NButton>
        <span style="font-size: 16px; font-weight: 700; min-width: 24px; text-align: center;">{{ waterCups }}</span>
        <NButton size="tiny" circle type="primary" @click="addWater">+</NButton>
        <span style="font-size: 12px; color: var(--text-muted); margin-left: 4px;">杯</span>
      </div>

      <!-- 走步数 -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer;" @click="showWaterInput = false; showStepInput = !showStepInput">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 22px;">👟</span>
          <div>
            <div style="font-size: 14px; font-weight: 500;">走步数</div>
            <div style="font-size: 12px; color: var(--text-muted);">今日步数</div>
          </div>
        </div>
        <span :class="steps >= stepGoal ? 'tag tag-green' : steps > 0 ? 'tag tag-yellow' : 'tag'">{{ steps > 0 ? steps.toLocaleString() : '--' }}</span>
      </div>
      <div v-if="showStepInput" style="display: flex; gap: 8px; padding: 6px 0 10px 30px;">
        <NInputNumber v-model:value="stepInput" :min="0" :max="999999" size="small" placeholder="输入步数" style="flex: 1;" />
        <NButton size="tiny" type="primary" @click="saveSteps">保存</NButton>
      </div>

      <!-- 坚持运动 -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer;" @click="router.push('/plan')">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 22px;">🏃</span>
          <div>
            <div style="font-size: 14px; font-weight: 500;">坚持运动</div>
            <div style="font-size: 12px; color: var(--text-muted);">{{ todayPlanName || '查看计划' }}</div>
          </div>
        </div>
        <span class="tag tag-green">去打卡</span>
      </div>

      <!-- 三餐规律 -->
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <span style="font-size: 22px;">🥗</span>
        <div>
          <div style="font-size: 14px; font-weight: 500;">三餐规律</div>
          <div style="font-size: 12px; color: var(--text-muted);">少盐少油，不暴食</div>
        </div>
      </div>

      <!-- 早睡早起 -->
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <span style="font-size: 22px;">😴</span>
        <div>
          <div style="font-size: 14px; font-weight: 500;">早睡早起</div>
          <div style="font-size: 12px; color: var(--text-muted);">保证充足睡眠</div>
        </div>
      </div>

      <!-- 积极心态 -->
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <span style="font-size: 22px;">💪</span>
        <div>
          <div style="font-size: 14px; font-weight: 500;">积极心态</div>
          <div style="font-size: 12px; color: var(--text-muted);">相信自己，坚持就是胜利</div>
        </div>
      </div>

      <!-- 控盐控糖 -->
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <span style="font-size: 22px;">🧂</span>
        <div>
          <div style="font-size: 14px; font-weight: 500;">控盐控糖</div>
          <div style="font-size: 12px; color: var(--text-muted);">消除水肿</div>
        </div>
      </div>

      <!-- 拉伸放松 -->
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <span style="font-size: 22px;">🧘</span>
        <div>
          <div style="font-size: 14px; font-weight: 500;">拉伸放松</div>
          <div style="font-size: 12px; color: var(--text-muted);">改善腿部线条</div>
        </div>
      </div>

      <!-- 充足睡眠 -->
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 0;">
        <span style="font-size: 22px;">🌙</span>
        <div>
          <div style="font-size: 14px; font-weight: 500;">充足睡眠</div>
          <div style="font-size: 12px; color: var(--text-muted);">避免熬夜</div>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item active">
        <span class="nav-icon">🏠</span><span>概览</span>
      </div>
      <div class="nav-item" @click="router.push('/plan')">
        <span class="nav-icon">📋</span><span>计划</span>
      </div>
      <div class="nav-item" @click="router.push('/diet')">
        <span class="nav-icon">🥗</span><span>饮食</span>
      </div>
      <div class="nav-item" @click="router.push('/data')">
        <span class="nav-icon">📊</span><span>数据</span>
      </div>
      <div class="nav-item" @click="router.push('/settings')">
        <span class="nav-icon">⚙️</span><span>设置</span>
      </div>
    </div>
  </div>
</template>