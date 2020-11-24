<script lang="ts">
  import { highlight } from "../utility";
  import { Divider, Panel } from "../index";
  import Code from "../components/code/index.svelte";
</script>

<div class="w-title">Divider</div>

<Panel title="Divider vertical" shadow={true}>
  <div style="display: inline-block; margin: 0px">Text 1</div>
  <div style="display: inline-block;">
    <Divider type="vertical" />
  </div>
  <div style="display: inline-block; margin: 10px">Text 2</div>
  <div style="display: inline-block;">
    <Divider type="vertical" size="medium" />
  </div>
  <div style="display: inline-block; margin: 10px">Text 2</div>
  <div style="display: inline-block;">
    <Divider type="vertical" size="large" />
  </div>
  <div style="display: inline-block; margin: 10px">Text 2</div>

  <Code>
    {@html highlight(
      '<Divider type="vertical" size="small" /> \n' +
      '<Divider type="vertical" size="medium" /> \n' +
      '<Divider type="vertical" size="large" /> '
    )}
  </Code>
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

  <Code>
    {@html highlight('<Divider title="Small"/>\n' + '<Divider title="Medium" size="medium"/>\n' + '<Divider title="Large" size="large"/>\n')}
  </Code>
</Panel>
