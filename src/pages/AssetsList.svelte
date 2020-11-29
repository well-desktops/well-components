<script lang="ts">
  import { highlight } from "../utility";
  import { Button, Panel } from '../index';
  import Code from '../components/code/index.svelte';

  const help = (event: CustomEvent) => {
    alert(event.detail.text);
  }
</script>

<div class="w-title">Asset List</div>

<Panel shadow={true}>
  <p>
    This is a selectable list of Assests component. 
  </p>
  
</Panel>

