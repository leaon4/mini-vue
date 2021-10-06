import { h, render } from '.';
import { isString } from '../utils';

export function createApp(rootComponent) {
  const app = {
    mount(rootContainer) {
      if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer);
      }
      render(h(rootComponent), rootContainer);
    },
  };
  return app;
}
