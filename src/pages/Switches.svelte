<script lang="ts">
  import { highlight } from "../utility";
  import { Switch, Panel } from "../index";
  import Code from '../components/code/index.svelte';


  let checked = false;
  let checked2 = true;
</script>

<div class="w-title">Switch</div>

<Panel shadow={true}>
  <div class="w-grid w-grid-container-2-16">
    <Switch label="Switch {checked ? 'on' : 'off'}" bind:checked />
    <Switch label="Switch {checked2 ? 'on' : 'off'}" bind:checked={checked2} />
  </div>
  <div class="w-grid w-grid-container-2-16">
    <Switch label="Switch off (disabled)" checked={false} disabled={true} />
    <Switch label="Switch on (disabled)" checked={true} disabled={true} />
  </div>

  <Code>
    {@html highlight('<Switch label="Switch {checked1 ? "on" : "off"}" bind:checked />\n' + '<Switch label="Switch on (disabled)" checked={true} disabled={true} />')}
  </Code>
</Panel>
