<script lang="ts">
  import page from "page";
  import { router } from "./stores/index";
  import pages from './pages';
  import SideNavigation from "./components/sidenavigation/index.svelte";

  const title="Well Components";
  const routes = [
    { path: '/', title: 'Get Started', component: pages.GetStarted, topic: true },
    { path: 'https://github.com/well-desktops/well-components', title: 'GetHub', topic: true },
    { path: '#', title: 'Components', topic: true },
    { path: '/assets', title: 'Asset', component: pages.Assets },
    { path: '/assetslist', title: 'Asset List', component: pages.AssetsList },
    { path: '/button', title: 'Button', component: pages.Buttons },
    { path: '/checkbox', title: 'Checkbox', component: pages.Checkboxes },
    { path: '/divider', title: 'Divider', component: pages.Dividers },
    { path: '/grid', title: 'Grid', component: pages.Grids },
    { path: '/panel', title: 'Panel', component: pages.Panels },
    { path: '/search', title: 'Search', component: pages.Searches },
    { path: '/sidenavigation', title: 'Side Navigation', component: pages.SideNavigations },
    { path: '/switch', title: 'Switch', component: pages.Switches },
    { path: '/tabs', title: 'Tabs', component: pages.Tabs },
    { path: '/textfield', title: 'Text Field', component: pages.TextFields },
  ];

  // set default component
  let component = pages.GetStarted;

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
    <div class="w-logo">{title}</div>
    <SideNavigation currentRoute={$router} {routes} />
  </aside>
  <main>
    <svelte:component this={component} />
  </main>
</div>
