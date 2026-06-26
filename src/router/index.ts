import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/Home.vue'),
      meta: { title: '今日概览' },
    },
    {
      path: '/plan',
      name: 'plan',
      component: () => import('@/pages/Plan.vue'),
      meta: { title: '7天计划' },
    },
    {
      path: '/diet',
      name: 'diet',
      component: () => import('@/pages/Diet.vue'),
      meta: { title: '饮食记录' },
    },
    {
      path: '/data',
      name: 'data',
      component: () => import('@/pages/Data.vue'),
      meta: { title: '数据统计' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/Settings.vue'),
      meta: { title: '设置' },
    },
  ],
})

router.onError((error) => {
  console.error('路由错误:', error)
  alert('页面加载失败: ' + (error instanceof Error ? error.message : String(error)))
})

export default router