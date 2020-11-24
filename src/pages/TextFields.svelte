<script lang="ts">
  import { highlight } from "../utility";
  import { Panel, TextField } from "../index";
  import Code from '../components/code/index.svelte';
</script>

<div class="w-title">Text Field</div>

<Panel title="Standard Text Field" shadow={true}>
  <div>
    <TextField label="First Name" placeholder="Enter your name" />
  </div>

  <Code>
    {@html highlight('<TextField label="First Name" placeholder="Enter your name" />')}
  </Code>
</Panel>

<Panel title="Disabled Text Field" shadow={true}>
  <TextField label="Last Name" placeholder="Enter your name" disabled={true} />

  <Code>
    {@html highlight('<TextField label="Last Name" placeholder="Enter your name" disabled={true}/>')}
  </Code>
</Panel>

<Panel title="Valid Text Field" shadow={true}>
  <div class="w-grid w-grid-container-2-16">
    <TextField label="Phone" value="178 35 456666" valid={true} />
    <TextField
      label="Phone disabled"
      value="178 35 4566366"
      valid={true}
      disabled={true} />
  </div>

  <Code>
    {@html highlight('<TextField label="Phone" value="178 35 456666" valid={true}/>\n' + '<TextField label="Phone disabled" value="178 35 4566366" valid={true} disabled={true} />')}
  </Code>
</Panel>

<Panel title="Invalid Text Field" shadow={true}>
  <div class="w-grid w-grid-container-2-16">
    <TextField label="Phone" value="178 35 456" valid={false} />
    <TextField
      label="Phone disabled"
      value="178 35 4566"
      valid={false}
      disabled={true} />
  </div>

  <Code>
    {@html highlight('<TextField label="Phone" value="178 35 456666" valid={false}/>\n' + '<TextField label="Phone disabled" value="178 35 4566366" valid={false} disabled={true} />')}
  </Code>
</Panel>
