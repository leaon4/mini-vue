(() => {
  'use strict';
  function e(e) {
    return 'object' == typeof e && null !== e;
  }
  function t(e) {
    return 'function' == typeof e;
  }
  function n(e) {
    return Array.isArray(e);
  }
  function r(e, t) {
    return e !== t && (e == e || t == t);
  }
  const o = /-(\w)/g;
  function s(e) {
    return e.replace(o, (e, t) => (t ? t.toUpperCase() : ''));
  }
  const l = 'ROOT',
    c = 'ELEMENT',
    i = 'TEXT',
    u = 'SIMPLE_EXPRESSION',
    a = 'INTERPOLATION',
    f = 'ATTRIBUTE',
    p = 'ELEMENT';
  function h(e) {
    const t = e
      .split(',')
      .reduce((e, t) => ((e[t] = !0), e), Object.create(null));
    return (e) => !!t[e];
  }
  const d = h(
      'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr'
    ),
    g = h(
      'html,body,base,head,link,meta,style,title,address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot'
    );
  function y(e) {
    const t = [];
    for (; !m(e); ) {
      const n = e.source;
      let r;
      (r = n.startsWith(e.options.delimiters[0])
        ? v(e)
        : '<' === n[0]
        ? $(e)
        : k(e)),
        t.push(r);
    }
    let n = !1;
    for (let e = 0; e < t.length; e++) {
      const r = t[e];
      if (r.type === i)
        if (/[^\t\r\n\f ]/.test(r.content))
          r.content = r.content.replace(/[\t\r\n\f ]+/g, ' ');
        else {
          const o = t[e - 1],
            s = t[e + 1];
          !o || !s || (o.type === c && s.type === c && /[\r\n]/.test(r.content))
            ? ((n = !0), (t[e] = null))
            : (r.content = ' ');
        }
    }
    return n ? t.filter(Boolean) : t;
  }
  function m(e) {
    const t = e.source;
    return t.startsWith('</') || !t;
  }
  function v(e) {
    const [t, n] = e.options.delimiters;
    b(e, t.length);
    const r = e.source.indexOf(n),
      o = x(e, r).trim();
    return (
      b(e, n.length),
      { type: a, content: { type: u, isStatic: !1, content: o } }
    );
  }
  function b(e, t) {
    const { source: n } = e;
    e.source = n.slice(t);
  }
  function x(e, t) {
    const n = e.source.slice(0, t);
    return b(e, t), n;
  }
  function k(e) {
    const t = ['<', e.options.delimiters[0]];
    let n = e.source.length;
    for (let r = 0; r < t.length; r++) {
      const o = e.source.indexOf(t[r], 1);
      -1 !== o && n > o && (n = o);
    }
    const r = x(e, n);
    return { type: i, content: r };
  }
  function $(e) {
    const t = T(e);
    return (
      t.isSelfClosing ||
        e.options.isVoidTag(t.tag) ||
        ((t.children = y(e)), T(e)),
      t
    );
  }
  function T(e) {
    const t = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(e.source),
      n = t[1];
    b(e, t[0].length), w(e);
    let { props: r, directives: o } = (function (e) {
        const t = [],
          n = [];
        for (
          ;
          e.source.length &&
          !e.source.startsWith('>') &&
          !e.source.startsWith('/>');

        ) {
          const r = S(e);
          r.type === f ? t.push(r) : n.push(r), w(e);
        }
        return { props: t, directives: n };
      })(e),
      s = e.source.startsWith('/>');
    b(e, s ? 2 : 1);
    let l = (function (e, t) {
      const { options: n } = t;
      return !(!n.isNativeTag || n.isNativeTag(e));
    })(n, e)
      ? 'COMPONENT'
      : p;
    return {
      type: c,
      tag: n,
      tagType: l,
      props: r,
      directives: o,
      isSelfClosing: s,
      children: [],
    };
  }
  function w(e) {
    const t = /^[\t\r\n\f ]+/.exec(e.source);
    t && b(e, t[0].length);
  }
  function S(e) {
    const t = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(e.source)[0];
    let n;
    if (
      (b(e, t.length),
      w(e),
      '=' === e.source[0] &&
        (b(e, 1),
        w(e),
        (n = (function (e) {
          const t = e.source[0];
          b(e, 1);
          const n = e.source.indexOf(t);
          let r = x(e, n);
          return b(e, 1), { content: r };
        })(e)),
        w(e)),
      /^(v-|:|@)/.test(t))
    ) {
      let e, r, o;
      return (
        ':' === t[0]
          ? ((e = 'bind'), (r = t.slice(1)))
          : '@' === t[0]
          ? ((e = 'on'), (r = t.slice(1)))
          : t.startsWith('v-') && ([e, r] = t.slice(2).split(':')),
        r && (o = { type: u, content: s(r), isStatic: !0 }),
        {
          type: 'DIRECTIVE',
          name: e,
          exp: n && { type: u, content: n.content, isStatic: !1 },
          arg: o,
        }
      );
    }
    return { type: f, name: t, value: n && { type: i, content: n.content } };
  }
  function _(e, t) {
    switch (e.type) {
      case l:
        if (e.children.length > 1) {
          let t = E(e);
          return e.children.length > 1 ? `[${t}]` : t;
        }
        if (1 === e.children.length) return _(e.children[0], e);
        break;
      case c:
        return C(e, t);
      case i:
        return N(e);
      case a:
        return N(e.content);
    }
  }
  function E(e) {
    const { children: t } = e;
    if (!t.length) return;
    if (1 === t.length) {
      const e = t[0];
      if (e.type === i) return JSON.stringify(e.content);
      if (e.type === a) return e.content.content;
    }
    let n = [];
    for (let r = 0; r < t.length; r++) {
      const o = t[r];
      n.push(_(o, e));
    }
    return n.join(', ');
  }
  function C(e, t) {
    let n = M(e.directives, 'if') || M(e.directives, 'else-if');
    if (n) {
      const r = C(e, t);
      let o;
      if (t) {
        const { children: n } = t;
        let r = n.findIndex((t) => t === e) + 1;
        for (; r < n.length; r++) {
          const e = n[r];
          if (e.type !== i || e.content.trim().length) {
            if (e.type === c) {
              let s = n[r];
              (M(e.directives, 'else') || M(e.directives, 'else-if', !1)) &&
                ((o = C(s, t)), n.splice(r, 1));
            }
            break;
          }
          n.splice(r, 1), r--;
        }
      }
      const { exp: s } = n;
      return `${s.content} ? ${r} : ${o || N()}`;
    }
    let r = M(e.directives, 'for');
    if (r) {
      const { exp: t } = r,
        [n, o] = t.content.split(/\sin\s|\sof\s/);
      return `h(Fragment, null, renderList(${o.trim()}, ${n.trim()} => ${C(
        e
      )}))`;
    }
    return (function (e) {
      const { children: t, props: n, directives: r } = e,
        o = e.tagType === p ? `"${e.tag}"` : `resolveComponent("${e.tag}")`,
        s = M(r, 'model'),
        l = [
          ...n.map((e) => `${e.name}: ${O(e.value)}`),
          ...r.map((e) => {
            const t = e.arg?.content;
            switch (e.name) {
              case 'bind':
                return `${t}: ${O(e.exp)}`;
              case 'on':
                const n = `on${t[0].toUpperCase()}${t.slice(1)}`;
                let r = e.exp.content;
                return (
                  /\([^)]*?\)$/.test(r) &&
                    !r.includes('=>') &&
                    (r = `$event => (${r})`),
                  `${n}: ${r}`
                );
              case 'html':
                return `innerHTML: ${O(e.exp)}`;
              default:
                return `${e.name}: ${O(e.exp)}`;
            }
          }),
        ];
      let i = l.length ? `{ ${l.join(', ')} }` : 'null';
      if (
        (s &&
          (i = `withModel(${o}, ${i}, () => ${O(s.exp)}, value => ${O(
            s.exp
          )} = value)`),
        !t.length)
      )
        return 'null' === i ? `h(${o})` : `h(${o}, ${i})`;
      let u = E(e);
      return (
        (t.length > 1 || t[0].type === c) && (u = `[${u}]`),
        `h(${o}, ${i}, ${u})`
      );
    })(e);
  }
  function M(e, t, n = !0) {
    const r = e.findIndex((e) => e.name === t),
      o = e[r];
    return n && r > -1 && e.splice(r, 1), o;
  }
  function N(e) {
    return `h(Text, null, ${O(e)})`;
  }
  function O({ content: e = '', isStatic: t = !0 } = {}) {
    return t ? JSON.stringify(e) : e;
  }
  function A(e) {
    return (
      (t = y(
        (function (e) {
          return {
            options: { delimiters: ['{{', '}}'], isVoidTag: d, isNativeTag: g },
            source: e,
          };
        })(e)
      )),
      `\nwith (ctx) {\n    const { h, Text, Fragment, renderList, resolveComponent, withModel } = MiniVue\n    return ${_(
        {
          type: l,
          children: t,
          helpers: [],
          components: [],
          directives: [],
          hoists: [],
          imports: [],
          cached: 0,
          temps: 0,
        }
      )}\n}`
    );
    var t;
  }
  const L = [];
  let j;
  function F(e, t = {}) {
    const n = () => {
      try {
        return L.push(n), (j = n), e();
      } finally {
        L.pop(), (j = L[L.length - 1]);
      }
    };
    return t.lazy || n(), (n.scheduler = t.scheduler), n;
  }
  const R = new WeakMap();
  function I(e, t) {
    if (!j) return;
    let n = R.get(e);
    n || R.set(e, (n = new Map()));
    let r = n.get(t);
    r || n.set(t, (r = new Set())), r.add(j);
  }
  function W(e, t) {
    const n = R.get(e);
    if (!n) return;
    const r = n.get(t);
    r &&
      r.forEach((e) => {
        e.scheduler ? e.scheduler(e) : e();
      });
  }
  const B = new WeakMap();
  function P(t) {
    if (!e(t)) return t;
    if (V(t)) return t;
    if (B.has(t)) return B.get(t);
    const o = new Proxy(t, {
      get(t, n, r) {
        if ('__isReactive' === n) return !0;
        I(t, n);
        const o = Reflect.get(t, n, r);
        return e(o) ? P(o) : o;
      },
      set(e, t, o, s) {
        const l = e[t];
        let c;
        n && (c = e.length);
        const i = Reflect.set(e, t, o, s);
        return (
          r(o, l) && (W(e, t), n(e) && e.length !== c && W(e, 'length')), i
        );
      },
    });
    return B.set(t, o), o;
  }
  function V(e) {
    return !(!e || !e.__isReactive);
  }
  class q {
    constructor(e) {
      (this.__isRef = !0), (this._value = z(e));
    }
    get value() {
      return I(this, 'value'), this._value;
    }
    set value(e) {
      r(e, this._value) && ((this._value = z(e)), W(this, 'value'));
    }
  }
  function z(t) {
    return e(t) ? P(t) : t;
  }
  class H {
    constructor(e, t) {
      (this._setter = t),
        (this._value = void 0),
        (this._dirty = !0),
        (this.effect = F(e, {
          lazy: !0,
          scheduler: () => {
            this._dirty || ((this._dirty = !0), W(this, 'value'));
          },
        }));
    }
    get value() {
      return (
        this._dirty &&
          ((this._value = this.effect()), (this._dirty = !1), I(this, 'value')),
        this._value
      );
    }
    set value(e) {
      this._setter(e);
    }
  }
  const U = Symbol('Text'),
    J = Symbol('Fragment'),
    X = 64;
  function D(e, t = null, n = null) {
    let r = 0;
    return (
      (r = 'string' == typeof e ? 1 : e === U ? 2 : e === J ? 4 : 8),
      'string' == typeof n || 'number' == typeof n
        ? ((r |= 32), (n = n.toString()))
        : Array.isArray(n) && (r |= X),
      t &&
        (V(t) && (t = Object.assign({}, t)),
        V(t.style) && (t.style = Object.assign({}, t.style))),
      {
        type: e,
        props: t,
        children: n,
        shapeFlag: r,
        el: null,
        anchor: null,
        key: t && (null != t.key ? t.key : null),
        component: null,
        next: null,
      }
    );
  }
  function Z(t) {
    return Array.isArray(t)
      ? D(J, null, t)
      : e(t)
      ? t
      : D(U, null, t.toString());
  }
  function G(e, t, n) {
    if (t !== n) {
      (t = t || {}), (n = n || {});
      for (const r in n) {
        if ('key' === r) continue;
        const o = t[r],
          s = n[r];
        o !== s && Q(e, r, o, s);
      }
      for (const r in t) 'key' === r || r in n || Q(e, r, t[r], null);
    }
  }
  const K = /[A-Z]|^(value|checked|selected|muted)$/;
  function Q(e, t, n, r) {
    switch (t) {
      case 'class':
        e.className = r || '';
        break;
      case 'style':
        if (r) {
          for (const t in r) e.style[t] = r[t];
          if (n) for (const t in n) null == r[t] && (e.style[t] = '');
        } else e.removeAttribute('style');
        break;
      default:
        if (/^on[^a-z]/.test(t)) {
          if (n !== r) {
            const o = t.slice(2).toLowerCase();
            n && e.removeEventListener(o, n), r && e.addEventListener(o, r);
          }
        } else
          K.test(t)
            ? ('' === r && 'boolean' == typeof e[t] && (r = !0), (e[t] = r))
            : null == r || !1 === r
            ? e.removeAttribute(t)
            : e.setAttribute(t, r);
    }
  }
  const Y = [];
  let ee = !1;
  const te = Promise.resolve();
  let ne,
    re = null;
  function oe(e) {
    (Y.length && Y.includes(e)) ||
      (Y.push(e), ee || ((ee = !0), (re = te.then(se))));
  }
  function se() {
    try {
      for (let e = 0; e < Y.length; e++) (0, Y[e])();
    } finally {
      (ee = !1), (Y.length = 0), (re = null);
    }
  }
  function le(e, t) {
    const { type: n, props: r } = t;
    for (const t in r)
      n.props && n.props.includes(t)
        ? (e.props[t] = r[t])
        : (e.attrs[t] = r[t]);
    e.props = P(e.props);
  }
  function ce(e, t) {
    const n = t._vnode;
    e ? ie(n, e, t) : n && ae(n), (t._vnode = e);
  }
  function ie(e, t, n, r) {
    e &&
      !(function (e, t) {
        return e.type === t.type;
      })(e, t) &&
      ((r = (e.anchor || e.el).nextSibling), ae(e), (e = null));
    const { shapeFlag: o } = t;
    1 & o
      ? (function (e, t, n, r) {
          null == e
            ? (function (e, t, n) {
                const { type: r, props: o, shapeFlag: s, children: l } = e,
                  c = document.createElement(r);
                32 & s ? (c.textContent = l) : s & X && ue(l, c),
                  o && G(c, null, o),
                  (e.el = c),
                  t.insertBefore(c, n || null);
              })(t, n, r)
            : (function (e, t) {
                (t.el = e.el), G(t.el, e.props, t.props), fe(e, t, t.el);
              })(e, t);
        })(e, t, n, r)
      : 2 & o
      ? (function (e, t, n, r) {
          null == e
            ? (function (e, t, n) {
                const r = document.createTextNode(e.children);
                (e.el = r), t.insertBefore(r, n || null);
              })(t, n, r)
            : ((t.el = e.el), (t.el.textContent = t.children));
        })(e, t, n, r)
      : 4 & o
      ? (function (e, t, n, r) {
          const o = (t.el = e ? e.el : document.createTextNode('')),
            s = (t.anchor = e ? e.anchor : document.createTextNode(''));
          null == e
            ? (n.insertBefore(o, r || null),
              n.insertBefore(s, r || null),
              ue(t.children, n, s))
            : fe(e, t, n, s);
        })(e, t, n, r)
      : 8 & o &&
        (function (e, t, n, r) {
          null == e
            ? (function (e, t, n, r) {
                const { type: o } = e,
                  s = {
                    props: {},
                    attrs: {},
                    setupState: null,
                    ctx: null,
                    update: null,
                    isMounted: !1,
                  };
                if (
                  (le(s, e),
                  (s.setupState = o.setup?.(s.props, { attrs: s.attrs })),
                  !o.render && o.template)
                ) {
                  let { template: e } = o;
                  if ('#' === e[0]) {
                    const t = document.querySelector(e);
                    e = t ? t.innerHTML : '';
                  }
                  (o.render = new Function('ctx', A(e))), console.log(o.render);
                }
                (s.ctx = { ...s.props, ...s.setupState }),
                  (s.update = F(
                    () => {
                      if (s.isMounted) {
                        s.next &&
                          ((e = s.next),
                          (s.next = null),
                          (s.props = P(s.props)),
                          le(s, e),
                          (s.ctx = { ...s.props, ...s.setupState }));
                        const l = s.subTree,
                          c = (s.subTree = Z(o.render(s.ctx)));
                        Object.keys(s.attrs) &&
                          (c.props = { ...c.props, ...s.attrs }),
                          r(l, c, t, n),
                          (e.el = c.el);
                      } else {
                        const l = (s.subTree = Z(o.render(s.ctx)));
                        Object.keys(s.attrs) &&
                          (l.props = { ...l.props, ...s.attrs }),
                          r(null, l, t, n),
                          (s.isMounted = !0),
                          (e.el = l.el);
                      }
                    },
                    { scheduler: oe }
                  )),
                  (e.component = s);
              })(t, n, r, ie)
            : (function (e, t) {
                (t.component = e.component),
                  (t.component.next = t),
                  t.component.update();
              })(e, t);
        })(e, t, n, r);
  }
  function ue(e, t, n) {
    e.forEach((e) => {
      ie(null, e, t, n);
    });
  }
  function ae(e) {
    const { shapeFlag: t, el: n } = e;
    8 & t
      ? (function (e) {
          const { component: t } = e;
          ae(t.subTree);
        })(e)
      : 4 & t
      ? (function (e) {
          let { el: t, anchor: n } = e;
          for (; t !== n; ) {
            let e = t.nextSibling;
            t.parentNode.removeChild(t), (t = e);
          }
          n.parentNode.removeChild(n);
        })(e)
      : n.parentNode.removeChild(n);
  }
  function fe(e, t, n, r) {
    const { shapeFlag: o, children: s } = e,
      { shapeFlag: l, children: c } = t;
    32 & l
      ? (o & X && pe(s), c !== s && (n.textContent = c))
      : o & X
      ? l & X
        ? s[0] && null != s[0].key && c[0] && null != c[0].key
          ? (function (e, t, n, r) {
              let o = 0,
                s = e.length - 1,
                l = t.length - 1;
              for (; o <= s && o <= l && e[o].key === t[o].key; )
                ie(e[o], t[o], n, r), o++;
              for (; o <= s && o <= l && e[s].key === t[l].key; )
                ie(e[s], t[l], n, r), s--, l--;
              if (o > s) {
                const e = l + 1,
                  s = (t[e] && t[e].el) || r;
                for (let e = o; e <= l; e++) ie(null, t[e], n, s);
              } else if (o > l) for (let t = o; t <= s; t++) ae(e[t]);
              else {
                const c = new Map();
                for (let t = o; t <= s; t++) {
                  const n = e[t];
                  c.set(n.key, { prev: n, j: t });
                }
                let i = 0,
                  u = !1,
                  a = [];
                const f = new Array(l - o + 1).fill(-1);
                for (let e = 0; e < l - o + 1; e++) {
                  const s = t[e + o];
                  if (c.has(s.key)) {
                    const { prev: t, j: o } = c.get(s.key);
                    ie(t, s, n, r),
                      o < i ? (u = !0) : (i = o),
                      (f[e] = o),
                      c.delete(s.key);
                  } else a.push(e + o);
                }
                if (
                  (c.forEach(({ prev: e }) => {
                    ae(e);
                  }),
                  u)
                ) {
                  const e = (function (e) {
                    let t = [],
                      n = [];
                    for (let r = 0; r < e.length; r++)
                      if (-1 !== e[r])
                        if (e[r] > t[t.length - 1])
                          t.push(e[r]), n.push(t.length - 1);
                        else {
                          let o = 0,
                            s = t.length - 1;
                          for (; o <= s; ) {
                            let n = ~~((o + s) / 2);
                            if (e[r] > t[n]) o = n + 1;
                            else {
                              if (!(e[r] < t[n])) {
                                o = n;
                                break;
                              }
                              s = n - 1;
                            }
                          }
                          (t[o] = e[r]), n.push(o);
                        }
                    let r = t.length - 1;
                    for (let e = n.length - 1; e >= 0 && r >= 0; e--)
                      n[e] === r && (t[r--] = e);
                    return t;
                  })(f);
                  let s = e.length - 1;
                  for (let l = f.length - 1; l >= 0; l--)
                    if (l === e[s] && -1 !== f[l]) s--;
                    else {
                      const e = l + o,
                        s = e + 1,
                        c = (t[s] && t[s].el) || r;
                      -1 === f[l]
                        ? ie(null, t[e], n, c)
                        : n.insertBefore(t[e].el, c);
                    }
                } else if (a.length)
                  for (let e = a.length - 1; e >= 0; e--) {
                    const o = a[e],
                      s = o + 1,
                      l = (t[s] && t[s].el) || r;
                    ie(null, t[o], n, l);
                  }
              }
            })(s, c, n, r)
          : (function (e, t, n, r) {
              const o = e.length,
                s = t.length,
                l = Math.min(o, s);
              for (let o = 0; o < l; o++) ie(e[o], t[o], n, r);
              s > o ? ue(t.slice(l), n, r) : s < o && pe(e.slice(l));
            })(s, c, n, r)
        : pe(s)
      : (32 & o && (n.textContent = ''), l & X && ue(c, n, r));
  }
  function pe(e) {
    e.forEach((e) => ae(e));
  }
  window.MiniVue = {
    createApp: function (e) {
      return (
        (ne = e.components || {}),
        {
          mount(n) {
            'string' == typeof n && (n = document.querySelector(n)),
              t(e.render) || e.template || (e.template = n.innerHTML),
              (n.innerHTML = ''),
              ce(D(e), n);
          },
        }
      );
    },
    render: ce,
    h: D,
    Text: U,
    Fragment: J,
    renderList: function (t, r) {
      const o = [];
      if ('number' == typeof t) for (let e = 0; e < t; e++) o.push(r(e + 1, e));
      else if ('string' == typeof t || n(t))
        for (let e = 0; e < t.length; e++) o.push(r(t[e], e));
      else
        e(t) &&
          Object.keys(t).forEach((e, n) => {
            o.push(r(t[e], e, n));
          });
      return o;
    },
    resolveComponent: function (e) {
      return (
        ne &&
        (ne[e] || ne[s(e)] || ne[((t = s(e)), t[0].toUpperCase() + t.slice(1))])
      );
      var t;
    },
    withModel: function (e, t, r, o) {
      if (((t = t || {}), 'input' === e))
        switch (t.type) {
          case 'radio':
            (t.checked = r() === t.value),
              (t.onChange = (e) => o(e.target.value));
            break;
          case 'checkbox':
            const e = r();
            n(e)
              ? ((t.checked = e.includes(t.value)),
                (t.onChange = (e) => {
                  const { value: n } = e.target,
                    s = new Set(r());
                  s.has(n) ? s.delete(n) : s.add(n),
                    (t.checked = s.has(t.value)),
                    o([...s]);
                }))
              : ((t.checked = e),
                (t.onChange = (e) => {
                  (t.checked = e.target.checked), o(e.target.checked);
                }));
            break;
          default:
            (t.value = r()), (t.onInput = (e) => o(e.target.value));
        }
      return t;
    },
    nextTick: function (e) {
      const t = re || te;
      return e ? t.then(e) : t;
    },
    reactive: P,
    ref: function (e) {
      return (function (e) {
        return !(!e || !e.__isRef);
      })(e)
        ? e
        : new q(e);
    },
    computed: function (e) {
      let n, r;
      return (
        t(e)
          ? ((n = e),
            (r = () => {
              console.warn(
                'Write operation failed: computed value is readonly'
              );
            }))
          : ((n = e.get), (r = e.set)),
        new H(n, r)
      );
    },
    effect: F,
    compile: A,
  };
})();
