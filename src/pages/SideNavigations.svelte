<script lang="ts">
  import { highlight } from "../utility";
  import { Search, Panel, SideNavigation } from '../index';
  import Code from '../components/code/index.svelte';

  const routes1 = [
    { path: '#1', title: 'Section 1', component: null },
    { path: '#2', title: 'Section 2', component: null },
    { path: '#3', title: 'Section 3', component: null },
    { path: '#4', title: 'Section 4', component: null },
  ];
  const routes2 = [
    { path: '#1', title: 'Section Title 1', component: null, topic: true },
    { path: '#2', title: 'Section Title 2', component: null, topic: true },
    { path: '#3', title: 'Section 1', component: null },
    { path: '#4', title: 'Section 2', component: null },
    { path: '#5', title: 'Section 3', component: null },
    { path: '#6', title: 'Section 4', component: null },
  ];
  let currentRoute;

</script>

<div class="w-title">Side Navigation</div>

<Panel shadow={true}>
  The side navigation component is designed to add side content to a fullscreen app. 
</Panel>

<Panel title="Standard usage" shadow={true}>
  <SideNavigation routes={routes1} currentRoute="#1" />

  <br>
  <Code>
    {@html highlight(
      '<script> \n' +
      '   let currentRoute;\n' +
      '   const routes = [ \n' +
      '     { path: "#", title: "Section 1", component: Component3 }, \n' +
      '     { path: "#", title: "Section 2", component: Component4 }, \n' +
      '     { path: "#", title: "Section 3", component: Component5 }, \n' +
      '     { path: "#", title: "Section 4", component: Component6 }, \n' +
      ' ]; \n' +
      '</script> \n\n' +
      '<SideNavigation {routes} {currentRoute}/>')}
  </Code>
</Panel>

<Panel title="Multilevel usage" shadow={true}>
  <SideNavigation routes={routes2} currentRoute="#4"/>

  <br>
  <Code>
    {@html highlight(
      '<script> \n' +
      ' let currentRoute;\n' +
      ' const routes = [ \n' +
      '     { path: "#", title: "Section Title 1", component: Component1, topic: true }, \n' +
      '     { path: "#", title: "Section Title 2", component: Component2, topic: true }, \n' +
      '     { path: "#", title: "Section 1", component: Component3 }, \n' +
      '     { path: "#", title: "Section 2", component: Component4 }, \n' +
      '     { path: "#", title: "Section 3", component: Component5 }, \n' +
      '     { path: "#", title: "Section 4", component: Component6 }, \n' +
      ']; \n' +
      '</script> \n\n' +
      '<SideNavigation {routes} {currentRoute}/>')}
  </Code>
</Panel>
