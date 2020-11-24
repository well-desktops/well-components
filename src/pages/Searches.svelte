<script lang="ts">
  import { highlight } from "../utility";
  import { Search, Panel } from '../index';
</script>

<Panel title="Search" shadow={true}>
  <div class="w-grid w-grid-container-2-20">
    <Search label="Search" placeholder="Search" width={250}/>
    <Search label="Search disabled" placeholder="Search" disabled={true} />
  </div>

  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<Search label="Search" placeholder="Search" width={200}/>\n' +
    '<Search label="Phone disabled" placeholder="Search" disabled={true} />')}
  </div>
</Panel>


