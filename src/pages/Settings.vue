<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db, type Exercise, type DayPlan, initDefaultExercises, initDefaultDayPlans, getStepGoal, setStepGoal, getWaterGoal, setWaterGoal } from '@/db'
import { useRouter } from 'vue-router'

const router = useRouter()

// ========== 数据 ==========
const exercises = ref<Exercise[]>([])
const dayPlans = ref<DayPlan[]>([])

// 目标设置
const stepGoal = ref(10000)
const waterGoal = ref(8)

async function saveStepGoalSetting() {
  await setStepGoal(stepGoal.value)
}

async function saveWaterGoalSetting() {
  await setWaterGoal(waterGoal.value)
}

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const dayIcons = ['🚶', '🏃', '💪', '🏃', '🧘', '💪', '🏃']

async function loadData() {
  await initDefaultExercises()
  await initDefaultDayPlans()
  exercises.value = await db.exercises.toArray()
  dayPlans.value = await db.dayPlans.toArray()
  stepGoal.value = await getStepGoal()
  waterGoal.value = await getWaterGoal()
}

function getDayPlansForDay(dayOfWeek: number): DayPlan[] {
  return dayPlans.value.filter(dp => dp.dayOfWeek === dayOfWeek)
}

function getExerciseById(id: number): Exercise | undefined {
  return exercises.value.find(e => e.id === id)
}

// ========== 弹窗：天计划编辑 ==========
const showDayModal = ref(false)
const editingDay = ref(0)
const showAddItem = ref(false)
const selectedExerciseId = ref<number | null>(null)
const itemCount = ref(1)
const editingPlanId = ref<number | null>(null)
const editingPlanCount = ref(1)

function openDayModal(dayOfWeek: number) {
  editingDay.value = dayOfWeek
  showAddItem.value = false
  selectedExerciseId.value = null
  itemCount.value = 1
  editingPlanId.value = null
  showDayModal.value = true
}

function openPlanEdit(planId: number, currentCount: number) {
  editingPlanId.value = planId
  editingPlanCount.value = currentCount
}

async function savePlanEdit() {
  if (!editingPlanId.value) return
  await db.dayPlans.update(editingPlanId.value, { count: editingPlanCount.value })
  dayPlans.value = await db.dayPlans.toArray()
  editingPlanId.value = null
}

async function addItemToDay() {
  if (!selectedExerciseId.value) return
  const ex = getExerciseById(selectedExerciseId.value)
  if (!ex) return
  await db.dayPlans.add({
    dayOfWeek: editingDay.value,
    exerciseId: selectedExerciseId.value,
    count: itemCount.value,
  })
  dayPlans.value = await db.dayPlans.toArray()
  showAddItem.value = false
  selectedExerciseId.value = null
  itemCount.value = 1
}

async function removeItemFromDay(planId: number) {
  await db.dayPlans.delete(planId)
  dayPlans.value = await db.dayPlans.toArray()
}

// ========== 弹窗：设置项目 ==========
const showExerciseModal = ref(false)
const editingExercise = ref<Exercise | null>(null)
const editName = ref('')
const editCount = ref(1)
const editUnit = ref('分钟')
const editPerSet = ref('')

function openExerciseModal(ex?: Exercise) {
  if (ex) {
    editingExercise.value = ex
    editName.value = ex.name
    editCount.value = ex.defaultCount
    editUnit.value = ex.unit
    editPerSet.value = ex.perSet || ''
  } else {
    editingExercise.value = null
    editName.value = ''
    editCount.value = 1
    editUnit.value = '分钟'
    editPerSet.value = ''
  }
  showExerciseModal.value = true
}

async function saveExercise() {
  if (!editName.value.trim()) return
  const data: Partial<Exercise> = {
    name: editName.value.trim(),
    defaultCount: editCount.value,
    unit: editUnit.value,
    perSet: editUnit.value === '组' ? editPerSet.value.trim() || undefined : undefined,
  }
  if (editingExercise.value) {
    await db.exercises.update(editingExercise.value.id!, data)
  } else {
    await db.exercises.add(data as Exercise)
  }
  exercises.value = await db.exercises.toArray()
  showExerciseModal.value = false
}

