<script lang="ts">
  import page from "page";
  import { router } from "./stores/index";
  import pages from './pages';
  import Sidebar from "./components/sidebar/index.svelte";

  const title="Components Library";
  const routes = [
    { path: '/', title: 'Button', component: pages.Buttons },
    { path: '/divider', title: 'Divider', component: pages.Dividers },
    { path: '/grid', title: 'Grid', component: pages.Grids },
    { path: '/panel', title: 'Panel', component: pages.Panels },
    { path: '/search', title: 'Search', component: pages.Searches },
    { path: '/switch', title: 'Switch', component: pages.Switches },
    { path: '/textfield', title: 'Text Field', component: pages.TextFields },
  ];

  // set default component
  let component = pages.Buttons;

  // Map routes to page. If a route is hit the current
  // reference is set to the route's component
  routes.forEach(route => {
    page(route.path, () => {
      router.setPath(route.path);
      component = route.component;
    });
  })

  // activate router
  page.start();
</script>

<div class="w-container">
  <aside>
    <Sidebar {title} {routes} />
  </aside>
  <main>
    <svelte:component this={component} />
  </main>
</div>
