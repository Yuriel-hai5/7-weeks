<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { db, type Exercise, type DayPlan, initDefaultExercises, initDefaultDayPlans } from '@/db'
import { getWeekStart, getDayOfWeek, formatDate } from '@/data/planData'
import { useRouter } from 'vue-router'

const router = useRouter()
const weekStart = getWeekStart()
const todayDay = getDayOfWeek()
const activeTab = ref(todayDay)
const completedTasks = ref<Set<string>>(new Set())
const exercises = ref<Exercise[]>([])
const dayPlans = ref<DayPlan[]>([])

const totalWeekTasks = computed(() => dayPlans.value.length)

function getExerciseById(id: number): Exercise | undefined {
  return exercises.value.find(e => e.id === id)
}

const weekDays = computed(() => {
  const ws = new Date(weekStart)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws)
    d.setDate(ws.getDate() + i)
    const dayOfWeek = d.getDay()
    const dayPlansForDay = dayPlans.value.filter(dp => dp.dayOfWeek === dayOfWeek)
    days.push({
      dayOfWeek,
      dayName: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayOfWeek],
      dayNameCN: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayOfWeek],
      dateStr: formatDate(d),
      dateNum: d.getDate(),
      subTasks: dayPlansForDay.map(dp => {
        const ex = getExerciseById(dp.exerciseId)
        const detail = ex?.unit === '组' && ex?.perSet
          ? `${dp.count}${ex.unit} (${ex.perSet})`
          : `${dp.count}${ex?.unit || ''}`
        return {
          id: String(dp.id),
          name: ex?.name || '未知',
          detail,
        }
      }),
    })
  }
  return days
})

const todayDaySubTasks = computed(() => {
  const day = weekDays.value.find(d => d.dayOfWeek === activeTab.value)
  return day?.subTasks || []
})

const dayCompletedCount = computed(() => {
  return todayDaySubTasks.value.filter(st => isChecked(st.id)).length
})

async function loadData() {
  await initDefaultExercises()
  await initDefaultDayPlans()
  exercises.value = await db.exercises.toArray()
  dayPlans.value = await db.dayPlans.toArray()
  await loadTasks()
}

async function loadTasks() {
  const tasks = await db.weeklyTasks.where('weekStart').equals(weekStart).toArray()
  completedTasks.value = new Set(tasks.filter(t => t.completed).map(t => t.subTaskId))
}

async function toggleSubTask(subTaskId: string, dayOfWeek: number) {
  const existing = await db.weeklyTasks
    .where({ weekStart, subTaskId })
    .first()

  if (existing) {
    await db.weeklyTasks.update(existing.id!, {
      completed: !existing.completed,
      completedAt: !existing.completed ? new Date().toISOString() : null,
    })
  } else {
    await db.weeklyTasks.add({
      weekStart,
      dayOfWeek,
      subTaskId,
      completed: true,
      completedAt: new Date().toISOString(),
    })
  }
  await loadTasks()
}

function isChecked(subTaskId: string): boolean {
  return completedTasks.value.has(subTaskId)
}

function isToday(dayOfWeek: number): boolean {
  return dayOfWeek === todayDay
}

