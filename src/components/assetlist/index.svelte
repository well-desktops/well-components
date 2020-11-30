<script lang="ts">
  import Asset from "../asset/index.svelte";
  import Checkbox from "../checkbox/index.svelte";
  export let items = [];
</script>

<div class="w-assetlist">
  {#each items as { id, type, title, image, size, selected }}
      <div class="w-assetlist-grid">
      <div style="position: relative; top: 2px;"> <Checkbox bind:checked={selected} /></div>
        <div>
          <Asset {type} {size} {image} />
        </div>
        <div>{title}</div>
      </div>
  {/each}
</div>
