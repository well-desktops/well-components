<script lang="ts">
  import { highlight } from "../utility";
  import { Divider, Panel } from '../index';
  import Code from '../components/code/index.svelte';

</script>

<style lang="scss">
.example {
  border: 1px solid #ccc;
}  

</style>
<div class="w-title">Grid</div>

<Panel shadow={true}>
  <p>
    This an element which is help for building "grid" composition of the HTML elements. Each "div" element should contain a special style class such, as 
    w-grid-container-2-4 or w-grid-container-2-16. Where 2 is number of columns and 16 is a width in .em units between components.
  </p>
</Panel>

<Panel title="Two columns grid" shadow={true}>

  <div class="w-grid w-grid-container-2-8">
    <div>Column 1</div>
    <div>Column 2</div>
  </div>
  <Divider />

  <div class="w-grid w-grid-container-2-12">
    <div>Column 1</div>
    <div>Column 2</div>
  </div>
  
  <Divider />
  <div class="w-grid w-grid-container-2-16">
    <div>Column 1</div>
    <div>Column 2</div>
  </div>
  
  <Code>
    {@html highlight('<div class="w-grid w-grid-container-2-16">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>')}
  </Code>
  
</Panel>

<Panel title="Three columns grid" shadow={true}>
  <div class="w-grid w-grid-container-3-8">
    <div>Column 1</div>
    <div>Column 2</div>
    <div>Column 3</div>
  </div>
  
  <Divider />

  <div class="w-grid w-grid-container-3-12">
    <div>Column 1</div>
    <div>Column 2</div>
    <div>Column 3</div>
  </div>
  
  <Divider />
  <div class="w-grid w-grid-container-3-16">
    <div>Column 1</div>
    <div>Column 2</div>
    <div>Column 3</div>
  </div>
  
  <Code>
    {@html highlight('<div class="w-grid w-grid-container-3-16">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n\t<div>Column 3</div>\n</div>')}
  </Code>
  
</Panel>