async function deleteExercise(ex: Exercise) {
  await db.exercises.delete(ex.id!)
  await db.dayPlans.where('exerciseId').equals(ex.id!).delete()
  exercises.value = await db.exercises.toArray()
  dayPlans.value = await db.dayPlans.toArray()
}

// ========== 弹窗：改名 ==========
const showRenameModal = ref(false)
const renameExercise = ref<Exercise | null>(null)
const renameName = ref('')
const renameCount = ref(1)
const renameUnit = ref('分钟')
const renamePerSet = ref('')

function openRenameModal(ex: Exercise) {
  renameExercise.value = ex
  renameName.value = ex.name
  renameCount.value = ex.defaultCount
  renameUnit.value = ex.unit
  renamePerSet.value = ex.perSet || ''
  showRenameModal.value = true
}

async function saveRename() {
  if (!renameExercise.value || !renameName.value.trim()) return
  await db.exercises.update(renameExercise.value.id!, {
    name: renameName.value.trim(),
    defaultCount: renameCount.value,
    unit: renameUnit.value,
    perSet: renameUnit.value === '组' ? renamePerSet.value.trim() || undefined : undefined,
  })
  exercises.value = await db.exercises.toArray()
  showRenameModal.value = false
}

// 格式化运动项目显示
function exerciseDisplay(ex: Exercise): string {
  return ex.unit === '组' && ex.perSet ? `${ex.name} (${ex.perSet}/组)` : ex.name
}

// ========== 数据管理 ==========
async function clearSteps() {
  await db.stepCounts.clear()
}

async function clearMeals() {
  await db.meals.clear()
}

async function clearMeasurements() {
  await db.measurements.clear()
}

async function clearWater() {
  await db.waterIntake.clear()
}

async function clearWeeklyTasks() {
  await db.weeklyTasks.clear()
}

async function clearAllData() {
  await db.stepCounts.clear()
  await db.meals.clear()
  await db.measurements.clear()
  await db.waterIntake.clear()
  await db.dailyReminders.clear()
  await db.weeklyTasks.clear()
}

// ========== 数据导出 ==========
const showExportModal = ref(false)
const exportTitle = ref('')
const exportContent = ref('')

