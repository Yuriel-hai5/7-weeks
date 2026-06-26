<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { db, type Meal } from '@/db'
import { getTodayDate } from '@/data/planData'
import { useRouter } from 'vue-router'

const router = useRouter()
const todayDate = getTodayDate()
const meals = ref<Meal[]>([])
const showEdit = ref(false)
const editMeal = ref<{ mealType: string; foods: string; note: string }>({
  mealType: 'breakfast',
  foods: '',
  note: '',
})

const mealTypes = [
  { key: 'breakfast' as const, label: '早餐', emoji: '🌅', time: '07:00-09:00', tip: '营养均衡，蛋白质+碳水+蔬菜' },
  { key: 'lunch' as const, label: '午餐', emoji: '☀️', time: '11:30-13:00', tip: '正常吃，七八分饱，荤素搭配' },
  { key: 'dinner' as const, label: '晚餐', emoji: '🌙', time: '17:30-19:00', tip: '清淡为主，少主食，多蛋白+蔬菜' },
]

const foodSuggestions = {
  breakfast: ['鸡蛋', '全麦面包', '牛奶', '燕麦', '玉米', '红薯', '酸奶', '香蕉', '菠菜', '番茄'],
  lunch: ['鸡胸肉', '鱼肉', '虾', '牛肉', '米饭', '糙米饭', '西兰花', '豆腐', '青菜', '菌菇'],
  dinner: ['鸡胸肉', '鱼肉', '豆腐', '蔬菜沙拉', '西兰花', '番茄', '黄瓜', '菌菇汤', '虾仁', '蒸蛋'],
}

const canEat = ['米饭', '面条', '红薯', '玉米', '鸡蛋', '鸡肉', '鱼虾', '牛肉', '蔬菜', '水果', '酸奶', '坚果']
const shouldAvoid = ['油炸食品', '甜食', '零食', '奶茶', '饮料', '酒精']

async function loadMeals() {
  meals.value = await db.meals.where('date').equals(todayDate).toArray()
}

function getMeal(type: string) {
  return meals.value.find(m => m.mealType === type) || null
}

function openEdit(type: string) {
  const existing = getMeal(type)
  editMeal.value = {
    mealType: type,
    foods: existing?.foods || '',
    note: existing?.note || '',
  }
  showEdit.value = true
}

async function saveMeal() {
  const { mealType, foods, note } = editMeal.value
  const existing = await db.meals
    .where({ date: todayDate, mealType })
    .first()

  if (existing) {
    await db.meals.update(existing.id!, { foods, note })
  } else {
    await db.meals.add({
      date: todayDate,
      mealType: mealType as 'breakfast' | 'lunch' | 'dinner',
      foods,
      note,
    })
  }
  showEdit.value = false
  await loadMeals()
}

function toggleFood(food: string) {
  const foods = editMeal.value.foods.split('、').filter(Boolean)
  const idx = foods.indexOf(food)
  if (idx >= 0) {
    foods.splice(idx, 1)
  } else {
    foods.push(food)
  }
  editMeal.value.foods = foods.join('、')
}

const mealSummary = computed(() => {
  const allFoods = meals.value.map(m => m.foods).filter(Boolean).join('、')
  const hasProtein = /鸡肉|鱼肉|虾|牛肉|鸡蛋|豆腐|牛奶|酸奶/.test(allFoods)
  const hasVeg = /蔬菜|青菜|西兰花|菠菜|番茄|黄瓜|菌菇/.test(allFoods)
  const hasCarb = /米饭|面条|红薯|玉米|全麦|燕麦|糙米/.test(allFoods)
  return [
    { label: '蛋白质', ok: hasProtein },
    { label: '蔬菜', ok: hasVeg },
    { label: '碳水', ok: hasCarb },
  ]
})

onMounted(loadMeals)
</script>

