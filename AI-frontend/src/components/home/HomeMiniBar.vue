<script setup lang="ts">
import { siteConfig } from '@/config/site'

defineProps<{
  pageLabel: string
}>()

defineEmits<{
  home: []
}>()
</script>

<template>
  <header class="home-mini-bar">
    <button type="button" class="home-mini-bar__brand font-display" @click="$emit('home')">
      {{ siteConfig.siteName }}
    </button>
    <span class="home-mini-bar__page">{{ pageLabel }}</span>
  </header>
</template>
