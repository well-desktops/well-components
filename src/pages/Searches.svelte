<script lang="ts">
  import { highlight } from "../utility";
  import { Search, Panel } from '../index';
  import Code from '../components/code/index.svelte';

</script>

<div class="w-title">Search</div>

<Panel shadow={true}>
  <div class="w-grid w-grid-container-2-20">
    <Search label="Search" placeholder="Search" width={250}/>
    <Search label="Search disabled" placeholder="Search" disabled={true} />
  </div>

  <Code>
    {@html highlight('<Search label="Search" placeholder="Search" width={200}/>\n' +
    '<Search label="Phone disabled" placeholder="Search" disabled={true} />')}
  </Code>
</Panel>

