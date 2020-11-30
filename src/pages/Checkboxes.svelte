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
    <Checkbox label="Checkbox {checked ? 'on' : 'off'}" bind:checked />
    <Checkbox label="Checkbox {checked2 ? 'on' : 'off'}" bind:checked={checked2} />
  </div>
  <div class="w-grid w-grid-container-2-16">
    <Checkbox label="Checkbox off (disabled)" checked={false} disabled={true} />
    <Checkbox label="Checkbox on (disabled)" checked={true} disabled={true} />
  </div>

  <Code>
    {@html highlight(
      'let checked = false;\n\n' + 
      '<Checkbox label="Checkbox {checked ? \'on\' : \'off\'}" bind:checked />\n' + 
      '<Checkbox label="Checkbox on (disabled)" checked={true} disabled={true} />')}
  </Code>

</Panel>

