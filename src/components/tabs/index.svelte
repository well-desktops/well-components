<script lang="ts">
  export let items = [];
  // export let title = '';
  $: elClasses = "w-tabs ";
</script>

<div class={elClasses}>
  {#each items as { title, active }}
    <span class="w-tabs-title" class:active>
      {title}
      <!-- <div class:active></div> -->
    </span>
  {/each}
</div>
<div>
  <!-- <div class="w-panel-title">{title}</div> -->
  <!-- <br> -->
  <slot />
</div>
