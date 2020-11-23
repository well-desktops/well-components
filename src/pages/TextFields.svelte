<script lang="ts">
  import { highlight } from "../utility";
  import { Panel, TextField } from "../index";
</script>

<Panel title="Standard Text Field">
  <TextField label="First Name" placeholder="Enter your name" />

  <br />
  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<TextField label="First Name" placeholder="Enter your name" />')}
  </div>
</Panel>

<Panel title="Disabled Text Field">
  <TextField label="Last Name" placeholder="Enter your name" disabled={true} />

  <br />
  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<TextField label="Last Name" placeholder="Enter your name" disabled={true}/>')}
  </div>
</Panel>

<Panel title="Valid Text Field">
  <div class="w-grid w-grid-container-2-16">
    <TextField label="Phone" value="178 35 456666" valid={true} />
    <TextField
      label="Phone disabled"
      value="178 35 4566366"
      valid={true}
      disabled={true} />
  </div>

  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<TextField label="Phone" value="178 35 456666" valid={true}/>\n' + '<TextField label="Phone disabled" value="178 35 4566366" valid={true} disabled={true} />')}
  </div>
</Panel>

<Panel title="Invalid Text Field">
  <div class="w-grid w-grid-container-2-16">
    <TextField label="Phone" value="178 35 456" valid={false} />
    <TextField
      label="Phone disabled"
      value="178 35 4566"
      valid={false}
      disabled={true} />
  </div>

  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<TextField label="Phone" value="178 35 456666" valid={false}/>\n' + '<TextField label="Phone disabled" value="178 35 4566366" valid={false} disabled={true} />')}
  </div>
</Panel>
