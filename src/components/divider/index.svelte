<script lang="ts">
  export let title = "";
  export let size = "small";
  export let type = "horizontal";
  $: elClassesH =
    size === "medium"
      ? " w-divider-medium"
      : size === "large"
      ? " w-divider-large"
      : " w-divider-small";
  $: elClassesV =
    size === "medium"
      ? " w-divider-vertical-medium"
      : size === "large"
      ? " w-divider-vertical-large"
      : " w-divider-vertical-small";
</script>

<div class="w-divider">
  {#if type === 'horizontal'}
    {#if title}
      <div class="w-divider-title">{title}</div>
    {/if}
    <div class={elClassesH} />
  {/if}
  {#if type === 'vertical'}
    <span class={elClassesV} />
  {/if}

</div>
