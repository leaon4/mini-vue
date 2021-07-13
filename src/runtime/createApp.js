import { render } from './render'
import { isFunction } from '../utils';
import { h } from './vnode'

export function createApp(rootComponent) {
    const app = {
        mount(rootContainer) {
            if (typeof rootContainer === 'string') {
                rootContainer = document.querySelector(rootContainer);
            }

            if (!isFunction(rootComponent.render) && !rootComponent.template) {
                rootComponent.template = rootContainer.innerHTML;
            }
            rootContainer.innerHTML = ''

            render(h(rootComponent), rootContainer);
        }
    };
    return app;
}
