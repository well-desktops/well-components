<script lang="ts">
  import { highlight } from "../utility";
  import { Panel } from '../index';
</script>

<Panel title="Simple panel">
  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<Panel title="Simple panel"></Panel>')}
  </div>
</Panel>

<br />
<Panel title="Shadow panel" shadow={true}>
  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<Panel title="Shadow panel" shadow={true}></Panel>')}
  </div>
</Panel>
