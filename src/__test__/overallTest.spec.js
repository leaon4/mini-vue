import { MiniVue } from '../index';
const { createApp, reactive, nextTick, ref } = MiniVue;

let root;
beforeEach(() => {
  root = document.createElement('div');
});

describe('v-model', () => {
  test('input[type = text]', async () => {
    const template = `
            <div>{{model.text}}</div>
            <input v-model="model.text" />
        `;
    const model = reactive({
      text: 'text',
    });
    createApp({
      template: template.trim(),
      setup() {
        return {
          model,
        };
      },
    }).mount(root);
    const [div, input] = root.children;
    expect(div.textContent).toBe('text');
    expect(input.value).toBe('text');

    const e = new Event('input');
    input.value = 'tex';
    input.dispatchEvent(e);
    await nextTick();
    expect(div.textContent).toBe('tex');

    model.text = 'te';
    await nextTick();
    expect(input.value).toBe('te');

    model.text = '';
    await nextTick();
    expect(input.value).toBe('');
  });

  test('input[type = radio]', async () => {
    const template = `
            <div>{{model.radio}}</div>
            <input name="radio" type="radio" value="first" v-model="model.radio" />
            <input name="radio" type="radio" value="second" v-model="model.radio" />
        `;
    const model = reactive({
      radio: 'second',
    });
    createApp({
      template: template.trim(),
      setup() {
        return {
          model,
        };
      },
    }).mount(root);
    const [div, r1, r2] = root.children;
    expect(div.textContent).toBe('second');
    expect(r1.checked).toBe(false);
    expect(r2.checked).toBe(true);

    r1.click();
    // 真实web中，直接click有效，但在这里必须要补个dispatchEvent
    const e = new Event('change');
    r1.dispatchEvent(e);
    await nextTick();
    expect(div.textContent).toBe('first');
    expect(r1.checked).toBe(true);
    expect(r2.checked).toBe(false);

    model.radio = 'second';
    await nextTick();
    expect(div.textContent).toBe('second');
    expect(r1.checked).toBe(false);
    expect(r2.checked).toBe(true);
  });

  test('input[type = checkbox], bind array value', async () => {
    const template = `
            <div>{{model.checkbox.toString()}}</div>
            <input name="checkbox" type="checkbox" value="one" v-model="model.checkbox" />
            <input name="checkbox" type="checkbox" value="two" v-model="model.checkbox" />
            <input name="checkbox" type="checkbox" value="three" v-model="model.checkbox" />
        `;
    const model = reactive({
      checkbox: ['two'],
    });
    createApp({
      template: template.trim(),
      setup() {
        return {
          model,
        };
      },
    }).mount(root);
    const [div, c1, c2, c3] = root.children;
    expect(div.textContent).toBe('two');
    expect(c1.checked).toBe(false);
    expect(c2.checked).toBe(true);
    expect(c3.checked).toBe(false);

    c2.click();
    const e = new Event('change');
    c2.dispatchEvent(e);
    await nextTick();
    expect(div.textContent).toBe('');
    expect(c1.checked).toBe(false);
    expect(c2.checked).toBe(false);
    expect(c3.checked).toBe(false);

    c1.click();
    c3.click();
    c1.dispatchEvent(e);
    c3.dispatchEvent(e);
    await nextTick();
    expect(div.textContent).toBe('one,three');
    expect(c1.checked).toBe(true);
    expect(c2.checked).toBe(false);
    expect(c3.checked).toBe(true);

    model.checkbox.push('two');
    await nextTick();
    expect(div.textContent).toBe('one,three,two');
    expect(c1.checked).toBe(true);
    expect(c2.checked).toBe(true);
    expect(c3.checked).toBe(true);

    model.checkbox = ['one'];
    await nextTick();
    expect(div.textContent).toBe('one');
    expect(c1.checked).toBe(true);
    expect(c2.checked).toBe(false);
    expect(c3.checked).toBe(false);
  });

  test('input[type = checkbox], bind boolean value', async () => {
    const template = `
            <div>{{model.checkbox.toString()}}</div>
            <input type="checkbox" v-model="model.checkbox" />
        `;
    const model = reactive({
      checkbox: true,
    });
    createApp({
      template: template.trim(),
      setup() {
        return {
          model,
        };
      },
    }).mount(root);
    const [div, c1] = root.children;
    expect(div.textContent).toBe('true');
    expect(c1.checked).toBe(true);

    c1.click();
    const e = new Event('change');
    c1.dispatchEvent(e);
    await nextTick();
    expect(div.textContent).toBe('false');
    expect(c1.checked).toBe(false);

    model.checkbox = true;
    await nextTick();
    expect(div.textContent).toBe('true');
    expect(c1.checked).toBe(true);
  });

  test('input[type = checkbox], bind boolean value', async () => {
    const template = `
            <input v-for="(item,i) in model" type="checkbox" v-model="model[i]"/>
        `;
    const model = reactive([false, false, false]);
    createApp({
      template: template.trim(),
      setup() {
        return {
          model,
        };
      },
    }).mount(root);
    // eslint-disable-next-line prefer-const
    let [c1, c2, c3] = root.children;
    expect(c1.checked).toBe(false);
    expect(c2.checked).toBe(false);
    expect(c3.checked).toBe(false);

    c1.click();
    const e = new Event('change');
    c1.dispatchEvent(e);
    model.shift();
    await nextTick();
    [c1, c2] = root.children;
    expect(root.children.length).toBe(2);
    expect(c1.checked).toBe(false);
    expect(c2.checked).toBe(false);
  });
});

test('native event with vue event', () => {
  const template = `
        <button onclick="nativeEvent()" @click="vueEvent">click</button>
    `;
  window.nativeEvent = jest.fn();
  const vueEvent = jest.fn();
  createApp({
    template: template.trim(),
    setup() {
      return {
        vueEvent,
      };
    },
  }).mount(root);

  root.children[0].click();
  expect(window.nativeEvent).toHaveBeenCalledTimes(1);
  expect(vueEvent).toHaveBeenCalledTimes(1);
});

test('v-html', async () => {
  const template = `
        <div v-html="output.value">will not show</div>
    `;
  const output = ref('hello');
  createApp({
    template: template.trim(),
    setup() {
      return {
        output,
      };
    },
  }).mount(root);
  const div = root.children[0];
  expect(div.innerHTML).toBe('hello');

  output.value = '<ul><li>a</li></ul>';
  await nextTick();
  expect(div.innerHTML).toBe('<ul><li>a</li></ul>');
});
