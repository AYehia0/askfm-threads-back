<script setup lang="ts">
    defineProps<{ msg: string }>()
</script>

<template>
  <h1>{{ msg }}</h1>
  <p>
    How does this thing work ?
    <a href="https://ayehia0.github.io/posts/askfm_reverse_engineering/" target="_blank"
      >more info</a
    >
  </p>
</template>
