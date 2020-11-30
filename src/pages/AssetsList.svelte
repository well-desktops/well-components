<script lang="ts">
  import { highlight } from "../utility";
  import { AssetList, Panel } from '../index';
  import Code from '../components/code/index.svelte';

  const items = [
    { id: '1', type: 'image', title: 'Kate Beckett', image: 'images/example-ava.png', size: 20, selected: true },
    { id: '2', type: 'file', title: 'Document.doc', size: 20, selected: false },
    { id: '3', type: 'folder', title: 'Components', size: 20, selected: false },
  ];
</script>

<div class="w-title">Asset List</div>

<Panel shadow={true}>
  <p>
    This is a selectable list of Assest components. 
  </p>
</Panel>

<Panel shadow={true}>
  <AssetList {items} />  

  <Code>
    {@html highlight(
      'const items = [\n' +
      "   { id: '1', type: 'image', title: 'Kate Beckett', image: 'images/example-ava.png', size: 20, selected: true },\n" +
      "   { id: '2', type: 'file', title: 'Document.doc', size: 20, selected: false },\n" +
      "    { id: '3', type: 'folder', title: 'Components', size: 20, selected: false },\n" +
      "} \n" +
      '<AssetList {items} />'
    )}
  </Code>

</Panel>

