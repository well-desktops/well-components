<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // input props
  export let icon = '';
  export let title = '';
  export let secondary = false;
  export let disabled = false;

  // declare classes
  $: elClasses = 'w-button ' 
    + (secondary ? 'w-button-secondary' : 'w-button-primary')
    + (disabled ? ' w-button-disabled' : '');
  $: iconClasses = icon ? `w-button-icon ${icon}` : '';

  const dispatch = createEventDispatcher();
  const click = () => {
    if (!disabled) {
      dispatch('click', {
        text: 'Hello!'
      });
    }
  }
</script>

<div class={elClasses} on:click={click}>
  {#if icon}<span class={iconClasses} />{/if}
  {#if title}<span class="w-button-title">{title}</span>{/if}
</div>
