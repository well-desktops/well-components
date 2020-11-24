<script lang="ts">
  import { highlight } from "../utility";
  import { Button, Panel } from '../index';
  import Code from '../components/code/index.svelte';

  const help = (event: CustomEvent) => {
    alert(event.detail.text);
  }
</script>

<div class="w-title">Button</div>

<Panel shadow={true}>
  <p>
    Basic component that is used to trigger bussiness logic. It also supports focus (mouse and keyboard separately), 
    hover and disabled states.
  </p>
  
    Button has two types:
    <ul>
      <li>
        Primary: more prominent, has no background color, with white or black text color.
      </li>
      <li>
        Secondary: less prominent, has a background, text color is the button color.
      </li>
    </ul>
</Panel>

<Panel title="Primary buttons" shadow={true}>
  <p>
    <Button icon="icon-help" on:click={help} />
    <Button icon="icon-settings" title="Settings" />
    <Button icon="icon-chat" title="Chat" disabled={true} on:click={help} />
    <Button title="Primary" on:click={help} />
  </p>

  <Code>
    {@html highlight(
      '<Button icon="icon-help" on:click={clickHandler} />\n' + 
      '<Button icon="icon-settings" title="Settings" />\n' + 
      '<Button icon="icon-chat" title="Chat" disabled={true} on:click={clickHandler} />\n' +
      '<Button title="Primary" on:click={clickHandler} />'
    )}
  </Code>

</Panel>

<Panel title="Secondary buttons" shadow={true}>
  <p>
    <Button secondary={true} title="Secondary" />
    <Button secondary={true} title="Disabled" disabled={true} />
    <Button secondary={true} icon="icon-bell" title="Bell" />
  </p>

  <Code>
    {@html highlight(
      '<Button secondary={true} title="Secondary" />\n' + 
      '<Button secondary={true} title="Disabled" disabled={true} />\n' + 
      '<Button secondary={true} icon="icon-bell" title="Bell" />')}
    </Code>
</Panel>
