<script lang="ts">
  import Begriff from './Begriff.svelte';
  import { zerlegen } from './hilfetext';
  let { text }: { text: string } = $props();
</script>

{#each zerlegen(text) as teil}{#if teil.art === 'begriff'}<Begriff id={teil.id} text={teil.text} />{:else}{teil.text}{/if}{/each}
