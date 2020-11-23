import { writable } from 'svelte/store';

const createRouter = () => {
  const { subscribe, update } = writable('');

  return {
    subscribe,
    setPath: (path: string) => update(p => p = path),
  };
}

export default createRouter;