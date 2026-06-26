<script setup lang="ts">
import { NMessageProvider, NNotificationProvider, NDialogProvider } from 'naive-ui'
</script>

<template>
  <NNotificationProvider>
    <NMessageProvider>
      <NDialogProvider>
        <router-view />
      </NDialogProvider>
    </NMessageProvider>
  </NNotificationProvider>
</template>