function downloadText(filename: string, text: string) {
  const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function showExport(title: string, content: string) {
  exportTitle.value = title
  exportContent.value = content
  showExportModal.value = true
}

async function exportSteps() {
  const records = await db.stepCounts.toArray()
  if (records.length === 0) {
    showExport('步数汇总', '暂无数据')
    return
  }
  const total = records.reduce((s, r) => s + r.steps, 0)
  const avg = Math.round(total / records.length)
  const max = Math.max(...records.map(r => r.steps))
  const text = `【步数汇总】\n\n记录天数：${records.length} 天\n总步数：${total.toLocaleString()} 步\n日均步数：${avg.toLocaleString()} 步\n最高步数：${max.toLocaleString()} 步`
  showExport('步数汇总', text)
}

async function exportMeasurements() {
  const records = await db.measurements.orderBy('date').toArray()
  if (records.length === 0) {
    showExport('测量记录', '暂无数据')
    return
  }
  const lines = ['日期\t左腿围(cm)\t右腿围(cm)\t体重(kg)\t体脂率(%)']
  for (const r of records) {
    lines.push(`${r.date}\t${r.leftThigh || '-'}\t${r.rightThigh || '-'}\t${r.weight != null ? r.weight : '-'}\t${r.bodyFat != null ? r.bodyFat : '-'}`)
  }
  showExport('测量记录', lines.join('\n'))
}

async function exportDiet() {
  const records = await db.meals.toArray()
  if (records.length === 0) {
    showExport('饮食汇总', '暂无数据')
    return
  }
  const foodCount: Record<string, number> = {}
  for (const m of records) {
    if (!m.foods) continue
    for (const item of m.foods.split('、')) {
      if (item) foodCount[item] = (foodCount[item] || 0) + 1
    }
  }
  const top = Object.entries(foodCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const text = `【饮食汇总】\n\n记录餐数：${records.length} 餐\n最常吃：\n${top.map(([name, c], i) => `  ${i + 1}. ${name} (${c}次)`).join('\n')}`
  showExport('饮食汇总', text)
}

async function exportWeeklyTasks() {
  const records = await db.weeklyTasks.toArray()
  if (records.length === 0) {
    showExport('打卡汇总', '暂无数据')
    return
  }
  const weekMap: Record<string, { total: number; completed: number }> = {}
  for (const r of records) {
    if (!weekMap[r.weekStart]) weekMap[r.weekStart] = { total: 0, completed: 0 }
    weekMap[r.weekStart].total++
    if (r.completed) weekMap[r.weekStart].completed++
  }
  const weeks = Object.entries(weekMap).sort((a, b) => a[0].localeCompare(b[0]))
  let text = '【打卡汇总】\n'
  for (const [week, { total, completed }] of weeks) {
    text += `\n${week} 起：${completed}/${total} 完成 (${Math.round(completed / total * 100)}%)`
  }
  showExport('打卡汇总', text)
}

// ========== 备份与恢复 ==========
async function exportAllData() {
  const data = {
    stepCounts: await db.stepCounts.toArray(),
    meals: await db.meals.toArray(),
    measurements: await db.measurements.toArray(),
    waterIntake: await db.waterIntake.toArray(),
    dailyReminders: await db.dailyReminders.toArray(),
    weeklyTasks: await db.weeklyTasks.toArray(),
    exercises: await db.exercises.toArray(),
    dayPlans: await db.dayPlans.toArray(),
    appSettings: await db.appSettings.toArray(),
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `瘦身计划备份_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function importAllData(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    // 清空所有表
    await db.stepCounts.clear()
    await db.meals.clear()
    await db.measurements.clear()
    await db.waterIntake.clear()
    await db.dailyReminders.clear()
    await db.weeklyTasks.clear()
    await db.exercises.clear()
    await db.dayPlans.clear()
    await db.appSettings.clear()

    // 恢复数据
    if (data.stepCounts) await db.stepCounts.bulkAdd(data.stepCounts)
    if (data.meals) await db.meals.bulkAdd(data.meals)
    if (data.measurements) await db.measurements.bulkAdd(data.measurements)
    if (data.waterIntake) await db.waterIntake.bulkAdd(data.waterIntake)
    if (data.dailyReminders) await db.dailyReminders.bulkAdd(data.dailyReminders)
    if (data.weeklyTasks) await db.weeklyTasks.bulkAdd(data.weeklyTasks)
    if (data.exercises) await db.exercises.bulkAdd(data.exercises)
    if (data.dayPlans) await db.dayPlans.bulkAdd(data.dayPlans)
    if (data.appSettings) await db.appSettings.bulkAdd(data.appSettings)

    await loadData()
    alert('数据恢复成功！')
  } catch {
    alert('文件格式错误，恢复失败')
  }
  input.value = ''
}

function triggerImport() {
  document.getElementById('backup-file-input')?.click()
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <div style="text-align: center; padding-top: 8px; margin-bottom: 16px;">
      <h1 style="font-size: 22px; font-weight: 700; color: var(--primary-dark);">设置</h1>
    </div>

    <!-- 卡片1：计划设置 -->
    <div class="card">
      <div class="card-title">
        <span>📋</span> 计划设置
      </div>
      <div
        v-for="(name, i) in dayNames"
        :key="i"
        @click="openDayModal(i)"
        class="day-row"
      >
        <div class="day-row-header">
          <span>{{ dayIcons[i] }}</span>
          <span style="font-weight: 600;">{{ name }}</span>
        </div>
        <div v-if="getDayPlansForDay(i).length > 0" style="display: flex; flex-wrap: wrap; gap: 6px; padding-left: 4px;">
          <span
            v-for="dp in getDayPlansForDay(i)"
            :key="dp.id"
            class="day-plan-bubble"
            @click.stop
          >
            {{ getExerciseById(dp.exerciseId) ? exerciseDisplay(getExerciseById(dp.exerciseId)!) : '未知' }}
            <span class="bubble-detail">{{ dp.count }}{{ getExerciseById(dp.exerciseId)?.unit || '' }}</span>
          </span>
        </div>
        <div v-else style="font-size: 12px; color: var(--text-muted); padding-left: 4px;">暂无</div>
      </div>
    </div>

    <!-- 卡片2：项目库 -->
    <div class="card">
      <div class="card-title">
        <span>🏷️</span> 项目库
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 40px; align-items: flex-start;">
        <div v-if="exercises.length === 0" style="font-size: 13px; color: var(--text-muted); width: 100%; text-align: center; padding: 12px 0;">
          暂无项目，点击右下角按钮添加
        </div>
        <span
          v-for="ex in exercises"
          :key="ex.id"
          @click="openRenameModal(ex)"
          class="exercise-bubble"
        >
          {{ exerciseDisplay(ex) }}
        </span>
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
        <NButton size="small" type="primary" circle @click="openExerciseModal()" style="width: 36px; height: 36px; font-size: 20px;">+</NButton>
      </div>
    </div>

    <!-- 卡片3：目标设置 -->
    <div class="card">
      <div class="card-title">
        <span>🎯</span> 目标设置
      </div>
      <div class="data-row">
        <span>👟 每日步数</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <NInputNumber v-model:value="stepGoal" :min="1000" :max="50000" :step="1000" :show-button="false" size="small" style="width: 80px;" />
          <NButton size="tiny" type="primary" @click="saveStepGoalSetting">保存</NButton>
        </div>
      </div>
      <div class="data-row">
        <span>💧 每日喝水(天/杯)</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <NInputNumber v-model:value="waterGoal" :min="1" :max="50" :show-button="false" size="small" style="width: 80px;" />
          <NButton size="tiny" type="primary" @click="saveWaterGoalSetting">保存</NButton>
        </div>
      </div>
    </div>

    <!-- 卡片4：数据管理 -->
    <div class="card">
      <div class="card-title">
        <span>🗑️</span> 清除数据
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">清除数据后不可恢复，请谨慎操作</div>
      <div class="data-row">
        <span>👟 步数记录</span>
        <NButton size="tiny" type="error" ghost @click="clearSteps">清除</NButton>
      </div>
      <div class="data-row">
        <span>🥗 饮食记录</span>
        <NButton size="tiny" type="error" ghost @click="clearMeals">清除</NButton>
      </div>
      <div class="data-row">
        <span>📏 测量数据</span>
        <NButton size="tiny" type="error" ghost @click="clearMeasurements">清除</NButton>
      </div>
      <div class="data-row">
        <span>💧 喝水记录</span>
        <NButton size="tiny" type="error" ghost @click="clearWater">清除</NButton>
      </div>
      <div class="data-row">
        <span>✅ 打卡记录</span>
        <NButton size="tiny" type="error" ghost @click="clearWeeklyTasks">清除</NButton>
      </div>
      <div style="border-top: 1px solid var(--primary-200); padding-top: 12px; margin-top: 4px;">
        <NButton size="tiny" type="error" round @click="clearAllData">清除所有数据</NButton>
      </div>
    </div>

    <!-- 卡片4：数据管理 -->
    <div class="card">
      <div class="card-title">
        <span>📤</span> 数据管理
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">导出数据到文件或复制到剪贴板</div>
      <div class="data-row">
        <span>👟 步数汇总</span>
        <NButton size="tiny" type="primary" ghost @click="exportSteps">导出</NButton>
      </div>
      <div class="data-row">
        <span>📏 测量明细</span>
        <NButton size="tiny" type="primary" ghost @click="exportMeasurements">导出</NButton>
      </div>
      <div class="data-row">
        <span>🥗 饮食汇总</span>
        <NButton size="tiny" type="primary" ghost @click="exportDiet">导出</NButton>
      </div>
      <div class="data-row">
        <span>✅ 打卡汇总</span>
        <NButton size="tiny" type="primary" ghost @click="exportWeeklyTasks">导出</NButton>
      </div>
    </div>

    <!-- 卡片5：备份与恢复 -->
    <div class="card">
      <div class="card-title">
        <span>💾</span> 备份与恢复
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">备份全部数据为JSON文件，可从文件恢复</div>
      <div class="data-row">
        <span>📦 备份全部</span>
        <NButton size="tiny" type="primary" ghost @click="exportAllData">导出</NButton>
      </div>
      <div class="data-row">
        <span>📥 从文件恢复</span>
        <NButton size="tiny" type="warning" ghost @click="triggerImport">导入</NButton>
      </div>
      <input id="backup-file-input" type="file" accept=".json" style="display: none;" @change="importAllData" />
    </div>

    <!-- 弹窗A：天计划编辑 -->
    <NModal
      v-model:show="showDayModal"
      :mask-closable="true"
      transform-origin="center"
    >
      <div class="modal-card">
        <div class="modal-title">
          {{ dayIcons[editingDay] }} {{ dayNames[editingDay] }} 计划
        </div>

        <!-- 已添加的项目气泡 -->
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; min-height: 36px;">
          <div v-if="getDayPlansForDay(editingDay).length === 0 && !showAddItem" style="font-size: 13px; color: var(--text-muted); width: 100%; text-align: center; padding: 20px 0;">
            暂未添加项目
          </div>
          <div
            v-for="dp in getDayPlansForDay(editingDay)"
            :key="dp.id"
            class="day-plan-bubble"
            @click.stop="openPlanEdit(dp.id!, dp.count)"
          >
            <template v-if="editingPlanId === dp.id">
              <NInputNumber v-model:value="editingPlanCount" :min="1" :max="999" size="tiny" style="width: 60px;" :show-button="false" />
              <span style="font-size: 11px;">{{ getExerciseById(dp.exerciseId)?.unit || '' }}</span>
              <NButton size="tiny" type="primary" @click.stop="savePlanEdit">✓</NButton>
              <NButton size="tiny" @click.stop="editingPlanId = null">✕</NButton>
            </template>
            <template v-else>
              {{ getExerciseById(dp.exerciseId) ? exerciseDisplay(getExerciseById(dp.exerciseId)!) : '未知' }}
              <span class="bubble-detail">{{ dp.count }}{{ getExerciseById(dp.exerciseId)?.unit || '' }}</span>
              <span class="bubble-remove" @click.stop="removeItemFromDay(dp.id!)">×</span>
            </template>
          </div>
        </div>

        <!-- 添加项目区域 -->
        <div v-if="showAddItem" class="add-item-area">
          <NSelect
            v-model:value="selectedExerciseId"
            :options="exercises.map(e => ({ label: exerciseDisplay(e), value: e.id! }))"
            placeholder="选择项目"
            style="flex: 1;"
          />
          <NInputNumber
            v-model:value="itemCount"
            :min="1"
            :max="999"
            :show-button="false"
            size="small"
            style="width: 80px;"
            placeholder="数量"
          />
          <NButton size="small" type="primary" @click="addItemToDay" :disabled="!selectedExerciseId">添加</NButton>
          <NButton size="small" @click="showAddItem = false">取消</NButton>
        </div>
        <NButton v-else size="small" type="primary" dashed block @click="showAddItem = true">+ 添加项目</NButton>

        <div style="text-align: center; margin-top: 16px;">
          <NButton size="small" @click="showDayModal = false" style="width: 100px;">关闭</NButton>
        </div>
      </div>
    </NModal>

    <!-- 弹窗B：设置项目 -->
    <NModal
      v-model:show="showExerciseModal"
      :mask-closable="true"
      transform-origin="center"
    >
      <div class="modal-card">
        <div class="modal-title">
          {{ editingExercise ? '编辑项目' : '新增项目' }}
        </div>

        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
          <NInput v-model:value="editName" placeholder="项目名称" style="flex: 1;" />
        </div>
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px;">
          <NInputNumber v-model:value="editCount" :min="1" :max="999" :show-button="false" size="small" style="width: 80px;" placeholder="数量" />
          <NSelect
            v-model:value="editUnit"
            :options="[
              { label: '分钟', value: '分钟' },
              { label: '组', value: '组' },
              { label: '次', value: '次' },
              { label: '秒', value: '秒' },
            ]"
            size="small"
            style="width: 80px;"
          />
          <NInput v-if="editUnit === '组'" v-model:value="editPerSet" size="small" placeholder="每组内容" style="width: 100px;" />
        </div>

        <div style="display: flex; gap: 8px; justify-content: center;">
          <NButton size="small" type="primary" @click="saveExercise" :disabled="!editName.trim()">保存</NButton>
          <NButton v-if="editingExercise" size="small" type="error" @click="deleteExercise(editingExercise); showExerciseModal = false" ghost>删除</NButton>
          <NButton size="small" @click="showExerciseModal = false">取消</NButton>
        </div>

        <!-- 现有项目列表 -->
        <div v-if="exercises.length > 0" style="margin-top: 20px; border-top: 1px solid var(--primary-200); padding-top: 12px;">
          <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">现有项目（点击编辑）</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <span
              v-for="ex in exercises"
              :key="ex.id"
              @click="openExerciseModal(ex)"
              class="exercise-bubble"
              :style="{ background: editingExercise?.id === ex.id ? 'var(--primary-200)' : 'var(--primary-50)' }"
            >
              {{ ex.name }}
            </span>
          </div>
        </div>
      </div>
    </NModal>

    <!-- 弹窗C：改名 -->
    <NModal
      v-model:show="showRenameModal"
      :mask-closable="true"
      transform-origin="center"
    >
      <div class="modal-card">
        <div class="modal-title">修改项目</div>
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
          <NInput v-model:value="renameName" placeholder="项目名称" style="flex: 1;" />
        </div>
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px;">
          <NInputNumber v-model:value="renameCount" :min="1" :max="999" :show-button="false" size="small" style="width: 80px;" placeholder="数量" />
          <NSelect
            v-model:value="renameUnit"
            :options="[
              { label: '分钟', value: '分钟' },
              { label: '组', value: '组' },
              { label: '次', value: '次' },
              { label: '秒', value: '秒' },
            ]"
            size="small"
            style="width: 80px;"
          />
          <NInput v-if="renameUnit === '组'" v-model:value="renamePerSet" size="small" placeholder="每组内容" style="width: 100px;" />
        </div>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <NButton size="small" type="primary" @click="saveRename" :disabled="!renameName.trim()">保存</NButton>
          <NButton size="small" type="error" ghost @click="deleteExercise(renameExercise!); showRenameModal = false">删除</NButton>
          <NButton size="small" @click="showRenameModal = false">取消</NButton>
        </div>
      </div>
    </NModal>

    <!-- 弹窗D：数据导出 -->
    <NModal v-model:show="showExportModal" :mask-closable="true" transform-origin="center">
      <div class="modal-card">
        <div class="modal-title">{{ exportTitle }}</div>
        <pre style="background: var(--primary-50); padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; max-height: 300px; overflow-y: auto; margin-bottom: 16px;">{{ exportContent }}</pre>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <NButton size="small" type="primary" @click="downloadText(exportTitle + '.txt', exportContent)">下载</NButton>
          <NButton size="small" @click="copyToClipboard(exportContent)">复制</NButton>
          <NButton size="small" @click="showExportModal = false">关闭</NButton>
        </div>
      </div>
    </NModal>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="router.push('/')">
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
      <div class="nav-item active">
        <span class="nav-icon">⚙️</span><span>设置</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--primary-100);
}

.day-row {
  padding: 10px 8px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--primary-200);
  margin-bottom: 6px;
  transition: all 0.2s;
  background: var(--primary-50);
}
.day-row:last-child {
  margin-bottom: 0;
}
.day-row:hover, .day-row:active {
  background: var(--primary-200);
}
.day-row-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 14px;
}

.exercise-bubble {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--primary-50);
  border: 1px solid var(--primary-200);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--primary-dark);
}
.exercise-bubble:active {
  background: var(--primary-200);
}

.day-plan-bubble {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  background: var(--primary-200);
  font-size: 13px;
  font-weight: 500;
  color: var(--primary-dark);
  position: relative;
  cursor: pointer;
  user-select: none;
}
.bubble-detail {
  font-size: 11px;
  opacity: 0.7;
  font-weight: 400;
}
.bubble-remove {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--danger);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: 2px;
  cursor: pointer;
  transition: transform 0.15s;
}
.bubble-remove:active {
  transform: scale(1.2);
}

/* 弹窗 */
.modal-card {
  background: var(--primary-100);
  border-radius: 16px;
  padding: 20px;
  width: 90vw;
  max-width: 400px;
  margin: 0 auto;
}
.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 16px;
  text-align: center;
}
.add-item-area {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--primary-50);
  border-radius: 10px;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--primary-200);
  font-size: 14px;
}
.data-row:last-of-type {
  border-bottom: none;
}
</style>