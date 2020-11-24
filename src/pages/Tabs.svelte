<script lang="ts">
  import { highlight } from "../utility";
  import { Panel, Tabs } from '../index';
  import Code from '../components/code/index.svelte';
import type { bind } from "svelte/internal";

  let items = [
    { title: 'Tab 1', active: true },
    { title: 'Tab 2', active: false },
    { title: 'Tab 3', active: false },
    { title: 'Tab 4', active: false },
  ];

  let items1 = [
    { title: 'Tab 1', active: false, icon: 'icon-bell' },
    { title: 'Tab 2', active: true, icon: 'icon-chat'},
    { title: 'Tab 3', active: false, icon: 'icon-settings' },
    { title: 'Tab 4', active: false, icon: 'icon-help' },
  ];

  // const click = (event) => {
  //   console.log(event)
  //   items.forEach(t => t.active = event.detail === t.title);
  //   items = items;
  // }
  $: activeTab1 = items.filter(t => t.active);
  $: activeTab2 = items1.filter(t => t.active);
</script>

<div class="w-title">Tabs</div>

<Panel>
    Tabs component is implemnted as a container for one or more tabs.
</Panel>

<Panel title="Basic tabs" shadow={true}>
  <Tabs bind:items={items}/>
  <br><br>
  <strong>Active tab:</strong> {activeTab1[0].title}
  <br>
  <br>

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
      '<Tabs bind:items={items} />')}
  </Code>
</Panel>

<Panel title="Tabs with icons" shadow={true}>
  <Tabs bind:items={items1}  />
  <br>
  <br>
  <strong>Active tab:</strong> {activeTab2[0].title}
  <br>
  <br>
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
      '<Tabs bind:{items} />')}
  </Code>
</Panel>
