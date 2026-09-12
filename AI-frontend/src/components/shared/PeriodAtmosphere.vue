<template>
  <div class="period-atm" aria-hidden="true">
    <div class="atm-wash" />
    <div class="atm-dots" />
    <div class="atm-glow" />
    <div class="atm-mist" />
    <div class="atm-sun" />
    <div class="atm-rays">
      <i v-for="n in 12" :key="'r' + n" />
    </div>
    <div class="atm-dusk" />
    <div class="atm-moon" />
    <div class="atm-stars">
      <i v-for="n in 12" :key="'s' + n" />
    </div>
    <div class="atm-birds">
      <i v-for="n in 3" :key="'b' + n" />
    </div>
  </div>
</template>
