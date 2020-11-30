<script lang="ts">
  import { highlight } from "../utility";
  import { Asset, Panel } from "../index";
  import Code from "../components/code/index.svelte";
  import type { AssetState } from "../model";

  const assetImage: AssetState = {
    id: "1",
    type: "image",
    image: "images/example-ava.png",
    size: 30
  };
</script>

<div class="w-title">Asset</div>

<Panel shadow={true}>
  <p>
    Asset component helps to provide data as images or icons. Besides, it could
    be used as a predefined file or folder object:
  </p>

  <ul>
    <li>Use for displaying custom image/icon.</li>
    <li>Use for displaying predefined file icon.</li>
    <li>Use for displaying predefined folder icon.</li>
  </ul>
</Panel>

<Panel title="Image" shadow={true}>
  <Asset {...assetImage} />

  <Code>
    {@html highlight(
      'const assetImage: AssetState = { \n' +
      '   id: "1", \n' +
      '   type: "image",\n' +
      '   image: "images/example-ava.jpg", \n' +
      '} \n' +
      '<Asset {...assetImage} />'
    )}
  </Code>
</Panel>

<Panel title="File" shadow={true}>
  <Asset type="file" size={30} />
  <Code>
    {@html highlight('<Asset type="file" size={25} />')}
  </Code>
</Panel>

<Panel title="Folder" shadow={true}>
  <Asset type="folder" size={30} />
  <Code>
    {@html highlight('<Asset type="folder" size={25} />')}
  </Code>
</Panel>
