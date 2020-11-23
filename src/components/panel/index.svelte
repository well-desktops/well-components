<script lang="ts">
  export let shadow = false;
  export let title = '';
  $: elClasses = 'w-panel ' + (shadow ? ' w-panel-shadow' : '');
</script>

<div class={elClasses}>
  <div class="w-panel-title">{title}</div>
  <br>
  <slot></slot>
</div>
