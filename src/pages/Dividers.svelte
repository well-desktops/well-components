<script lang="ts">
  import { highlight } from "../utility";
  import Panel from "../components/panel/index.svelte";
  import Divider from "../components/divider/index.svelte";
</script>

<Panel title="Divider vertical" shadow={true}>
  <div style="display: inline-block; margin: 10px">Text 1</div>
  <div style="display: inline-block;"><Divider type="vertical" /></div>
  <div style="display: inline-block; margin: 10px">Text 2</div>
  <div style="display: inline-block;"><Divider type="vertical" size="medium"/></div>
  <div style="display: inline-block; margin: 10px">Text 2</div>
  <div style="display: inline-block;"><Divider type="vertical" size="large" /></div>
  <div style="display: inline-block; margin: 10px">Text 2</div>
</Panel>

<Panel title="Divider standard" shadow={true}>
    <div>
    <Divider title="Small" />
    <br />
    <br />
  </div>

  <div>
    <Divider title="Medium" size="medium" />
    <br />
    <br />
  </div>

  <div>
    <Divider title="Large" size="large" />
    <br />
    <br />
  </div>

  <div>
    <Divider title="X Large" size="x-large" />
    <br />
    <br />
  </div>

  <div>
    <Divider title="XX Large" size="xx-large" />
    <br />
    <br />
    <h3>Code example:</h3>
    <div class="w-code">
      {@html highlight('<Divider title="Small"/>\n' + '<Divider title="Medium" size="medium"/>\n' + '<Divider title="Large" size="large"/>\n' + '<Divider title="X Large" size="x-large"/>\n' + '<Divider title="XX Large" size="xx-large"/>')}
    </div>
  </div>
</Panel>
