<script setup lang="ts">
import { computed } from 'vue'
import type { PetState, PetViewModel } from '../../types'

const props = defineProps<{
  model: PetViewModel
  size: number
}>()

const emit = defineEmits<{
  animationComplete: [state: PetState]
}>()

const stateClass = computed(() => `pet-css--${props.model.state}`)
const isFlipped = computed(() => props.model.facing === 'left')

const pupilStyle = computed(() => {
  if (!props.model.lookAt) {
    return { transform: 'translate(0, 0)' }
  }
  return {
    transform: `translate(${props.model.lookAt.x}px, ${props.model.lookAt.y}px)`,
  }
})

function onReactAnimationEnd(e: AnimationEvent) {
  if (props.model.state !== 'react') return
  if (e.animationName !== 'pet-react-bounce') return
  emit('animationComplete', 'react')
}
</script>

<template>
  <div
    class="pet-css"
    :class="stateClass"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @animationend="onReactAnimationEnd"
  >
    <div class="pet-css__body" :class="{ 'pet-css__body--flip': isFlipped }">
      <div class="pet-css__stack">
        <span class="pet-css__ball pet-css__ball--small" />
        <span class="pet-css__ball pet-css__ball--medium" />
        <span class="pet-css__ball pet-css__ball--large">
          <span class="pet-css__face">
            <span class="pet-css__eye pet-css__eye--left">
              <span class="pet-css__pupil" :style="pupilStyle" />
            </span>
            <span class="pet-css__eye pet-css__eye--right">
              <span class="pet-css__pupil" :style="pupilStyle" />
            </span>
            <span class="pet-css__blush pet-css__blush--left" />
            <span class="pet-css__blush pet-css__blush--right" />
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pet-css {
  position: relative;
  transform-origin: bottom center;
}

.pet-css__body {
  width: 100%;
  height: 100%;
  transform-origin: bottom center;
}

.pet-css__body--flip {
  transform: scaleX(-1);
}

.pet-css__stack {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 1px;
}

.pet-css__ball {
  display: block;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--color-primary-light), var(--color-primary));
  box-shadow: var(--shadow-glow);
}

.pet-css__ball--small {
  width: 14px;
  height: 14px;
  opacity: 0.92;
}

.pet-css__ball--medium {
  width: 22px;
  height: 22px;
}

.pet-css__ball--large {
  position: relative;
  width: 34px;
  height: 34px;
}

.pet-css__face {
  position: absolute;
  inset: 0;
}

.pet-css__eye {
  position: absolute;
  top: 11px;
  width: 7px;
  height: 9px;
  border-radius: 50%;
  background: rgba(26, 22, 37, 0.92);
  overflow: hidden;
}

.pet-css__eye--left {
  left: 8px;
}

.pet-css__eye--right {
  right: 8px;
}

.pet-css__pupil {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 3px;
  margin: -1.5px 0 0 -1.5px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.12s ease;
}

.pet-css__blush {
  position: absolute;
  top: 18px;
  width: 6px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 180, 200, 0.45);
}

.pet-css__blush--left {
  left: 4px;
}

.pet-css__blush--right {
  right: 4px;
}

.pet-css--idle .pet-css__body {
  animation: pet-idle-breathe 2.4s ease-in-out infinite;
}

.pet-css--walk .pet-css__body {
  animation: pet-walk-bob 0.45s ease-in-out infinite;
}

.pet-css--react .pet-css__body {
  animation: pet-react-bounce 0.55s ease-out 1;
}

.pet-css--sleep {
  opacity: 0.78;
}

.pet-css--sleep .pet-css__eye {
  height: 2px;
  top: 14px;
  border-radius: 2px;
}

.pet-css--sleep .pet-css__pupil,
.pet-css--sleep .pet-css__blush {
  opacity: 0;
}

.pet-css--drag .pet-css__body {
  transform: rotate(-3deg);
}

.pet-css--drag.pet-css .pet-css__body--flip {
  transform: scaleX(-1) rotate(3deg);
}

@keyframes pet-idle-breathe {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.96);
  }
}

@keyframes pet-walk-bob {
  0%,
  100% {
    transform: translateY(0) scaleY(1);
  }
  50% {
    transform: translateY(-3px) scaleY(0.97);
  }
}

@keyframes pet-react-bounce {
  0% {
    transform: translateY(0) scale(1);
  }
  35% {
    transform: translateY(-10px) scale(1.06);
  }
  70% {
    transform: translateY(0) scale(0.96);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}
</style>
