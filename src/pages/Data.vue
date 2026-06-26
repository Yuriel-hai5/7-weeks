<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { db, type Measurement } from '@/db'
import { getTodayDate, getWeekStart } from '@/data/planData'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
} from 'echarts/components'

use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const router = useRouter()
const todayDate = getTodayDate()
const showMeasureInput = ref(false)
const leftThigh = ref(0)
const rightThigh = ref(0)

// 体重数据
const weightRecords = ref<Measurement[]>([])
const showWeightInput = ref(false)
const weightValue = ref(0)
const editingWeightId = ref<number | null>(null)

// 体脂数据
const bodyFatRecords = ref<Measurement[]>([])
const showBodyFatInput = ref(false)
const bodyFatValue = ref(0)
const editingBodyFatId = ref<number | null>(null)

// 步数数据
const stepChartData = ref<{ dates: string[]; values: number[] }>({ dates: [], values: [] })

// 大腿围数据
const measurements = ref<Measurement[]>([])

// 本周打卡率
const weekCheckRate = ref(0)

// 饮食统计
const foodStats = ref<{ name: string; count: number }[]>([])

// 喝水统计
const totalWaterCups = ref(0)

const stepChartOption = computed(() => ({
  grid: { left: 40, right: 16, top: 20, bottom: 30 },
  xAxis: {
    type: 'category' as const,
    data: stepChartData.value.dates,
    axisLabel: { fontSize: 11, color: '#94a3b8' },
  },
  yAxis: {
    type: 'value' as const,
    min: 0,
    axisLabel: { fontSize: 11, color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
  },
  series: [{
    data: stepChartData.value.values,
    type: 'line',
    smooth: true,
    lineStyle: { color: '#10b981', width: 2 },
    itemStyle: { color: '#10b981' },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
          { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
        ],
      },
    },
    markLine: {
      silent: true,
      data: [{ yAxis: 10000, label: { formatter: '目标10000' }, lineStyle: { color: '#f59e0b', type: 'dashed' } }],
    },
  }],
}))

const thighChartOption = computed(() => ({
  grid: { left: 40, right: 16, top: 20, bottom: 30 },
  xAxis: {
    type: 'category' as const,
    data: measurements.value.map(m => m.date.slice(5)),
    axisLabel: { fontSize: 11, color: '#94a3b8' },
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: { fontSize: 11, color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
    min: (v: any) => Math.floor(Math.min(v.min, 50) - 2),
    max: (v: any) => Math.ceil(Math.max(v.max, 60) + 2),
  },
  series: [
    {
      name: '左腿',
      data: measurements.value.map(m => m.leftThigh),
      type: 'line',
      smooth: true,
      symbolSize: 12,
      lineStyle: { color: '#10b981', width: 2 },
      itemStyle: { color: '#10b981' },
    },
    {
      name: '右腿',
      data: measurements.value.map(m => m.rightThigh),
      type: 'line',
      smooth: true,
      symbolSize: 12,
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' },
    },
  ],
}))

const weightChartOption = computed(() => ({
  grid: { left: 40, right: 16, top: 20, bottom: 30 },
  xAxis: {
    type: 'category' as const,
    data: weightRecords.value.map(m => m.date.slice(5)),
    axisLabel: { fontSize: 11, color: '#94a3b8' },
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: { fontSize: 11, color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
    min: (v: any) => Math.floor((v.min || 50) - 2),
    max: (v: any) => Math.ceil((v.max || 70) + 2),
  },
  series: [{
    data: weightRecords.value.map(m => m.weight),
    type: 'line',
    smooth: true,
    symbolSize: 12,
    lineStyle: { color: '#10b981', width: 2 },
    itemStyle: { color: '#10b981' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
          { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
        ],
      },
    },
  }],
}))

const bodyFatChartOption = computed(() => ({
  grid: { left: 40, right: 16, top: 20, bottom: 30 },
  xAxis: {
    type: 'category' as const,
    data: bodyFatRecords.value.map(m => m.date.slice(5)),
    axisLabel: { fontSize: 11, color: '#94a3b8' },
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: { fontSize: 11, color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
    min: (v: any) => Math.floor((v.min || 20) - 2),
    max: (v: any) => Math.ceil((v.max || 35) + 2),
  },
  series: [{
    data: bodyFatRecords.value.map(m => m.bodyFat),
    type: 'line',
    smooth: true,
    symbolSize: 12,
    lineStyle: { color: '#f59e0b', width: 2 },
    itemStyle: { color: '#f59e0b' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
          { offset: 1, color: 'rgba(245, 158, 11, 0.02)' },
        ],
      },
    },
  }],
}))

