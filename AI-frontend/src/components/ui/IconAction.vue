<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon: Component
    label?: string
    variant?: 'primary' | 'ghost' | 'danger' | 'soft'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit'
    ariaLabel?: string
    /** 图标悬停语义动效；默认沿用统一放大 */
    motion?: 'none' | 'send' | 'spin' | 'shake' | 'slide' | 'pop' | 'pulse' | 'wiggle'
  }>(),
  {
    variant: 'soft',
    size: 'md',
    block: false,
    disabled: false,
    loading: false,
    type: 'button',
    motion: 'none',
  },
)

/**
 * 不声明 click emit：让父组件 @click 作为原生监听透传到根 button，
 * 避免 Vue 3 将 @click 当成组件事件后，父级收不到点击。
 */
</script>

<template>
  <button
    class="icon-action"
    :class="[
      `icon-action--${variant}`,
      `icon-action--${size}`,
      `icon-action--motion-${motion}`,
      { 'icon-action--block': block, 'icon-action--icon-only': !label },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-label="ariaLabel || label"
  >
    <span class="icon-action__icon" :class="{ 'is-spin': loading }">
      <component :is="icon" :size="size === 'lg' ? 20 : size === 'sm' ? 16 : 18" :stroke-width="2" />
    </span>
    <span v-if="label" class="icon-action__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  white-space: nowrap;
  line-height: 1;
}

.icon-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.icon-action--block {
  width: 100%;
}

.icon-action--sm {
  height: 32px;
  padding: 0 10px;
  font-size: var(--font-size-sm);
}

.icon-action--md {
  height: 40px;
  padding: 0 14px;
  font-size: var(--font-size-md);
}

.icon-action--lg {
  height: 48px;
  padding: 0 18px;
  font-size: var(--font-size-lg);
}

.icon-action--icon-only.icon-action--sm {
  width: 32px;
  padding: 0;
}

.icon-action--icon-only.icon-action--md {
  width: 40px;
  padding: 0;
}

.icon-action--icon-only.icon-action--lg {
  width: 48px;
  padding: 0;
}

.icon-action__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.icon-action:hover:not(:disabled) .icon-action__icon {
  transform: scale(1.08);
}

.icon-action__icon.is-spin {
  animation: iconSpin 0.8s linear infinite;
}

@keyframes iconSpin {
  to {
    transform: rotate(360deg);
  }
}

/* 语义化悬停动效（motion prop） */
.icon-action--motion-send:hover:not(:disabled) .icon-action__icon:not(.is-spin) {
  animation: iaSend 0.5s ease;
}

.icon-action--motion-spin:hover:not(:disabled) .icon-action__icon:not(.is-spin) {
  animation: iaSpin 0.6s ease;
}

.icon-action--motion-shake:hover:not(:disabled) .icon-action__icon:not(.is-spin) {
  animation: iaShake 0.5s ease;
}

.icon-action--motion-slide:hover:not(:disabled) .icon-action__icon:not(.is-spin) {
  animation: iaSlide 0.5s ease;
}

.icon-action--motion-pop:hover:not(:disabled) .icon-action__icon:not(.is-spin) {
  animation: iaPop 0.45s ease;
}

.icon-action--motion-pulse:hover:not(:disabled) .icon-action__icon:not(.is-spin) {
  animation: iaPulse 0.7s ease;
}

.icon-action--motion-wiggle:hover:not(:disabled) .icon-action__icon:not(.is-spin) {
  animation: iaWiggle 0.55s ease;
}

@keyframes iaSend {
  0% {
    transform: translate(0, 0);
  }
  55% {
    transform: translate(5px, -5px);
  }
  56% {
    transform: translate(-4px, 4px);
    opacity: 0.6;
  }
  100% {
    transform: translate(0, 0);
    opacity: 1;
  }
}

@keyframes iaSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes iaShake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

@keyframes iaSlide {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(4px);
  }
}

@keyframes iaPop {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.22);
  }
  100% {
    transform: scale(1.08);
  }
}

@keyframes iaPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.18);
  }
}

@keyframes iaWiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-12deg) translateX(-1px);
  }
  75% {
    transform: rotate(10deg) translateX(1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-action__icon,
  .icon-action:hover:not(:disabled) .icon-action__icon {
    animation: none !important;
    transform: none !important;
  }
}

.icon-action:active:not(:disabled) {
  transform: scale(0.96) rotateY(-5deg);
}

.icon-action--primary {
  background: var(--color-primary);
  color: #f5f0e1;
  box-shadow: none;
}

.icon-action--primary:hover:not(:disabled) {
  transform: none;
  background: var(--color-primary-dark);
  box-shadow: none;
}

.icon-action--primary:active:not(:disabled) {
  transform: scale(0.96) rotateY(-5deg);
}

.icon-action--soft {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.icon-action--soft:hover:not(:disabled) {
  background: var(--color-primary-08);
  border-color: var(--color-border-hover);
}

.icon-action--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--color-text-secondary);
}

.icon-action--ghost:hover:not(:disabled) {
  background: var(--color-primary-08);
  color: var(--color-text-primary);
}

.icon-action--danger {
  background: rgba(160, 58, 42, 0.1);
  border-color: rgba(160, 58, 42, 0.35);
  color: var(--color-error);
}

.icon-action--danger:hover:not(:disabled) {
  background: rgba(160, 58, 42, 0.16);
}
</style>
