<script lang="ts">
  export let label = "";
  export let placeholder = "";
  export let disabled = false;
  export let value = "";
  export let width= 200;
  $: elClasses =
    "w-search" +
    (disabled ? " w-textfield-search" : "");
</script>

<div class={elClasses} style="width: {width}px">
  <div class="w-search-label">{label}</div>
  <input type="text" {placeholder} {disabled} {value} />
  <span class="w-search-icon icon-search" />
  <span class="w-search-icon icon-close" style="left: {width - 40}px"/>
</div>
