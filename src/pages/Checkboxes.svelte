<script lang="ts">
  import { highlight } from "../utility";
  import { Checkbox, Panel } from '../index';
  import Code from '../components/code/index.svelte';

  let checked = false;
  let checked2 = true;

</script>

<div class="w-title">Checkbox</div>

<Panel shadow={true}>
  Checkbox description
</Panel>

<Panel shadow={true}>
  <div class="w-grid w-grid-container-2-16">
    <Checkbox label="Switch {checked ? 'on' : 'off'}" bind:checked />
    <Checkbox label="Switch {checked2 ? 'on' : 'off'}" bind:checked={checked2} />
  </div>

</Panel>

