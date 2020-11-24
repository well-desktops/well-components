<script lang="ts">
  import { highlight } from "../utility";
  import { Panel, Tabs } from '../index';
  import Code from '../components/code/index.svelte';

  const items = [
    { title: 'Tab 1', active: true },
    { title: 'Tab 2', active: false },
    { title: 'Tab 3', active: false },
    { title: 'Tab 4', active: false },
];
</script>

<Panel title="Tabs component">
  <p>
    Tabs component is implemnted as a container for one or more tabs.
  </p>
</Panel>

<br />
<Panel title="Simple Tabs" shadow={true}>

  <br>
  <Tabs {items} />

  <Code>
    {@html highlight(
      '<script> \n' +
      '   const items = [ \n' + 
      '     { title: "Tab 1", active: true }, \n' +
      '     { title: "Tab 2", active: false }, \n' +
      '     { title: "Tab 3", active: false }, \n' +
      '     { title: "Tab 4", active: false }, \n' +
      '   ]; \n' +
      '</script> \n\n' +
      '<Tabs {items} />')}
  </Code>
  
  <!-- <br>
  <strong>Code example:</strong>
  <div class="w-code">
    {@html highlight(
      '<script> \n' +
      '   const items = [ \n' + 
      '     { title: "Tab 1", active: true }, \n' +
      '     { title: "Tab 2", active: false }, \n' +
      '     { title: "Tab 3", active: false }, \n' +
      '     { title: "Tab 4", active: false }, \n' +
      '   ]; \n' +
      '</script> \n\n' +
      '<Tabs {items} />')}
  </div> -->
</Panel>
