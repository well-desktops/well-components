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

<div class="w-checkbox">
  <input type="checkbox" class="w-checkbox" bind:checked />
  <label
    for="w-checkbox"
    class={'w-checkbox-toggle ' + (disabled ? 'w-checkbox-toggle-disabled' : '')}
    on:click={click} />
  <span class={'w-checkbox-label ' + (disabled ? 'w-checkbox-label-disabled' : '')}>
    {label}
  </span>
</div>
