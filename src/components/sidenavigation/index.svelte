<script lang="ts">
  export let routes: [];
  export let currentRoute: string;
</script>

<div class="w-sidebar">
  {#each routes as { path, title, topic }}
    <a
      href={path}
      class="w-sidebar-link"
      class:w-sidebar-link-active={currentRoute === path}
      class:w-sidebar-link-topic={topic === true}>
      {title}
    </a>
  {/each}
</div>
