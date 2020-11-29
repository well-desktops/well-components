<script lang="ts">
  import { highlight } from "../utility";
  import { Asset, Panel } from '../index';
  import Code from '../components/code/index.svelte';

</script>

<div class="w-title">Asset</div>

<Panel shadow={true}>
  <p>
    Assests component helps to provide data as images or icons as picture. Besides, it could used as file or folder object.
  </p>
</Panel>

<Panel title="Image" shadow={true}>
  <Asset image="images/example-ava.jpg" size={50} />

  <Code>
    {@html highlight('<Asset image="images/example-ava.jpg" size={50} />')}
  </Code>
</Panel>

<Panel title="File" shadow={true}>
  <Asset type="file" size={25} />
  <Code>
    {@html highlight('<Asset type="file" size={25} />')}
  </Code>
</Panel>

<Panel title="Folder" shadow={true}>
  <Asset type="folder" size={25} />
  <Code>
    {@html highlight('<Asset type="folder" size={25} />')}
  </Code>
</Panel>

