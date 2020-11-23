<script lang="ts">
  export let label = "";
  export let placeholder = "";
  export let disabled = false;
  export let value = "";
  export let valid: boolean;
  $: elClasses =
    "w-textfield" +
    (disabled ? " w-textfield-disabled" : "");
    // (valid === false ? " w-textfield-invalid" : "");

</script>

<div class={elClasses}>
  <div class="w-textfield-label">{label}</div>
  <input type="text" {placeholder} {disabled} {value} class:w-textfield-invalid={valid === false}/>
  {#if valid}<span class="w-textfield-icon icon-checkmark" />{/if}
  {#if valid === false}<span class="w-textfield-icon icon-alert" />{/if}
</div>
