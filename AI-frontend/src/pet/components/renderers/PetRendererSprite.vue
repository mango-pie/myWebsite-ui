<script setup lang="ts">
import { computed } from 'vue'
import { siteConfig } from '@/config/site'
import type { PetState, PetViewModel } from '../../types'
import PetRendererCss from './PetRendererCss.vue'

defineProps<{
  model: PetViewModel
  size: number
}>()

const emit = defineEmits<{
  animationComplete: [state: PetState]
}>()

const spriteUrl = computed(() => siteConfig.effects.petDango.spriteUrl)
const hasSprite = computed(() => Boolean(spriteUrl.value))

function onAnimationComplete(state: PetState) {
  emit('animationComplete', state)
}
</script>

<template>
  <!-- TODO: sprite frame loop — load atlas JSON and advance frames by PetState -->
  <PetRendererCss
    v-if="!hasSprite"
    :model="model"
    :size="size"
    @animation-complete="onAnimationComplete"
  />
  <PetRendererCss
    v-else
    :model="model"
    :size="size"
    @animation-complete="onAnimationComplete"
  />
</template>
