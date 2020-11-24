<script lang="ts">
  import { highlight } from "../utility";
  import { Panel } from '../index';
  import Code from '../components/code/index.svelte';

</script>

<div class="w-title">Panel</div>

<Panel shadow={true}>
  This is a simple component, which is service as a base for elements, pictures. 
  <Code>
    {@html highlight('<Panel shadow={true}></Panel>')}
  </Code>
</Panel>

<Panel title="Simple panel">
  <Code>
    {@html highlight('<Panel title="Simple panel"></Panel>')}
  </Code>
</Panel>


<Panel title="Shadow panel" shadow={true}>
  <Code>
    {@html highlight('<Panel title="Shadow panel" shadow={true}></Panel>')}
  </Code>
</Panel>
