<script lang="ts">
  import { highlight } from "../utility";
  import { Divider, Panel } from '../index';
</script>

<Panel title="Grid">
  <div class="w-grid w-grid-container-2-4">
    <div>C1</div>
    <div>C2</div>
  </div>
  <br />
  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<div class="w-grid w-grid-container-2-4">\n\t<div>C1</div>\n\t<div>C2</div>\n</div>')}
  </div>
  <Divider />

  <div class="w-grid w-grid-container-2-8">
    <div>Column 1</div>
    <div>Column 2</div>
  </div>
  <br />
  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<div class="w-grid w-grid-container-2-8">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>')}
  </div>
  <Divider />

  <div class="w-grid w-grid-container-2-12">
    <div>Column 1</div>
    <div>Column 2</div>
  </div>
  <br />
  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<div class="w-grid w-grid-container-2-12">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>')}
  </div>
  <Divider />
  <div class="w-grid w-grid-container-2-16">
    <div>Column 1</div>
    <div>Column 2</div>
  </div>
  <br />
  <h3>Code example:</h3>
  <div class="w-code">
    {@html highlight('<div class="w-grid w-grid-container-2-16">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>')}
  </div>
  <Divider />
</Panel>
