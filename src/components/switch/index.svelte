<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked = false;
  export let label = "";
  export let disabled = false;

  const dispatch = createEventDispatcher();
  const click = () => {
    if (!disabled) {
      checked = !checked;
      dispatch("toggle", checked);
    }
  };
</script>

<div class="w-switch">
  <input type="checkbox" class="w-checkbox" bind:checked />
  <label
    for="w-switch"
    class={'w-switch-toggle ' + (disabled ? 'w-switch-toggle-disabled' : '')}
    on:click={click} />
  <span class={'w-switch-label ' + (disabled ? 'w-switch-label-disabled' : '')}>
    {label}
  </span>
</div>
