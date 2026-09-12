<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import type { PulsePlayerApi } from '@/pages/music/pulseApi'

const props = defineProps<{ p: PulsePlayerApi }>()
const p = props.p

function onEqEnabledChange(e: Event) {
  p.setEqEnabled((e.target as HTMLInputElement).checked)
}

function onEqGainInput(index: number, e: Event) {
  p.setEqGain(index, Number((e.target as HTMLInputElement).value))
}
</script>

<template>
  <section id="pulse-eq" class="content-panel settings-card settings-eq-card">
    <header class="panel-head">
      <span class="panel-index">EQ / 10 BAND</span>
      <h2>均衡器</h2>
      <span class="spacer" />
      <button class="text-button" type="button" @click="p.resetEq()">
        <RotateCcw :size="13" :stroke-width="2" aria-hidden="true" />
        恢复平直
      </button>
      <label class="switch" aria-label="启用均衡器">
        <input :checked="p.eqEnabled.value" type="checkbox" @change="onEqEnabledChange" />
        <span class="switch-ui" />
      </label>
    </header>
    <p class="settings-eq-lead">十段均衡器插在播放链路上，改动会立刻进耳朵。频谱与舞台共用同一 Analyser。</p>
    <div class="settings-stack" style="margin-top: 4px">
      <div class="eq-preset-row" role="group" aria-label="EQ 预设">
        <span class="eq-preset-label">预设</span>
        <button
          v-for="preset in p.eqPresets"
          :key="preset.id"
          class="theater-chip"
          type="button"
          :class="{ 'is-active': p.eqPresetId.value === preset.id }"
          @click="p.setEqPreset(preset.id)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
    <div class="audio-layout">
      <section class="panel">
        <div class="eq-grid">
          <label v-for="(band, i) in p.eqBands" :key="band" class="eq-band">
            <input
              :value="p.eqGains.value[i]"
              type="range"
              min="-12"
              max="12"
              step="1"
              :disabled="!p.eqEnabled.value"
              @input="onEqGainInput(i, $event)"
            />
            <span>{{ band }}</span>
          </label>
        </div>
      </section>
      <section class="panel">
        <header class="panel-head"><span class="panel-index">FFT</span><h2>实时频谱</h2></header>
        <div class="spectrum is-live" aria-hidden="true">
          <i
            v-for="(level, i) in p.spectrumLevels.value"
            :key="i"
            :style="{ '--height': `${Math.max(6, Math.round(level * 100))}%` }"
          />
        </div>
      </section>
    </div>
  </section>
</template>
