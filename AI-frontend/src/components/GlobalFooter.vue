<script lang="ts">
/**
 * 全局页脚 - 展示版权年份与站外链接
 */
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GlobalFooter',
  setup() {
    const currentYear = new Date().getFullYear()
    return { currentYear }
  },
})
</script>

<template>
  <div class="global-footer">
    <span class="global-footer__text">© {{ currentYear }} CodeFather</span>
    <a
      class="global-footer__link"
      href="https://www.codefather.cn"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://www.codefather.cn
    </a>
  </div>
</template>

<style scoped>
.global-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
}

.global-footer__link {
  color: #1677ff;
}

.global-footer__link:hover {
  text-decoration: underline;
}
</style>

