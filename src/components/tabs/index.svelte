<script>
  import { createEventDispatcher } from 'svelte';
  
  export let items = [];
  
  const dispatch = createEventDispatcher();
  const click = (title) => {
    dispatch('click', title);
    items = items.map(t => {
      t.active = t.title === title;
      return t;
    });
  }
</script>

<div class="w-tabs">
  {#each items as { title, active, icon }}
    <div class="w-tab" class:active on:click={click(title)}>
      {#if icon}<span class:active class={'w-tabs-icon ' + icon} />{/if}
      <span class="w-tabs-title" style={icon ? 'padding-left: 5px' : ''}>
        {title}
      </span>
    </div>
  {/each}
</div>
<div>

  <slot />
</div>
