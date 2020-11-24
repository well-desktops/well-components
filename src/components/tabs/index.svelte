<script lang="ts">
  export let items = [];
  // export let title = '';
  $: elClasses = "w-tabs ";
</script>

<div class={elClasses}>
  {#each items as { title, active, icon }}
    <div class="w-tab">
      {#if icon}<span class:active class={'w-tabs-icon ' + icon} />{/if}
      <span
        class="w-tabs-title"
        class:active
        style={icon ? 'padding-left: 25px' : ''}>
        {title}
      </span>
    </div>
  {/each}
</div>
<div>
  <!-- <div class="w-panel-title">{title}</div> -->
  <!-- <br> -->
  <slot />
</div>
