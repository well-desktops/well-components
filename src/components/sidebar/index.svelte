<script lang="ts">
  import { router } from "../../stores/index";
  export let title: string;
  export let routes: [];
</script>

<div class="w-logo">{title}</div>
<div class="w-sidebar">
  {#each routes as { path, title }}
    <a
      href={path}
      class="w-sidebar-link"
      class:w-sidebar-link-active={$router === path}>{title}</a>
  {/each}
</div>