<template>
  <div class="page-container">
    <div style="text-align: center; padding-top: 8px; margin-bottom: 16px;">
      <h1 style="font-size: 22px; font-weight: 700; color: var(--primary-dark);">饮食记录</h1>
      <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">{{ todayDate }} · 吃对就能瘦</p>
    </div>

    <!-- 每日饮食总结 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title">📋 今日饮食总结</div>
      <div style="display: flex; gap: 12px;">
        <div v-for="item in mealSummary" :key="item.label"
          :style="{
            flex: 1, textAlign: 'center', padding: '8px', borderRadius: '8px',
            background: item.ok ? 'var(--primary-100)' : '#fef3c7',
            color: item.ok ? 'var(--primary-dark)' : '#b45309',
            fontSize: '13px',
          }">
          {{ item.label }} {{ item.ok ? '✔' : '?' }}
        </div>
      </div>
    </div>

    <!-- 三餐卡片 -->
    <div v-for="mt in mealTypes" :key="mt.key" class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">{{ mt.emoji }}</span>
          <div>
            <div style="font-size: 16px; font-weight: 600;">{{ mt.label }}</div>
            <div style="font-size: 12px; color: var(--text-muted);">{{ mt.time }} · {{ mt.tip }}</div>
          </div>
        </div>
        <NButton size="small" :type="getMeal(mt.key) ? 'primary' : 'default'" dashed @click="openEdit(mt.key)">
          {{ getMeal(mt.key) ? '编辑' : '记录' }}
        </NButton>
      </div>
      <div v-if="getMeal(mt.key)" style="background: var(--primary-100); border-radius: 8px; padding: 10px;">
        <div style="font-size: 13px; color: var(--text);" v-if="getMeal(mt.key)!.foods">
          <strong>食物：</strong>{{ getMeal(mt.key)!.foods }}
        </div>
        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;" v-if="getMeal(mt.key)!.note">
          <strong>备注：</strong>{{ getMeal(mt.key)!.note }}
        </div>
      </div>
      <div v-else style="text-align: center; padding: 8px; color: var(--text-muted); font-size: 13px;">
        还没记录，点击按钮记录吧～
      </div>
    </div>

    <!-- 饮食原则 -->
    <div class="card" style="background: var(--primary-50); border: 1px solid var(--primary-200);">
      <div class="card-title" style="color: var(--primary-dark);">
        <span>🍽</span> 饮食原则
      </div>
      <div style="font-size: 13px; color: var(--text-secondary);">
        <div style="margin-bottom: 6px;">👍 <strong>可以吃：</strong></div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
          <span v-for="f in canEat" :key="f" class="tag tag-green">{{ f }}</span>
        </div>
        <div style="margin-bottom: 6px;">⚠ <strong>要少吃：</strong></div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          <span v-for="f in shouldAvoid" :key="f" class="tag tag-red">{{ f }}</span>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <NModal v-model:show="showEdit" :auto-focus="false" style="max-width: 400px;">
      <div style="background: var(--primary-50); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
        <div style="padding: 16px; font-size: 18px; font-weight: 700; color: var(--primary-dark); border-bottom: 1px solid var(--primary-200);">记录饮食</div>
        <div style="padding: 16px;">
          <div style="margin-bottom: 16px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">选择食物（可多选）：</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <span
                v-for="food in foodSuggestions[editMeal.mealType as keyof typeof foodSuggestions]"
                :key="food"
                @click="toggleFood(food)"
                :style="{
                  padding: '4px 12px', borderRadius: '16px', fontSize: '13px', cursor: 'pointer',
                  background: editMeal.foods.includes(food) ? 'var(--primary)' : 'var(--primary-100)',
                  color: editMeal.foods.includes(food) ? 'white' : 'var(--text)',
                  transition: 'all 0.2s',
                }"
              >
                {{ food }}
              </span>
            </div>
          </div>
          <div style="margin-bottom: 16px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">手动输入：</div>
            <NInput v-model:value="editMeal.foods" placeholder="如：鸡蛋+玉米+菠菜" :style="{ '--n-color': 'var(--primary-100)', '--n-border': '1px solid var(--primary-200)', '--n-border-radius': '8px' }" />
          </div>
          <div style="margin-bottom: 16px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">备注：</div>
            <NInput v-model:value="editMeal.note" type="textarea" placeholder="口味、份量等..." :rows="2" :style="{ '--n-color': 'var(--primary-100)', '--n-border': '1px solid var(--primary-200)', '--n-border-radius': '8px' }" />
          </div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px; border-top: 1px solid var(--primary-200);">
          <NButton secondary type="success" @click="showEdit = false">取消</NButton>
          <NButton type="primary" @click="saveMeal">保存</NButton>
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
      <div class="nav-item active">
        <span class="nav-icon">🥗</span>
        <span>饮食</span>
      </div>
      <div class="nav-item" @click="router.push('/data')">
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