const checkRateOption = computed(() => {
  const rate = weekCheckRate.value
  return {
    series: [{
      type: 'pie',
      radius: ['60%', '80%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'center' as const,
        formatter: `${rate}%\n本周打卡率`,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
      },
      labelLine: { show: false },
      data: [
        { value: rate, name: '已完成', itemStyle: { color: '#10b981' } },
        { value: 100 - rate, name: '未完成', itemStyle: { color: '#f1f5f9' } },
      ],
    }],
  }
})

async function loadData() {
  // 加载最近14天步数
  const stepRecords = await db.stepCounts.orderBy('date').reverse().limit(14).toArray()
  stepRecords.reverse()
  stepChartData.value = {
    dates: stepRecords.map(r => r.date.slice(5)),
    values: stepRecords.map(r => r.steps),
  }

  // 加载大腿围数据（过滤掉只有体重/体脂的记录）
  const allRecords = await db.measurements.orderBy('date').toArray()
  measurements.value = allRecords.filter(m => m.leftThigh > 0 && m.rightThigh > 0)

  // 加载体重和体脂数据
  weightRecords.value = allRecords.filter(m => m.weight != null)
  bodyFatRecords.value = allRecords.filter(m => m.bodyFat != null)

  // 本周打卡率
  const weekStart = getWeekStart()
  const tasks = await db.weeklyTasks.where('weekStart').equals(weekStart).toArray()
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  weekCheckRate.value = total > 0 ? Math.round((completed / total) * 100) : 0

  // 饮食统计
  const allMeals = await db.meals.toArray()
  const foodCount: Record<string, number> = {}
  for (const m of allMeals) {
    if (!m.foods) continue
    const items = m.foods.split('、').filter(Boolean)
    for (const item of items) {
      foodCount[item] = (foodCount[item] || 0) + 1
    }
  }
  foodStats.value = Object.entries(foodCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  // 喝水统计
  const waterRecords = await db.waterIntake.toArray()
  totalWaterCups.value = waterRecords.reduce((sum, r) => sum + r.cups, 0)
}

async function saveMeasurement() {
  if (leftThigh.value <= 0 || rightThigh.value <= 0) return
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  await db.measurements.add({
    date: todayDate,
    leftThigh: leftThigh.value,
    rightThigh: rightThigh.value,
    createdAt: `${todayDate} ${timeStr}`,
  })
  showMeasureInput.value = false
  leftThigh.value = 0
  rightThigh.value = 0
  await loadData()
}

async function saveWeight() {
  if (weightValue.value <= 0) return
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  await db.measurements.add({
    date: todayDate,
    leftThigh: 0,
    rightThigh: 0,
    weight: weightValue.value,
    createdAt: `${todayDate} ${timeStr}`,
  })
  showWeightInput.value = false
  weightValue.value = 0
  await loadData()
}

async function saveBodyFat() {
  if (bodyFatValue.value <= 0) return
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  await db.measurements.add({
    date: todayDate,
    leftThigh: 0,
    rightThigh: 0,
    bodyFat: bodyFatValue.value,
    createdAt: `${todayDate} ${timeStr}`,
  })
  showBodyFatInput.value = false
  bodyFatValue.value = 0
  await loadData()
}

const latestMeasurement = computed(() => {
  if (measurements.value.length === 0) return null
  return measurements.value[measurements.value.length - 1]
})

const latestWeight = computed(() => {
  const withWeight = weightRecords.value.filter(m => m.weight != null)
  return withWeight.length > 0 ? withWeight[withWeight.length - 1].weight : null
})

const latestBodyFat = computed(() => {
  const withFat = bodyFatRecords.value.filter(m => m.bodyFat != null)
  return withFat.length > 0 ? withFat[withFat.length - 1].bodyFat : null
})

// 编辑数据点
const editDialog = ref({
  show: false,
  recordId: 0,
  field: '',
  value: 0,
  label: '',
})

function onThighChartClick(params: any) {
  if (!params || params.dataIndex == null) return
  const idx = params.dataIndex
  const record = measurements.value[idx]
  if (!record || !record.id) return
  if (params.seriesName === '左腿') {
    editDialog.value = {
      show: true,
      recordId: record.id,
      field: 'leftThigh',
      value: record.leftThigh,
      label: `左腿围 - ${record.createdAt || record.date.slice(5)}`,
    }
  } else if (params.seriesName === '右腿') {
    editDialog.value = {
      show: true,
      recordId: record.id,
      field: 'rightThigh',
      value: record.rightThigh,
      label: `右腿围 - ${record.createdAt || record.date.slice(5)}`,
    }
  }
}

function onWeightChartClick(params: any) {
  if (!params || params.dataIndex == null) return
  const idx = params.dataIndex
  const record = weightRecords.value[idx]
  if (!record || !record.id) return
  editDialog.value = {
    show: true,
    recordId: record.id,
    field: 'weight',
    value: record.weight!,
    label: `体重 - ${record.createdAt || record.date.slice(5)}`,
  }
}

function onBodyFatChartClick(params: any) {
  if (!params || params.dataIndex == null) return
  const idx = params.dataIndex
  const record = bodyFatRecords.value[idx]
  if (!record || !record.id) return
  editDialog.value = {
    show: true,
    recordId: record.id,
    field: 'bodyFat',
    value: record.bodyFat!,
    label: `体脂率 - ${record.createdAt || record.date.slice(5)}`,
  }
}

async function saveEdit() {
  const { recordId, field, value } = editDialog.value
  if (value <= 0) return
  await db.measurements.update(recordId, { [field]: value })
  editDialog.value.show = false
  await loadData()
}

async function deleteRecord() {
  const { recordId } = editDialog.value
  await db.measurements.delete(recordId)
  editDialog.value.show = false
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <div style="text-align: center; padding-top: 8px; margin-bottom: 16px;">
      <h1 style="font-size: 22px; font-weight: 700; color: var(--primary-dark);">数据统计</h1>
      <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">每一项进步都值得记录</p>
    </div>

    <!-- 本周打卡率 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title">📊 本周打卡率</div>
      <VChart :option="checkRateOption" style="height: 180px;" autoresize />
    </div>

    <!-- 饮食统计 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title">
        <span>🍽️</span> 饮食统计
      </div>
      <div v-if="foodStats.length === 0" style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 13px;">
        暂无饮食记录，去饮食页记录吧～
      </div>
      <div v-else>
        <div
          v-for="(item, i) in foodStats"
          :key="item.name"
          style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--primary-100);"
        >
          <span style="font-size: 12px; font-weight: 700; color: var(--primary); min-width: 18px;">{{ i + 1 }}</span>
          <span style="flex: 1; font-size: 13px; font-weight: 500;">{{ item.name }}</span>
          <span style="font-size: 12px; color: var(--text-muted);">{{ item.count }}次</span>
        </div>
      </div>
    </div>

    <!-- 喝水统计 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title">
        <span>💧</span> 喝水统计
      </div>
      <div style="text-align: center; padding: 16px 0;">
        <div style="font-size: 36px; font-weight: 700; color: var(--primary);">
          {{ totalWaterCups }}
          <span style="font-size: 16px; font-weight: 400; color: var(--text-secondary);">杯</span>
        </div>
        <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
          累计喝水
        </div>
        <div style="margin-top: 12px; padding: 8px 12px; background: var(--primary-100); border-radius: 8px; font-size: 12px; color: var(--primary-dark);">
          💧 多喝水有助于加速代谢、排出毒素，坚持就是胜利！
        </div>
      </div>
    </div>

    <!-- 步数趋势 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title">
        <span>👟</span> 步数趋势（近14天）
      </div>
      <div v-if="stepChartData.values.length > 0">
        <VChart :option="stepChartOption" style="height: 220px;" autoresize />
      </div>
      <div v-else style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px;">
        暂无步数数据，去首页记录吧～
      </div>
    </div>

    <!-- 大腿围变化 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title" style="justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>📏</span> 大腿围变化
        </div>
        <NButton size="small" type="primary" @click="showMeasureInput = true">记录测量</NButton>
      </div>
      <div v-if="latestMeasurement" style="margin-bottom: 12px; display: flex; gap: 16px;">
        <div style="flex: 1; text-align: center; padding: 8px; background: var(--primary-100); border-radius: 8px;">
          <div style="font-size: 12px; color: var(--text-muted);">左腿</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--primary);">{{ latestMeasurement.leftThigh }}<span style="font-size: 13px;">cm</span></div>
        </div>
        <div style="flex: 1; text-align: center; padding: 8px; background: #eff6ff; border-radius: 8px;">
          <div style="font-size: 12px; color: var(--text-muted);">右腿</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--info);">{{ latestMeasurement.rightThigh }}<span style="font-size: 13px;">cm</span></div>
        </div>
      </div>
      <div v-if="measurements.length > 1">
        <VChart :option="thighChartOption" style="height: 220px;" autoresize @click="onThighChartClick" />
      </div>
      <div v-else-if="measurements.length === 1" style="text-align: center; padding: 20px; color: var(--text-muted);">
        再测一次就能看到趋势图啦～
      </div>
      <div v-else style="text-align: center; padding: 20px; color: var(--text-muted);">
        暂无测量数据，点击上方按钮记录吧～
      </div>
    </div>

    <!-- 体重变化 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title" style="justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>⚖️</span> 体重变化
        </div>
        <NButton size="small" type="primary" @click="showWeightInput = true">记录测量</NButton>
      </div>
      <div v-if="latestWeight != null" style="margin-bottom: 12px; text-align: center; padding: 8px; background: var(--primary-100); border-radius: 8px;">
        <div style="font-size: 12px; color: var(--text-muted);">最新体重</div>
        <div style="font-size: 20px; font-weight: 700; color: var(--primary);">{{ latestWeight }}<span style="font-size: 13px;">kg</span></div>
      </div>
      <div v-if="weightRecords.length > 1">
        <VChart :option="weightChartOption" style="height: 220px;" autoresize @click="onWeightChartClick" />
      </div>
      <div v-else-if="weightRecords.length === 1" style="text-align: center; padding: 20px; color: var(--text-muted);">
        再测一次就能看到趋势图啦～
      </div>
      <div v-else style="text-align: center; padding: 20px; color: var(--text-muted);">
        暂无体重数据，点击上方按钮记录吧～
      </div>
    </div>

    <!-- 体脂率变化 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title" style="justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🔥</span> 体脂率变化
        </div>
        <NButton size="small" type="primary" @click="showBodyFatInput = true">记录测量</NButton>
      </div>
      <div v-if="latestBodyFat != null" style="margin-bottom: 12px; text-align: center; padding: 8px; background: var(--primary-100); border-radius: 8px;">
        <div style="font-size: 12px; color: var(--text-muted);">最新体脂率</div>
        <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">{{ latestBodyFat }}<span style="font-size: 13px;">%</span></div>
      </div>
      <div v-if="bodyFatRecords.length > 1">
        <VChart :option="bodyFatChartOption" style="height: 220px;" autoresize @click="onBodyFatChartClick" />
      </div>
      <div v-else-if="bodyFatRecords.length === 1" style="text-align: center; padding: 20px; color: var(--text-muted);">
        再测一次就能看到趋势图啦～
      </div>
      <div v-else style="text-align: center; padding: 20px; color: var(--text-muted);">
        暂无体脂数据，点击上方按钮记录吧～
      </div>
    </div>

    <!-- 测量输入弹窗 -->
    <NModal v-model:show="showMeasureInput" :auto-focus="false" style="max-width: 360px;">
      <div style="background: var(--primary-50); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
        <div style="padding: 16px; font-size: 16px; font-weight: 700; color: var(--primary-dark);">
          📏 记录大腿围
        </div>
        <div style="padding: 0 16px 16px;">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
            测量日期：{{ todayDate }}
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">左腿围 (cm)</div>
            <NInputNumber v-model:value="leftThigh" :min="0" :max="100" placeholder="左腿围"
              style="width: 100%; --n-color: var(--primary-100); --n-border: 1px solid var(--primary-200); --n-border-radius: 8px;" />
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">右腿围 (cm)</div>
            <NInputNumber v-model:value="rightThigh" :min="0" :max="100" placeholder="右腿围"
              style="width: 100%; --n-color: var(--primary-100); --n-border: 1px solid var(--primary-200); --n-border-radius: 8px;" />
          </div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px; background: var(--primary-50);">
          <NButton secondary type="success" @click="showMeasureInput = false">取消</NButton>
          <NButton type="primary" @click="saveMeasurement">保存</NButton>
        </div>
      </div>
    </NModal>

    <!-- 体重输入弹窗 -->
    <NModal v-model:show="showWeightInput" :auto-focus="false" style="max-width: 360px;">
      <div style="background: var(--primary-50); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
        <div style="padding: 16px; font-size: 16px; font-weight: 700; color: var(--primary-dark);">
          ⚖️ 记录体重
        </div>
        <div style="padding: 0 16px 16px;">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
            记录日期：{{ todayDate }}
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">体重 (kg)</div>
            <NInputNumber v-model:value="weightValue" :min="0" :max="200" placeholder="输入体重"
              style="width: 100%; --n-color: var(--primary-100); --n-border: 1px solid var(--primary-200); --n-border-radius: 8px;" />
          </div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px; background: var(--primary-50);">
          <NButton secondary type="success" @click="showWeightInput = false">取消</NButton>
          <NButton type="primary" @click="saveWeight">保存</NButton>
        </div>
      </div>
    </NModal>

    <!-- 体脂输入弹窗 -->
    <NModal v-model:show="showBodyFatInput" :auto-focus="false" style="max-width: 360px;">
      <div style="background: var(--primary-50); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
        <div style="padding: 16px; font-size: 16px; font-weight: 700; color: var(--primary-dark);">
          🔥 记录体脂率
        </div>
        <div style="padding: 0 16px 16px;">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
            记录日期：{{ todayDate }}
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">体脂率 (%)</div>
            <NInputNumber v-model:value="bodyFatValue" :min="0" :max="60" placeholder="输入体脂率"
              style="width: 100%; --n-color: var(--primary-100); --n-border: 1px solid var(--primary-200); --n-border-radius: 8px;" />
          </div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px; background: var(--primary-50);">
          <NButton secondary type="success" @click="showBodyFatInput = false">取消</NButton>
          <NButton type="primary" @click="saveBodyFat">保存</NButton>
        </div>
      </div>
    </NModal>

    <!-- 编辑数据点弹窗 -->
    <NModal v-model:show="editDialog.show" :auto-focus="false" style="max-width: 320px;">
      <div style="background: var(--primary-50); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
        <div style="padding: 16px; font-size: 16px; font-weight: 700; color: var(--primary-dark);">
          ✏️ 数据
        </div>
        <div style="padding: 0 16px 16px;">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
            {{ editDialog.label }}
          </div>
          <NInputNumber v-model:value="editDialog.value" :min="0" placeholder="输入新值"
            style="width: 100%; --n-color: var(--primary-100); --n-border: 1px solid var(--primary-200); --n-border-radius: 8px;" />
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px; background: var(--primary-50);">
          <NButton size="small" type="error" @click="deleteRecord">删除</NButton>
          <NButton size="small" @click="editDialog.show = false">取消</NButton>
          <NButton size="small" type="primary" @click="saveEdit">保存</NButton>
        </div>
      </div>
    </NModal>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="router.push('/')">
        <span class="nav-icon">🏠</span>
        <span>概览</span>
      </div>
      <div class="nav-item" @click="router.push('/plan')">
        <span class="nav-icon">📋</span>
        <span>计划</span>
      </div>
      <div class="nav-item" @click="router.push('/diet')">
        <span class="nav-icon">🥗</span>
        <span>饮食</span>
      </div>
      <div class="nav-item active">
        <span class="nav-icon">📊</span>
        <span>数据</span>
      </div>
      <div class="nav-item" @click="router.push('/settings')">
        <span class="nav-icon">⚙️</span>
        <span>设置</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.n-input-number .n-input) {
  background: var(--primary-100) !important;
  border-color: var(--primary-200) !important;
}
</style>