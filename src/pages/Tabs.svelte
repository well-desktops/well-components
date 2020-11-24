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

  const items1 = [
    { title: 'Tab 1', active: false, icon: 'icon-bell' },
    { title: 'Tab 2', active: true, icon: 'icon-chat'},
    { title: 'Tab 3', active: false, icon: 'icon-settings' },
    { title: 'Tab 4', active: false, icon: 'icon-help' },
  ];
</script>

<Panel title="Tabs component">
  <p>
    Tabs component is implemnted as a container for one or more tabs.
  </p>
</Panel>

<Panel title="Basic tabs" shadow={true}>
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
</Panel>

<Panel title="Tabs with icons" shadow={true}>
  <Tabs items={items1} />
  <Code>
    {@html highlight(
      '<script> \n' +
      '   const items = [ \n' + 
      '     { title: "Tab 1", active: false, icon: "icon-bell" }, \n' +
      '     { title: "Tab 2", active: true, icon: "icon-chat" }, \n' +
      '     { title: "Tab 3", active: false, icon: "icon-settings" }, \n' +
      '     { title: "Tab 4", active: false, icon: "icon-help" }, \n' +
      '   ]; \n' +
      '</script> \n\n' +
      '<Tabs {items} />')}
  </Code>
</Panel>