async function toggleAllSubTasks() {
  const allChecked = dayCompletedCount.value === todayDaySubTasks.value.length
  if (allChecked) {
    for (const st of todayDaySubTasks.value) {
      const existing = await db.weeklyTasks.where({ weekStart, subTaskId: st.id }).first()
      if (existing) {
        await db.weeklyTasks.update(existing.id!, { completed: false, completedAt: null })
      }
    }
  } else {
    for (const st of todayDaySubTasks.value) {
      if (isChecked(st.id)) continue
      const existing = await db.weeklyTasks.where({ weekStart, subTaskId: st.id }).first()
      if (existing) {
        await db.weeklyTasks.update(existing.id!, { completed: true, completedAt: new Date().toISOString() })
      } else {
        await db.weeklyTasks.add({
          weekStart, dayOfWeek: activeTab.value, subTaskId: st.id, completed: true, completedAt: new Date().toISOString(),
        })
      }
    }
  }
  await loadTasks()
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <div style="text-align: center; padding-top: 8px; margin-bottom: 16px;">
      <h1 style="font-size: 22px; font-weight: 700; color: var(--primary-dark);">7天减脂计划</h1>
      <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">{{ weekStart }} 起 · 共 {{ totalWeekTasks }} 项任务</p>
    </div>

    <!-- 周日期导航 -->
    <div style="display: flex; gap: 4px; margin-bottom: 16px;">
      <div
        v-for="day in weekDays"
        :key="day.dayOfWeek"
        @click="activeTab = day.dayOfWeek"
        :style="{
          flex: '1',
          padding: '8px 4px',
          borderRadius: '10px',
          textAlign: 'center',
          cursor: 'pointer',
          background: activeTab === day.dayOfWeek ? 'var(--primary)' : 'var(--primary-50)',
          color: activeTab === day.dayOfWeek ? 'white' : 'var(--text)',
          border: activeTab === day.dayOfWeek ? 'none' : '1px solid var(--border)',
          transition: 'all 0.2s',
          position: 'relative',
        }"
      >
        <div style="font-size: 11px; font-weight: 500;">{{ day.dayName }}</div>
        <div style="font-size: 13px; font-weight: 700; margin: 2px 0;">{{ day.dateNum }}</div>
        <div style="font-size: 10px; opacity: 0.8;">
          {{ day.subTasks.filter(st => isChecked(st.id)).length }}/{{ day.subTasks.length }}
        </div>
        <div
          v-if="isToday(day.dayOfWeek)"
          style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background: var(--primary);"
          :style="{ background: activeTab === day.dayOfWeek ? 'white' : 'var(--primary)' }"
        ></div>
      </div>
    </div>

    <!-- 当天计划详情 -->
    <div
      v-for="day in weekDays.filter(d => d.dayOfWeek === activeTab)"
      :key="day.dayOfWeek"
      class="card"
      :style="{
        border: isToday(activeTab) ? '2px solid var(--primary)' : '1px solid var(--border)',
        background: isToday(activeTab) ? 'var(--primary-100)' : 'var(--primary-50)',
      }"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div>
            <div style="font-size: 18px; font-weight: 700;">{{ day.dayNameCN }} {{ day.dayName }}</div>
          </div>
        </div>
        <span v-if="todayDaySubTasks.length > 0" class="tag tag-green" style="cursor: pointer;" @click="toggleAllSubTasks">
          {{ dayCompletedCount }}/{{ todayDaySubTasks.length }}
        </span>
      </div>

      <!-- 子任务列表 -->
      <div v-if="todayDaySubTasks.length > 0" style="margin-bottom: 12px;">
        <div style="font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 8px;">训练内容</div>
        <div
          v-for="st in todayDaySubTasks"
          :key="st.id"
          @click="toggleSubTask(st.id, activeTab)"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            marginBottom: '6px',
            cursor: 'pointer',
            background: isChecked(st.id) ? 'var(--primary-200)' : 'var(--primary-50)',
            border: isChecked(st.id) ? '1px solid var(--primary-300)' : '1px solid var(--primary-100)',
            transition: 'all 0.2s',
          }"
        >
          <div
            :style="{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              flexShrink: '0',
              background: isChecked(st.id) ? 'var(--primary)' : 'white',
              color: isChecked(st.id) ? 'white' : 'var(--text-muted)',
              border: isChecked(st.id) ? 'none' : '2px solid var(--border)',
            }"
          >
            {{ isChecked(st.id) ? '✓' : '' }}
          </div>
          <div style="flex: 1;">
            <div :style="{ fontSize: '14px', fontWeight: '500', textDecoration: isChecked(st.id) ? 'line-through' : 'none', color: isChecked(st.id) ? 'var(--text-muted)' : 'var(--text)' }">
              {{ st.name }}
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">{{ st.detail }}</div>
          </div>
        </div>
      </div>
      <div v-else style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
        该天暂无训练计划，去设置页添加
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" @click="router.push('/')">
        <span class="nav-icon">🏠</span><span>概览</span>
      </div>
      <div class="nav-item active">
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