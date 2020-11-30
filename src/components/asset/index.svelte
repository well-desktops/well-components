<script lang="ts">
  export let image: string;
  export let size: number;
  export let type: string;
  // export let title: string;
  $: elStyles =
    // "max-width: 75%; max-height: 75%; object-fit: contain;" +
    (size ? `width: ${size}px; height: ${size}px;` : "width: 50px;");
</script>

<div class="w-asset" style={elStyles}>
  {#if type === 'file'}
    <svg
      x="0px"
      y="0px"
      viewBox="2 2 66 66"
      class="w-asset-file"
      style={elStyles}>
      <g>
        <path
          d="M39.8,6.5c-1-1-2.4-1.5-3.8-1.5H21c-5.2,0-9.5,4.3-9.5,9.5v37c0,5.2,4.3,9.5,9.5,9.5h24c5.2,0,9.5-4.3,9.5-9.5V22.7   c0-1.5-0.6-3-1.7-4L39.8,6.5z M49.2,19.5h-7.6c-1.4,0-2.5-1.1-2.5-2.5v-7L49.2,19.5z M51.5,51.5c0,3.6-2.9,6.5-6.5,6.5H21   c-3.6,0-6.5-2.9-6.5-6.5v-37c0-3.6,2.9-6.5,6.5-6.5h15c0,0,0.1,0,0.1,0v9c0,3,2.5,5.5,5.5,5.5h9.9c0,0.1,0,0.1,0,0.2V51.5z" />
      </g>
    </svg>
  {:else if type === 'folder'}
    <svg
      viewBox="0 0 48 48"
      x="0px"
      y="0px" class="w-asset-folder" style={elStyles}>
        <path
          d="M41.25,10.78467H22.44336L18.36914,5.94092a1.00127,1.00127,0,0,0-.76562-.35645H3.15918a.99974.99974,0,0,0-1,1V37.82471A4.5962,4.5962,0,0,0,6.75,42.41553h34.5a4.5962,4.5962,0,0,0,4.59082-4.59082V15.375A4.59578,4.59578,0,0,0,41.25,10.78467ZM4.15918,7.58447H17.1377l2.69238,3.2002H4.15918ZM43.84082,37.82471A2.59359,2.59359,0,0,1,41.25,40.41553H6.75a2.59359,2.59359,0,0,1-2.59082-2.59082v-25.04H41.25A2.59349,2.59349,0,0,1,43.84082,15.375Z" />
    </svg>
  {:else}
    <img
      class="w-asset-image"
      src={image}
      style={elStyles}
      alt="Asset images" />
  {/if}

  <!-- {#if title}
    <span class="w-asset-title">
      {title}
    </span>
  {/if} -->
  </div>
