<script lang="ts">
  import { highlight } from "../utility";
  import { Panel } from '../index';
  import Code from '../components/code/index.svelte';

</script>

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
