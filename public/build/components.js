
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var components = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */
      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;

        /*
           When the port is the default http port 80 for http, or 443 for
           https, internet explorer 11 returns an empty string for loc.port,
           so we need to compare loc.port with an empty string if url.port
           is the default port 80 or 443.
           Also the comparition with `port` is changed from `===` to `==` because
           `port` can be a string sometimes. This only applies to ie11.
        */
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          (loc.port === url.port || loc.port === '' && (url.port == 80 || url.port == 443)); // jshint ignore:line
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || _page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) {
            ctx.routePath = self.path;
            return fn(ctx, next);
          }
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        delete params[0];

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const createRouter = () => {
        const { subscribe, update } = writable('');
        return {
            subscribe,
            setPath: (path) => update(p => p = path),
        };
    };

    const router = createRouter();

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var prism = createCommonjsModule(function (module) {
    /* PrismJS 1.22.0
    https://prismjs.com/download.html#themes=prism&languages=markup */
    var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(u){var c=/\blang(?:uage)?-([\w-]+)\b/i,n=0,M={manual:u.Prism&&u.Prism.manual,disableWorkerMessageHandler:u.Prism&&u.Prism.disableWorkerMessageHandler,util:{encode:function e(n){return n instanceof W?new W(n.type,e(n.content),n.alias):Array.isArray(n)?n.map(e):n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).slice(8,-1)},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++n}),e.__id},clone:function t(e,r){var a,n;switch(r=r||{},M.util.type(e)){case"Object":if(n=M.util.objId(e),r[n])return r[n];for(var i in a={},r[n]=a,e)e.hasOwnProperty(i)&&(a[i]=t(e[i],r));return a;case"Array":return n=M.util.objId(e),r[n]?r[n]:(a=[],r[n]=a,e.forEach(function(e,n){a[n]=t(e,r);}),a);default:return e}},getLanguage:function(e){for(;e&&!c.test(e.className);)e=e.parentElement;return e?(e.className.match(c)||[,"none"])[1].toLowerCase():"none"},currentScript:function(){if("undefined"==typeof document)return null;if("currentScript"in document)return document.currentScript;try{throw new Error}catch(e){var n=(/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(e.stack)||[])[1];if(n){var t=document.getElementsByTagName("script");for(var r in t)if(t[r].src==n)return t[r]}return null}},isActive:function(e,n,t){for(var r="no-"+n;e;){var a=e.classList;if(a.contains(n))return !0;if(a.contains(r))return !1;e=e.parentElement;}return !!t}},languages:{extend:function(e,n){var t=M.util.clone(M.languages[e]);for(var r in n)t[r]=n[r];return t},insertBefore:function(t,e,n,r){var a=(r=r||M.languages)[t],i={};for(var l in a)if(a.hasOwnProperty(l)){if(l==e)for(var o in n)n.hasOwnProperty(o)&&(i[o]=n[o]);n.hasOwnProperty(l)||(i[l]=a[l]);}var s=r[t];return r[t]=i,M.languages.DFS(M.languages,function(e,n){n===s&&e!=t&&(this[e]=i);}),i},DFS:function e(n,t,r,a){a=a||{};var i=M.util.objId;for(var l in n)if(n.hasOwnProperty(l)){t.call(n,l,n[l],r||l);var o=n[l],s=M.util.type(o);"Object"!==s||a[i(o)]?"Array"!==s||a[i(o)]||(a[i(o)]=!0,e(o,t,l,a)):(a[i(o)]=!0,e(o,t,null,a));}}},plugins:{},highlightAll:function(e,n){M.highlightAllUnder(document,e,n);},highlightAllUnder:function(e,n,t){var r={callback:t,container:e,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};M.hooks.run("before-highlightall",r),r.elements=Array.prototype.slice.apply(r.container.querySelectorAll(r.selector)),M.hooks.run("before-all-elements-highlight",r);for(var a,i=0;a=r.elements[i++];)M.highlightElement(a,!0===n,r.callback);},highlightElement:function(e,n,t){var r=M.util.getLanguage(e),a=M.languages[r];e.className=e.className.replace(c,"").replace(/\s+/g," ")+" language-"+r;var i=e.parentElement;i&&"pre"===i.nodeName.toLowerCase()&&(i.className=i.className.replace(c,"").replace(/\s+/g," ")+" language-"+r);var l={element:e,language:r,grammar:a,code:e.textContent};function o(e){l.highlightedCode=e,M.hooks.run("before-insert",l),l.element.innerHTML=l.highlightedCode,M.hooks.run("after-highlight",l),M.hooks.run("complete",l),t&&t.call(l.element);}if(M.hooks.run("before-sanity-check",l),!l.code)return M.hooks.run("complete",l),void(t&&t.call(l.element));if(M.hooks.run("before-highlight",l),l.grammar)if(n&&u.Worker){var s=new Worker(M.filename);s.onmessage=function(e){o(e.data);},s.postMessage(JSON.stringify({language:l.language,code:l.code,immediateClose:!0}));}else o(M.highlight(l.code,l.grammar,l.language));else o(M.util.encode(l.code));},highlight:function(e,n,t){var r={code:e,grammar:n,language:t};return M.hooks.run("before-tokenize",r),r.tokens=M.tokenize(r.code,r.grammar),M.hooks.run("after-tokenize",r),W.stringify(M.util.encode(r.tokens),r.language)},tokenize:function(e,n){var t=n.rest;if(t){for(var r in t)n[r]=t[r];delete n.rest;}var a=new i;return I(a,a.head,e),function e(n,t,r,a,i,l){for(var o in r)if(r.hasOwnProperty(o)&&r[o]){var s=r[o];s=Array.isArray(s)?s:[s];for(var u=0;u<s.length;++u){if(l&&l.cause==o+","+u)return;var c=s[u],g=c.inside,f=!!c.lookbehind,h=!!c.greedy,d=0,v=c.alias;if(h&&!c.pattern.global){var p=c.pattern.toString().match(/[imsuy]*$/)[0];c.pattern=RegExp(c.pattern.source,p+"g");}for(var m=c.pattern||c,y=a.next,k=i;y!==t.tail&&!(l&&k>=l.reach);k+=y.value.length,y=y.next){var b=y.value;if(t.length>n.length)return;if(!(b instanceof W)){var x=1;if(h&&y!=t.tail.prev){m.lastIndex=k;var w=m.exec(n);if(!w)break;var A=w.index+(f&&w[1]?w[1].length:0),P=w.index+w[0].length,S=k;for(S+=y.value.length;S<=A;)y=y.next,S+=y.value.length;if(S-=y.value.length,k=S,y.value instanceof W)continue;for(var E=y;E!==t.tail&&(S<P||"string"==typeof E.value);E=E.next)x++,S+=E.value.length;x--,b=n.slice(k,S),w.index-=k;}else {m.lastIndex=0;var w=m.exec(b);}if(w){f&&(d=w[1]?w[1].length:0);var A=w.index+d,O=w[0].slice(d),P=A+O.length,L=b.slice(0,A),N=b.slice(P),j=k+b.length;l&&j>l.reach&&(l.reach=j);var C=y.prev;L&&(C=I(t,C,L),k+=L.length),z(t,C,x);var _=new W(o,g?M.tokenize(O,g):O,v,O);y=I(t,C,_),N&&I(t,y,N),1<x&&e(n,t,r,y.prev,k,{cause:o+","+u,reach:j});}}}}}}(e,a,n,a.head,0),function(e){var n=[],t=e.head.next;for(;t!==e.tail;)n.push(t.value),t=t.next;return n}(a)},hooks:{all:{},add:function(e,n){var t=M.hooks.all;t[e]=t[e]||[],t[e].push(n);},run:function(e,n){var t=M.hooks.all[e];if(t&&t.length)for(var r,a=0;r=t[a++];)r(n);}},Token:W};function W(e,n,t,r){this.type=e,this.content=n,this.alias=t,this.length=0|(r||"").length;}function i(){var e={value:null,prev:null,next:null},n={value:null,prev:e,next:null};e.next=n,this.head=e,this.tail=n,this.length=0;}function I(e,n,t){var r=n.next,a={value:t,prev:n,next:r};return n.next=a,r.prev=a,e.length++,a}function z(e,n,t){for(var r=n.next,a=0;a<t&&r!==e.tail;a++)r=r.next;(n.next=r).prev=n,e.length-=a;}if(u.Prism=M,W.stringify=function n(e,t){if("string"==typeof e)return e;if(Array.isArray(e)){var r="";return e.forEach(function(e){r+=n(e,t);}),r}var a={type:e.type,content:n(e.content,t),tag:"span",classes:["token",e.type],attributes:{},language:t},i=e.alias;i&&(Array.isArray(i)?Array.prototype.push.apply(a.classes,i):a.classes.push(i)),M.hooks.run("wrap",a);var l="";for(var o in a.attributes)l+=" "+o+'="'+(a.attributes[o]||"").replace(/"/g,"&quot;")+'"';return "<"+a.tag+' class="'+a.classes.join(" ")+'"'+l+">"+a.content+"</"+a.tag+">"},!u.document)return u.addEventListener&&(M.disableWorkerMessageHandler||u.addEventListener("message",function(e){var n=JSON.parse(e.data),t=n.language,r=n.code,a=n.immediateClose;u.postMessage(M.highlight(r,M.languages[t],t)),a&&u.close();},!1)),M;var e=M.util.currentScript();function t(){M.manual||M.highlightAll();}if(e&&(M.filename=e.src,e.hasAttribute("data-manual")&&(M.manual=!0)),!M.manual){var r=document.readyState;"loading"===r||"interactive"===r&&e&&e.defer?document.addEventListener("DOMContentLoaded",t):window.requestAnimationFrame?window.requestAnimationFrame(t):window.setTimeout(t,16);}return M}(_self);module.exports&&(module.exports=Prism),"undefined"!=typeof commonjsGlobal&&(commonjsGlobal.Prism=Prism);
    Prism.languages.markup={comment:/<!--[\s\S]*?-->/,prolog:/<\?[\s\S]+?\?>/,doctype:{pattern:/<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,greedy:!0,inside:{"internal-subset":{pattern:/(\[)[\s\S]+(?=\]>$)/,lookbehind:!0,greedy:!0,inside:null},string:{pattern:/"[^"]*"|'[^']*'/,greedy:!0},punctuation:/^<!|>$|[[\]]/,"doctype-tag":/^DOCTYPE/,name:/[^\s<>'"]+/}},cdata:/<!\[CDATA\[[\s\S]*?]]>/i,tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"attr-value":{pattern:/=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,inside:{punctuation:[{pattern:/^=/,alias:"attr-equals"},/"|'/]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:[{pattern:/&[\da-z]{1,8};/i,alias:"named-entity"},/&#x?[\da-f]{1,8};/i]},Prism.languages.markup.tag.inside["attr-value"].inside.entity=Prism.languages.markup.entity,Prism.languages.markup.doctype.inside["internal-subset"].inside=Prism.languages.markup,Prism.hooks.add("wrap",function(a){"entity"===a.type&&(a.attributes.title=a.content.replace(/&amp;/,"&"));}),Object.defineProperty(Prism.languages.markup.tag,"addInlined",{value:function(a,e){var s={};s["language-"+e]={pattern:/(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,lookbehind:!0,inside:Prism.languages[e]},s.cdata=/^<!\[CDATA\[|\]\]>$/i;var n={"included-cdata":{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,inside:s}};n["language-"+e]={pattern:/[\s\S]+/,inside:Prism.languages[e]};var t={};t[a]={pattern:RegExp("(<__[^]*?>)(?:<!\\[CDATA\\[(?:[^\\]]|\\](?!\\]>))*\\]\\]>|(?!<!\\[CDATA\\[)[^])*?(?=</__>)".replace(/__/g,function(){return a}),"i"),lookbehind:!0,greedy:!0,inside:n},Prism.languages.insertBefore("markup","cdata",t);}}),Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup,Prism.languages.xml=Prism.languages.extend("markup",{}),Prism.languages.ssml=Prism.languages.xml,Prism.languages.atom=Prism.languages.xml,Prism.languages.rss=Prism.languages.xml;
    });

    // import PrismJS from 'prismjs';
    const highlight = (source) => {
        const highlighted = prism.highlight(source, prism.languages.html, 'html');
        return `<pre><code>${highlighted}</code></pre>`;
    };

    /* src/components/button/index.svelte generated by Svelte v3.29.7 */
    const file = "src/components/button/index.svelte";

    // (23:2) {#if icon}
    function create_if_block_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", /*iconClasses*/ ctx[3]);
    			add_location(span, file, 22, 12, 618);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*iconClasses*/ 8) {
    				attr_dev(span, "class", /*iconClasses*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(23:2) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#if title}
    function create_if_block(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*title*/ ctx[1]);
    			attr_dev(span, "class", "w-button-title");
    			add_location(span, file, 23, 13, 665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 2) set_data_dev(t, /*title*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(24:2) {#if title}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let t;
    	let mounted;
    	let dispose;
    	let if_block0 = /*icon*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = /*title*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", /*elClasses*/ ctx[2]);
    			add_location(div, file, 21, 0, 565);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*icon*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*title*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*elClasses*/ 4) {
    				attr_dev(div, "class", /*elClasses*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let { icon = "" } = $$props;
    	let { title = "" } = $$props;
    	let { secondary = false } = $$props;
    	let { disabled = false } = $$props;
    	const dispatch = createEventDispatcher();

    	const click = () => {
    		if (!disabled) {
    			dispatch("click", { text: "Hello!" });
    		}
    	};

    	const writable_props = ["icon", "title", "secondary", "disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("secondary" in $$props) $$invalidate(5, secondary = $$props.secondary);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		icon,
    		title,
    		secondary,
    		disabled,
    		dispatch,
    		click,
    		elClasses,
    		iconClasses
    	});

    	$$self.$inject_state = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("secondary" in $$props) $$invalidate(5, secondary = $$props.secondary);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ("elClasses" in $$props) $$invalidate(2, elClasses = $$props.elClasses);
    		if ("iconClasses" in $$props) $$invalidate(3, iconClasses = $$props.iconClasses);
    	};

    	let elClasses;
    	let iconClasses;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*secondary, disabled*/ 96) {
    			// declare classes
    			 $$invalidate(2, elClasses = "w-button " + (secondary ? "w-button-secondary" : "w-button-primary") + (disabled ? " w-button-disabled" : ""));
    		}

    		if ($$self.$$.dirty & /*icon*/ 1) {
    			 $$invalidate(3, iconClasses = icon ? `w-button-icon ${icon}` : "");
    		}
    	};

    	return [icon, title, elClasses, iconClasses, click, secondary, disabled];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			icon: 0,
    			title: 1,
    			secondary: 5,
    			disabled: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondary() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondary(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/panel/index.svelte generated by Svelte v3.29.7 */

    const file$1 = "src/components/panel/index.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let br;
    	let t2;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "w-panel-title");
    			add_location(div0, file$1, 6, 2, 168);
    			add_location(br, file$1, 7, 2, 211);
    			attr_dev(div1, "class", /*elClasses*/ ctx[1]);
    			add_location(div1, file$1, 5, 0, 142);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, br);
    			append_dev(div1, t2);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*elClasses*/ 2) {
    				attr_dev(div1, "class", /*elClasses*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Panel", slots, ['default']);
    	let { shadow = false } = $$props;
    	let { title = "" } = $$props;
    	const writable_props = ["shadow", "title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("shadow" in $$props) $$invalidate(2, shadow = $$props.shadow);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ shadow, title, elClasses });

    	$$self.$inject_state = $$props => {
    		if ("shadow" in $$props) $$invalidate(2, shadow = $$props.shadow);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("elClasses" in $$props) $$invalidate(1, elClasses = $$props.elClasses);
    	};

    	let elClasses;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*shadow*/ 4) {
    			 $$invalidate(1, elClasses = "w-panel " + (shadow ? " w-panel-shadow" : ""));
    		}
    	};

    	return [title, elClasses, shadow, $$scope, slots];
    }

    class Panel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { shadow: 2, title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get shadow() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shadow(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/divider/index.svelte generated by Svelte v3.29.7 */

    const file$2 = "src/components/divider/index.svelte";

    // (19:2) {#if type === 'horizontal'}
    function create_if_block_1$1(ctx) {
    	let t;
    	let div;
    	let if_block = /*title*/ ctx[0] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			div = element("div");
    			attr_dev(div, "class", /*elClassesH*/ ctx[2]);
    			add_location(div, file$2, 22, 4, 595);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*elClassesH*/ 4) {
    				attr_dev(div, "class", /*elClassesH*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(19:2) {#if type === 'horizontal'}",
    		ctx
    	});

    	return block;
    }

    // (20:4) {#if title}
    function create_if_block_2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*title*/ ctx[0]);
    			attr_dev(div, "class", "w-divider-title");
    			add_location(div, file$2, 20, 6, 538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(20:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (25:2) {#if type === 'vertical'}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", /*elClassesV*/ ctx[3]);
    			add_location(span, file$2, 25, 4, 662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*elClassesV*/ 8) {
    				attr_dev(span, "class", /*elClassesV*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(25:2) {#if type === 'vertical'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*type*/ ctx[1] === "horizontal" && create_if_block_1$1(ctx);
    	let if_block1 = /*type*/ ctx[1] === "vertical" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "w-divider");
    			add_location(div, file$2, 17, 0, 462);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*type*/ ctx[1] === "horizontal") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*type*/ ctx[1] === "vertical") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Divider", slots, []);
    	let { title = "" } = $$props;
    	let { size = "small" } = $$props;
    	let { type = "horizontal" } = $$props;
    	const writable_props = ["title", "size", "type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Divider> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({
    		title,
    		size,
    		type,
    		elClassesH,
    		elClassesV
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("elClassesH" in $$props) $$invalidate(2, elClassesH = $$props.elClassesH);
    		if ("elClassesV" in $$props) $$invalidate(3, elClassesV = $$props.elClassesV);
    	};

    	let elClassesH;
    	let elClassesV;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 16) {
    			 $$invalidate(2, elClassesH = size === "medium"
    			? " w-divider-medium"
    			: size === "large"
    				? " w-divider-large"
    				: " w-divider-small");
    		}

    		if ($$self.$$.dirty & /*size*/ 16) {
    			 $$invalidate(3, elClassesV = size === "medium"
    			? " w-divider-vertical-medium"
    			: size === "large"
    				? " w-divider-vertical-large"
    				: " w-divider-vertical-small");
    		}
    	};

    	return [title, type, elClassesH, elClassesV, size];
    }

    class Divider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 0, size: 4, type: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Divider",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get title() {
    		throw new Error("<Divider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Divider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Divider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Divider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Divider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Divider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/search/index.svelte generated by Svelte v3.29.7 */

    const file$3 = "src/components/search/index.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let input;
    	let t2;
    	let span0;
    	let t3;
    	let span1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*label*/ ctx[0]);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			span0 = element("span");
    			t3 = space();
    			span1 = element("span");
    			attr_dev(div0, "class", "w-search-label");
    			add_location(div0, file$3, 11, 2, 289);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			input.disabled = /*disabled*/ ctx[2];
    			input.value = /*value*/ ctx[3];
    			add_location(input, file$3, 12, 2, 333);
    			attr_dev(span0, "class", "w-search-icon icon-search");
    			add_location(span0, file$3, 13, 2, 390);
    			attr_dev(span1, "class", "w-search-icon icon-close");
    			set_style(span1, "left", /*width*/ ctx[4] - 40 + "px");
    			add_location(span1, file$3, 14, 2, 435);
    			attr_dev(div1, "class", /*elClasses*/ ctx[5]);
    			set_style(div1, "width", /*width*/ ctx[4] + "px");
    			add_location(div1, file$3, 10, 0, 238);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, input);
    			append_dev(div1, t2);
    			append_dev(div1, span0);
    			append_dev(div1, t3);
    			append_dev(div1, span1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 1) set_data_dev(t0, /*label*/ ctx[0]);

    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 8 && input.value !== /*value*/ ctx[3]) {
    				prop_dev(input, "value", /*value*/ ctx[3]);
    			}

    			if (dirty & /*width*/ 16) {
    				set_style(span1, "left", /*width*/ ctx[4] - 40 + "px");
    			}

    			if (dirty & /*elClasses*/ 32) {
    				attr_dev(div1, "class", /*elClasses*/ ctx[5]);
    			}

    			if (dirty & /*width*/ 16) {
    				set_style(div1, "width", /*width*/ ctx[4] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Search", slots, []);
    	let { label = "" } = $$props;
    	let { placeholder = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { value = "" } = $$props;
    	let { width = 200 } = $$props;
    	const writable_props = ["label", "placeholder", "disabled", "value", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("value" in $$props) $$invalidate(3, value = $$props.value);
    		if ("width" in $$props) $$invalidate(4, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({
    		label,
    		placeholder,
    		disabled,
    		value,
    		width,
    		elClasses
    	});

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("value" in $$props) $$invalidate(3, value = $$props.value);
    		if ("width" in $$props) $$invalidate(4, width = $$props.width);
    		if ("elClasses" in $$props) $$invalidate(5, elClasses = $$props.elClasses);
    	};

    	let elClasses;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*disabled*/ 4) {
    			 $$invalidate(5, elClasses = "w-search" + (disabled ? " w-textfield-search" : ""));
    		}
    	};

    	return [label, placeholder, disabled, value, width, elClasses];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			label: 0,
    			placeholder: 1,
    			disabled: 2,
    			value: 3,
    			width: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get label() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/switch/index.svelte generated by Svelte v3.29.7 */
    const file$4 = "src/components/switch/index.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label_1;
    	let label_1_class_value;
    	let t1;
    	let span;
    	let t2;
    	let span_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label_1 = element("label");
    			t1 = space();
    			span = element("span");
    			t2 = text(/*label*/ ctx[1]);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "w-checkbox");
    			add_location(input, file$4, 14, 2, 341);
    			attr_dev(label_1, "for", "w-switch");
    			attr_dev(label_1, "class", label_1_class_value = "w-switch-toggle " + (/*disabled*/ ctx[2] ? "w-switch-toggle-disabled" : ""));
    			add_location(label_1, file$4, 15, 2, 401);
    			attr_dev(span, "class", span_class_value = "w-switch-label " + (/*disabled*/ ctx[2] ? "w-switch-label-disabled" : ""));
    			add_location(span, file$4, 19, 2, 531);
    			attr_dev(div, "class", "w-switch");
    			add_location(div, file$4, 13, 0, 316);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			input.checked = /*checked*/ ctx[0];
    			append_dev(div, t0);
    			append_dev(div, label_1);
    			append_dev(div, t1);
    			append_dev(div, span);
    			append_dev(span, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[4]),
    					listen_dev(label_1, "click", /*click*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}

    			if (dirty & /*disabled*/ 4 && label_1_class_value !== (label_1_class_value = "w-switch-toggle " + (/*disabled*/ ctx[2] ? "w-switch-toggle-disabled" : ""))) {
    				attr_dev(label_1, "class", label_1_class_value);
    			}

    			if (dirty & /*label*/ 2) set_data_dev(t2, /*label*/ ctx[1]);

    			if (dirty & /*disabled*/ 4 && span_class_value !== (span_class_value = "w-switch-label " + (/*disabled*/ ctx[2] ? "w-switch-label-disabled" : ""))) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Switch", slots, []);
    	let { checked = false } = $$props;
    	let { label = "" } = $$props;
    	let { disabled = false } = $$props;
    	const dispatch = createEventDispatcher();

    	const click = () => {
    		if (!disabled) {
    			$$invalidate(0, checked = !checked);
    			dispatch("toggle", checked);
    		}
    	};

    	const writable_props = ["checked", "label", "disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Switch> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$$set = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		checked,
    		label,
    		disabled,
    		dispatch,
    		click
    	});

    	$$self.$inject_state = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [checked, label, disabled, click, input_change_handler];
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { checked: 0, label: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switch",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get checked() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/tabs/index.svelte generated by Svelte v3.29.7 */
    const file$5 = "src/components/tabs/index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i].title;
    	child_ctx[6] = list[i].active;
    	child_ctx[7] = list[i].icon;
    	return child_ctx;
    }

    // (19:6) {#if icon}
    function create_if_block$2(ctx) {
    	let span;
    	let span_class_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", span_class_value = "w-tabs-icon " + /*icon*/ ctx[7]);
    			toggle_class(span, "active", /*active*/ ctx[6]);
    			add_location(span, file$5, 18, 16, 438);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && span_class_value !== (span_class_value = "w-tabs-icon " + /*icon*/ ctx[7])) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*items, items*/ 1) {
    				toggle_class(span, "active", /*active*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(19:6) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (17:2) {#each items as { title, active, icon }}
    function create_each_block(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*title*/ ctx[5] + "";
    	let t1;
    	let span_style_value;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*icon*/ ctx[7] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "class", "w-tabs-title");
    			attr_dev(span, "style", span_style_value = /*icon*/ ctx[7] ? "padding-left: 5px" : "");
    			add_location(span, file$5, 19, 6, 501);
    			attr_dev(div, "class", "w-tab");
    			toggle_class(div, "active", /*active*/ ctx[6]);
    			add_location(div, file$5, 17, 4, 365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(
    					div,
    					"click",
    					function () {
    						if (is_function(/*click*/ ctx[1](/*title*/ ctx[5]))) /*click*/ ctx[1](/*title*/ ctx[5]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*icon*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*items*/ 1 && t1_value !== (t1_value = /*title*/ ctx[5] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items*/ 1 && span_style_value !== (span_style_value = /*icon*/ ctx[7] ? "padding-left: 5px" : "")) {
    				attr_dev(span, "style", span_style_value);
    			}

    			if (dirty & /*items*/ 1) {
    				toggle_class(div, "active", /*active*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(17:2) {#each items as { title, active, icon }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let current;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "w-tabs");
    			add_location(div0, file$5, 15, 0, 297);
    			add_location(div1, file$5, 25, 0, 627);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items, click*/ 3) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", slots, ['default']);
    	let { items = [] } = $$props;
    	const dispatch = createEventDispatcher();

    	const click = title => {
    		dispatch("click", title);

    		$$invalidate(0, items = items.map(t => {
    			t.active = t.title === title;
    			return t;
    		}));
    	};

    	const writable_props = ["items"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		items,
    		dispatch,
    		click
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, click, $$scope, slots];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { items: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get items() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/textfield/index.svelte generated by Svelte v3.29.7 */

    const file$6 = "src/components/textfield/index.svelte";

    // (15:2) {#if valid}
    function create_if_block_1$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "w-textfield-icon icon-checkmark");
    			add_location(span, file$6, 14, 13, 473);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(15:2) {#if valid}",
    		ctx
    	});

    	return block;
    }

    // (16:2) {#if valid === false}
    function create_if_block$3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "w-textfield-icon icon-alert");
    			add_location(span, file$6, 15, 23, 550);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(16:2) {#if valid === false}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let input;
    	let t2;
    	let t3;
    	let if_block0 = /*valid*/ ctx[4] && create_if_block_1$2(ctx);
    	let if_block1 = /*valid*/ ctx[4] === false && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*label*/ ctx[0]);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "w-textfield-label");
    			add_location(div0, file$6, 12, 2, 315);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			input.disabled = /*disabled*/ ctx[2];
    			input.value = /*value*/ ctx[3];
    			toggle_class(input, "w-textfield-invalid", /*valid*/ ctx[4] === false);
    			add_location(input, file$6, 13, 2, 362);
    			attr_dev(div1, "class", /*elClasses*/ ctx[5]);
    			add_location(div1, file$6, 11, 0, 289);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, input);
    			append_dev(div1, t2);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t3);
    			if (if_block1) if_block1.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 1) set_data_dev(t0, /*label*/ ctx[0]);

    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 8 && input.value !== /*value*/ ctx[3]) {
    				prop_dev(input, "value", /*value*/ ctx[3]);
    			}

    			if (dirty & /*valid*/ 16) {
    				toggle_class(input, "w-textfield-invalid", /*valid*/ ctx[4] === false);
    			}

    			if (/*valid*/ ctx[4]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div1, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*valid*/ ctx[4] === false) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*elClasses*/ 32) {
    				attr_dev(div1, "class", /*elClasses*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Textfield", slots, []);
    	let { label = "" } = $$props;
    	let { placeholder = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { value = "" } = $$props;
    	let { valid } = $$props;
    	const writable_props = ["label", "placeholder", "disabled", "value", "valid"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Textfield> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("value" in $$props) $$invalidate(3, value = $$props.value);
    		if ("valid" in $$props) $$invalidate(4, valid = $$props.valid);
    	};

    	$$self.$capture_state = () => ({
    		label,
    		placeholder,
    		disabled,
    		value,
    		valid,
    		elClasses
    	});

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("value" in $$props) $$invalidate(3, value = $$props.value);
    		if ("valid" in $$props) $$invalidate(4, valid = $$props.valid);
    		if ("elClasses" in $$props) $$invalidate(5, elClasses = $$props.elClasses);
    	};

    	let elClasses;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*disabled*/ 4) {
    			 $$invalidate(5, elClasses = "w-textfield" + (disabled ? " w-textfield-disabled" : ""));
    		}
    	};

    	return [label, placeholder, disabled, value, valid, elClasses];
    }

    class Textfield extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			label: 0,
    			placeholder: 1,
    			disabled: 2,
    			value: 3,
    			valid: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Textfield",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*valid*/ ctx[4] === undefined && !("valid" in props)) {
    			console.warn("<Textfield> was created without expected prop 'valid'");
    		}
    	}

    	get label() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valid() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valid(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/code/index.svelte generated by Svelte v3.29.7 */
    const file$7 = "src/components/code/index.svelte";

    function create_fragment$7(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t = text("Code example:\n  ");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "w-code");
    			add_location(div0, file$7, 6, 2, 109);
    			attr_dev(div1, "class", "w-code-title");
    			add_location(div1, file$7, 4, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Code", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Code> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Divider });
    	return [$$scope, slots];
    }

    class Code extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Code",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/pages/Buttons.svelte generated by Svelte v3.29.7 */
    const file$8 = "src/pages/Buttons.svelte";

    // (9:0) <Panel title="Component Button" shadow={true}>
    function create_default_slot_4(ctx) {
    	let p;
    	let t1;
    	let ul;
    	let li0;
    	let t3;
    	let li1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Basic component that is used to trigger bussiness logic. It also supports focus (mouse and keyboard separately), \n    hover and disabled states.";
    			t1 = text("\n  \n    Button has two types:\n    ");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Primary: more prominent, has no background color, with white or black text color.";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Secondary: less prominent, has a background, text color is the button color.";
    			add_location(p, file$8, 9, 2, 271);
    			add_location(li0, file$8, 16, 6, 475);
    			add_location(li1, file$8, 19, 6, 588);
    			add_location(ul, file$8, 15, 4, 464);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(9:0) <Panel title=\\\"Component Button\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (34:2) <Code>
    function create_default_slot_3(ctx) {
    	let html_tag;
    	let raw_value = highlight("<Button icon=\"icon-help\" on:click={clickHandler} />\n" + "<Button icon=\"icon-settings\" title=\"Settings\" />\n" + "<Button icon=\"icon-chat\" title=\"Chat\" disabled={true} on:click={clickHandler} />\n" + "<Button title=\"Primary\" on:click={clickHandler} />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(34:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (26:0) <Panel title="Primary buttons" shadow={true}>
    function create_default_slot_2(ctx) {
    	let p;
    	let button0;
    	let t0;
    	let button1;
    	let t1;
    	let button2;
    	let t2;
    	let button3;
    	let t3;
    	let code;
    	let current;

    	button0 = new Button({
    			props: { icon: "icon-help" },
    			$$inline: true
    		});

    	button0.$on("click", /*help*/ ctx[0]);

    	button1 = new Button({
    			props: { icon: "icon-settings", title: "Settings" },
    			$$inline: true
    		});

    	button2 = new Button({
    			props: {
    				icon: "icon-chat",
    				title: "Chat",
    				disabled: true
    			},
    			$$inline: true
    		});

    	button2.$on("click", /*help*/ ctx[0]);

    	button3 = new Button({
    			props: { title: "Primary" },
    			$$inline: true
    		});

    	button3.$on("click", /*help*/ ctx[0]);

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			p = element("p");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    			t2 = space();
    			create_component(button3.$$.fragment);
    			t3 = space();
    			create_component(code.$$.fragment);
    			add_location(p, file$8, 26, 2, 758);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			mount_component(button0, p, null);
    			append_dev(p, t0);
    			mount_component(button1, p, null);
    			append_dev(p, t1);
    			mount_component(button2, p, null);
    			append_dev(p, t2);
    			mount_component(button3, p, null);
    			insert_dev(target, t3, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(button3);
    			if (detaching) detach_dev(t3);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(26:0) <Panel title=\\\"Primary buttons\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (52:2) <Code>
    function create_default_slot_1(ctx) {
    	let html_tag;
    	let raw_value = highlight("<Button secondary={true} title=\"Secondary\" />\n" + "<Button secondary={true} title=\"Disabled\" disabled={true} />\n" + "<Button secondary={true} icon=\"icon-bell\" title=\"Bell\" />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(52:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (45:0) <Panel title="Secondary buttons" shadow={true}>
    function create_default_slot(ctx) {
    	let p;
    	let button0;
    	let t0;
    	let button1;
    	let t1;
    	let button2;
    	let t2;
    	let code;
    	let current;

    	button0 = new Button({
    			props: { secondary: true, title: "Secondary" },
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				secondary: true,
    				title: "Disabled",
    				disabled: true
    			},
    			$$inline: true
    		});

    	button2 = new Button({
    			props: {
    				secondary: true,
    				icon: "icon-bell",
    				title: "Bell"
    			},
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			p = element("p");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    			t2 = space();
    			create_component(code.$$.fragment);
    			add_location(p, file$8, 45, 2, 1383);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			mount_component(button0, p, null);
    			append_dev(p, t0);
    			mount_component(button1, p, null);
    			append_dev(p, t1);
    			mount_component(button2, p, null);
    			insert_dev(target, t2, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			if (detaching) detach_dev(t2);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(45:0) <Panel title=\\\"Secondary buttons\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let panel0;
    	let t0;
    	let panel1;
    	let t1;
    	let panel2;
    	let current;

    	panel0 = new Panel({
    			props: {
    				title: "Component Button",
    				shadow: true,
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel1 = new Panel({
    			props: {
    				title: "Primary buttons",
    				shadow: true,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel2 = new Panel({
    			props: {
    				title: "Secondary buttons",
    				shadow: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel0.$$.fragment);
    			t0 = space();
    			create_component(panel1.$$.fragment);
    			t1 = space();
    			create_component(panel2.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(panel1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(panel2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				panel0_changes.$$scope = { dirty, ctx };
    			}

    			panel0.$set(panel0_changes);
    			const panel1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				panel1_changes.$$scope = { dirty, ctx };
    			}

    			panel1.$set(panel1_changes);
    			const panel2_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				panel2_changes.$$scope = { dirty, ctx };
    			}

    			panel2.$set(panel2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel0.$$.fragment, local);
    			transition_in(panel1.$$.fragment, local);
    			transition_in(panel2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel0.$$.fragment, local);
    			transition_out(panel1.$$.fragment, local);
    			transition_out(panel2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(panel1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(panel2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Buttons", slots, []);

    	const help = event => {
    		alert(event.detail.text);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Buttons> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Button, Panel, Code, help });
    	return [help];
    }

    class Buttons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttons",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/pages/Dividers.svelte generated by Svelte v3.29.7 */
    const file$9 = "src/pages/Dividers.svelte";

    // (21:2) <Code>
    function create_default_slot_3$1(ctx) {
    	let html_tag;
    	let raw_value = highlight("<Divider type=\"vertical\" size=\"small\" /> \n" + "<Divider type=\"vertical\" size=\"medium\" /> \n" + "<Divider type=\"vertical\" size=\"large\" /> ") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(21:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (6:0) <Panel title="Divider vertical" shadow={true}>
    function create_default_slot_2$1(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let divider0;
    	let t2;
    	let div2;
    	let t4;
    	let div3;
    	let divider1;
    	let t5;
    	let div4;
    	let t7;
    	let div5;
    	let divider2;
    	let t8;
    	let div6;
    	let t10;
    	let code;
    	let current;

    	divider0 = new Divider({
    			props: { type: "vertical" },
    			$$inline: true
    		});

    	divider1 = new Divider({
    			props: { type: "vertical", size: "medium" },
    			$$inline: true
    		});

    	divider2 = new Divider({
    			props: { type: "vertical", size: "large" },
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Text 1";
    			t1 = space();
    			div1 = element("div");
    			create_component(divider0.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "Text 2";
    			t4 = space();
    			div3 = element("div");
    			create_component(divider1.$$.fragment);
    			t5 = space();
    			div4 = element("div");
    			div4.textContent = "Text 2";
    			t7 = space();
    			div5 = element("div");
    			create_component(divider2.$$.fragment);
    			t8 = space();
    			div6 = element("div");
    			div6.textContent = "Text 2";
    			t10 = space();
    			create_component(code.$$.fragment);
    			set_style(div0, "display", "inline-block");
    			set_style(div0, "margin", "0px");
    			add_location(div0, file$9, 6, 2, 213);
    			set_style(div1, "display", "inline-block");
    			add_location(div1, file$9, 7, 2, 276);
    			set_style(div2, "display", "inline-block");
    			set_style(div2, "margin", "10px");
    			add_location(div2, file$9, 10, 2, 356);
    			set_style(div3, "display", "inline-block");
    			add_location(div3, file$9, 11, 2, 420);
    			set_style(div4, "display", "inline-block");
    			set_style(div4, "margin", "10px");
    			add_location(div4, file$9, 14, 2, 514);
    			set_style(div5, "display", "inline-block");
    			add_location(div5, file$9, 15, 2, 578);
    			set_style(div6, "display", "inline-block");
    			set_style(div6, "margin", "10px");
    			add_location(div6, file$9, 18, 2, 671);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(divider0, div1, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(divider1, div3, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div4, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div5, anchor);
    			mount_component(divider2, div5, null);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div6, anchor);
    			insert_dev(target, t10, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(divider0.$$.fragment, local);
    			transition_in(divider1.$$.fragment, local);
    			transition_in(divider2.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(divider0.$$.fragment, local);
    			transition_out(divider1.$$.fragment, local);
    			transition_out(divider2.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(divider0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			destroy_component(divider1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div5);
    			destroy_component(divider2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t10);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(6:0) <Panel title=\\\"Divider vertical\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (49:2) <Code>
    function create_default_slot_1$1(ctx) {
    	let html_tag;
    	let raw_value = highlight("<Divider title=\"Small\"/>\n" + "<Divider title=\"Medium\" size=\"medium\"/>\n" + "<Divider title=\"Large\" size=\"large\"/>\n") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(49:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (30:0) <Panel title="Divider standard" shadow={true}>
    function create_default_slot$1(ctx) {
    	let div0;
    	let divider0;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let div1;
    	let divider1;
    	let t3;
    	let br2;
    	let t4;
    	let br3;
    	let t5;
    	let div2;
    	let divider2;
    	let t6;
    	let br4;
    	let t7;
    	let br5;
    	let t8;
    	let code;
    	let current;

    	divider0 = new Divider({
    			props: { title: "Small" },
    			$$inline: true
    		});

    	divider1 = new Divider({
    			props: { title: "Medium", size: "medium" },
    			$$inline: true
    		});

    	divider2 = new Divider({
    			props: { title: "Large", size: "large" },
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(divider0.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			br1 = element("br");
    			t2 = space();
    			div1 = element("div");
    			create_component(divider1.$$.fragment);
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			br3 = element("br");
    			t5 = space();
    			div2 = element("div");
    			create_component(divider2.$$.fragment);
    			t6 = space();
    			br4 = element("br");
    			t7 = space();
    			br5 = element("br");
    			t8 = space();
    			create_component(code.$$.fragment);
    			add_location(br0, file$9, 32, 4, 1040);
    			add_location(br1, file$9, 33, 4, 1051);
    			add_location(div0, file$9, 30, 2, 1000);
    			add_location(br2, file$9, 38, 4, 1125);
    			add_location(br3, file$9, 39, 4, 1136);
    			add_location(div1, file$9, 36, 2, 1070);
    			add_location(br4, file$9, 44, 4, 1208);
    			add_location(br5, file$9, 45, 4, 1219);
    			add_location(div2, file$9, 42, 2, 1155);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(divider0, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, br0);
    			append_dev(div0, t1);
    			append_dev(div0, br1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(divider1, div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, br2);
    			append_dev(div1, t4);
    			append_dev(div1, br3);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(divider2, div2, null);
    			append_dev(div2, t6);
    			append_dev(div2, br4);
    			append_dev(div2, t7);
    			append_dev(div2, br5);
    			insert_dev(target, t8, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(divider0.$$.fragment, local);
    			transition_in(divider1.$$.fragment, local);
    			transition_in(divider2.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(divider0.$$.fragment, local);
    			transition_out(divider1.$$.fragment, local);
    			transition_out(divider2.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(divider0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			destroy_component(divider1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div2);
    			destroy_component(divider2);
    			if (detaching) detach_dev(t8);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(30:0) <Panel title=\\\"Divider standard\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let panel0;
    	let t;
    	let panel1;
    	let current;

    	panel0 = new Panel({
    			props: {
    				title: "Divider vertical",
    				shadow: true,
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel1 = new Panel({
    			props: {
    				title: "Divider standard",
    				shadow: true,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel0.$$.fragment);
    			t = space();
    			create_component(panel1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(panel1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel0_changes.$$scope = { dirty, ctx };
    			}

    			panel0.$set(panel0_changes);
    			const panel1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel1_changes.$$scope = { dirty, ctx };
    			}

    			panel1.$set(panel1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel0.$$.fragment, local);
    			transition_in(panel1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel0.$$.fragment, local);
    			transition_out(panel1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(panel1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Dividers", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dividers> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Divider, Panel, Code });
    	return [];
    }

    class Dividers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dividers",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/pages/Grids.svelte generated by Svelte v3.29.7 */
    const file$a = "src/pages/Grids.svelte";

    // (12:2) <Code>
    function create_default_slot_4$1(ctx) {
    	let html_tag;
    	let raw_value = highlight("<div class=\"w-grid w-grid-container-2-4\">\n\t<div>C1</div>\n\t<div>C2</div>\n</div>") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(12:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (22:2) <Code>
    function create_default_slot_3$2(ctx) {
    	let html_tag;
    	let raw_value = highlight("<div class=\"w-grid w-grid-container-2-8\">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(22:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (32:2) <Code>
    function create_default_slot_2$2(ctx) {
    	let html_tag;
    	let raw_value = highlight("<div class=\"w-grid w-grid-container-2-12\">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(32:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (42:2) <Code>
    function create_default_slot_1$2(ctx) {
    	let html_tag;
    	let raw_value = highlight("<div class=\"w-grid w-grid-container-2-16\">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(42:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (6:0) <Panel title="Grid" shadow={true}>
    function create_default_slot$2(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let code0;
    	let t4;
    	let divider0;
    	let t5;
    	let div5;
    	let div3;
    	let t7;
    	let div4;
    	let t9;
    	let code1;
    	let t10;
    	let divider1;
    	let t11;
    	let div8;
    	let div6;
    	let t13;
    	let div7;
    	let t15;
    	let code2;
    	let t16;
    	let divider2;
    	let t17;
    	let div11;
    	let div9;
    	let t19;
    	let div10;
    	let t21;
    	let code3;
    	let current;

    	code0 = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divider0 = new Divider({ $$inline: true });

    	code1 = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divider1 = new Divider({ $$inline: true });

    	code2 = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divider2 = new Divider({ $$inline: true });

    	code3 = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "C1";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "C2";
    			t3 = space();
    			create_component(code0.$$.fragment);
    			t4 = space();
    			create_component(divider0.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div3.textContent = "Column 1";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "Column 2";
    			t9 = space();
    			create_component(code1.$$.fragment);
    			t10 = space();
    			create_component(divider1.$$.fragment);
    			t11 = space();
    			div8 = element("div");
    			div6 = element("div");
    			div6.textContent = "Column 1";
    			t13 = space();
    			div7 = element("div");
    			div7.textContent = "Column 2";
    			t15 = space();
    			create_component(code2.$$.fragment);
    			t16 = space();
    			create_component(divider2.$$.fragment);
    			t17 = space();
    			div11 = element("div");
    			div9 = element("div");
    			div9.textContent = "Column 1";
    			t19 = space();
    			div10 = element("div");
    			div10.textContent = "Column 2";
    			t21 = space();
    			create_component(code3.$$.fragment);
    			add_location(div0, file$a, 7, 4, 247);
    			add_location(div1, file$a, 8, 4, 265);
    			attr_dev(div2, "class", "w-grid w-grid-container-2-4");
    			add_location(div2, file$a, 6, 2, 201);
    			add_location(div3, file$a, 17, 4, 482);
    			add_location(div4, file$a, 18, 4, 506);
    			attr_dev(div5, "class", "w-grid w-grid-container-2-8");
    			add_location(div5, file$a, 16, 2, 436);
    			add_location(div6, file$a, 27, 4, 742);
    			add_location(div7, file$a, 28, 4, 766);
    			attr_dev(div8, "class", "w-grid w-grid-container-2-12");
    			add_location(div8, file$a, 26, 2, 695);
    			add_location(div9, file$a, 37, 4, 1003);
    			add_location(div10, file$a, 38, 4, 1027);
    			attr_dev(div11, "class", "w-grid w-grid-container-2-16");
    			add_location(div11, file$a, 36, 2, 956);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			insert_dev(target, t3, anchor);
    			mount_component(code0, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(divider0, target, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			insert_dev(target, t9, anchor);
    			mount_component(code1, target, anchor);
    			insert_dev(target, t10, anchor);
    			mount_component(divider1, target, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div6);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			insert_dev(target, t15, anchor);
    			mount_component(code2, target, anchor);
    			insert_dev(target, t16, anchor);
    			mount_component(divider2, target, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div9);
    			append_dev(div11, t19);
    			append_dev(div11, div10);
    			insert_dev(target, t21, anchor);
    			mount_component(code3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code0_changes.$$scope = { dirty, ctx };
    			}

    			code0.$set(code0_changes);
    			const code1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code1_changes.$$scope = { dirty, ctx };
    			}

    			code1.$set(code1_changes);
    			const code2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code2_changes.$$scope = { dirty, ctx };
    			}

    			code2.$set(code2_changes);
    			const code3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code3_changes.$$scope = { dirty, ctx };
    			}

    			code3.$set(code3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code0.$$.fragment, local);
    			transition_in(divider0.$$.fragment, local);
    			transition_in(code1.$$.fragment, local);
    			transition_in(divider1.$$.fragment, local);
    			transition_in(code2.$$.fragment, local);
    			transition_in(divider2.$$.fragment, local);
    			transition_in(code3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code0.$$.fragment, local);
    			transition_out(divider0.$$.fragment, local);
    			transition_out(code1.$$.fragment, local);
    			transition_out(divider1.$$.fragment, local);
    			transition_out(code2.$$.fragment, local);
    			transition_out(divider2.$$.fragment, local);
    			transition_out(code3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			destroy_component(code0, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(divider0, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t9);
    			destroy_component(code1, detaching);
    			if (detaching) detach_dev(t10);
    			destroy_component(divider1, detaching);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t15);
    			destroy_component(code2, detaching);
    			if (detaching) detach_dev(t16);
    			destroy_component(divider2, detaching);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div11);
    			if (detaching) detach_dev(t21);
    			destroy_component(code3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(6:0) <Panel title=\\\"Grid\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				title: "Grid",
    				shadow: true,
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel_changes.$$scope = { dirty, ctx };
    			}

    			panel.$set(panel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Grids", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Grids> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Divider, Panel, Code });
    	return [];
    }

    class Grids extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grids",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/pages/Panels.svelte generated by Svelte v3.29.7 */

    // (7:2) <Code>
    function create_default_slot_3$3(ctx) {
    	let html_tag;
    	let raw_value = highlight("<Panel title=\"Simple panel\"></Panel>") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$3.name,
    		type: "slot",
    		source: "(7:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (6:0) <Panel title="Simple panel">
    function create_default_slot_2$3(ctx) {
    	let code;
    	let current;

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_3$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(6:0) <Panel title=\\\"Simple panel\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:2) <Code>
    function create_default_slot_1$3(ctx) {
    	let html_tag;
    	let raw_value = highlight("<Panel title=\"Shadow panel\" shadow={true}></Panel>") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(14:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (13:0) <Panel title="Shadow panel" shadow={true}>
    function create_default_slot$3(ctx) {
    	let code;
    	let current;

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(13:0) <Panel title=\\\"Shadow panel\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let panel0;
    	let t;
    	let panel1;
    	let current;

    	panel0 = new Panel({
    			props: {
    				title: "Simple panel",
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel1 = new Panel({
    			props: {
    				title: "Shadow panel",
    				shadow: true,
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel0.$$.fragment);
    			t = space();
    			create_component(panel1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(panel1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel0_changes.$$scope = { dirty, ctx };
    			}

    			panel0.$set(panel0_changes);
    			const panel1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel1_changes.$$scope = { dirty, ctx };
    			}

    			panel1.$set(panel1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel0.$$.fragment, local);
    			transition_in(panel1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel0.$$.fragment, local);
    			transition_out(panel1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(panel1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Panels", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Panels> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Panel, Code });
    	return [];
    }

    class Panels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panels",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/pages/Searches.svelte generated by Svelte v3.29.7 */
    const file$b = "src/pages/Searches.svelte";

    // (12:2) <Code>
    function create_default_slot_1$4(ctx) {
    	let html_tag;
    	let raw_value = highlight("<Search label=\"Search\" placeholder=\"Search\" width={200}/>\n" + "<Search label=\"Phone disabled\" placeholder=\"Search\" disabled={true} />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(12:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (6:0) <Panel title="Search" shadow={true}>
    function create_default_slot$4(ctx) {
    	let div;
    	let search0;
    	let t0;
    	let search1;
    	let t1;
    	let code;
    	let current;

    	search0 = new Search({
    			props: {
    				label: "Search",
    				placeholder: "Search",
    				width: 250
    			},
    			$$inline: true
    		});

    	search1 = new Search({
    			props: {
    				label: "Search disabled",
    				placeholder: "Search",
    				disabled: true
    			},
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(search0.$$.fragment);
    			t0 = space();
    			create_component(search1.$$.fragment);
    			t1 = space();
    			create_component(code.$$.fragment);
    			attr_dev(div, "class", "w-grid w-grid-container-2-20");
    			add_location(div, file$b, 6, 2, 202);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(search0, div, null);
    			append_dev(div, t0);
    			mount_component(search1, div, null);
    			insert_dev(target, t1, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(search0.$$.fragment, local);
    			transition_in(search1.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(search0.$$.fragment, local);
    			transition_out(search1.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(search0);
    			destroy_component(search1);
    			if (detaching) detach_dev(t1);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(6:0) <Panel title=\\\"Search\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				title: "Search",
    				shadow: true,
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel_changes.$$scope = { dirty, ctx };
    			}

    			panel.$set(panel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Searches", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Searches> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Search, Panel, Code });
    	return [];
    }

    class Searches extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Searches",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/pages/Switches.svelte generated by Svelte v3.29.7 */
    const file$c = "src/pages/Switches.svelte";

    // (18:2) <Code>
    function create_default_slot_1$5(ctx) {
    	let html_tag;
    	let raw_value = highlight("<Switch label=\"Switch {checked1 ? \"on\" : \"off\"}\" bind:checked />\n" + "<Switch label=\"Switch on (disabled)\" checked={true} disabled={true} />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$5.name,
    		type: "slot",
    		source: "(18:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (8:0) <Panel title="Switch" shadow={true}>
    function create_default_slot$5(ctx) {
    	let div0;
    	let switch0;
    	let updating_checked;
    	let t0;
    	let switch1;
    	let updating_checked_1;
    	let t1;
    	let div1;
    	let switch2;
    	let t2;
    	let switch3;
    	let t3;
    	let code;
    	let current;

    	function switch0_checked_binding(value) {
    		/*switch0_checked_binding*/ ctx[2].call(null, value);
    	}

    	let switch0_props = {
    		label: "Switch " + (/*checked*/ ctx[0] ? "on" : "off")
    	};

    	if (/*checked*/ ctx[0] !== void 0) {
    		switch0_props.checked = /*checked*/ ctx[0];
    	}

    	switch0 = new Switch({ props: switch0_props, $$inline: true });
    	binding_callbacks.push(() => bind(switch0, "checked", switch0_checked_binding));

    	function switch1_checked_binding(value) {
    		/*switch1_checked_binding*/ ctx[3].call(null, value);
    	}

    	let switch1_props = {
    		label: "Switch " + (/*checked2*/ ctx[1] ? "on" : "off")
    	};

    	if (/*checked2*/ ctx[1] !== void 0) {
    		switch1_props.checked = /*checked2*/ ctx[1];
    	}

    	switch1 = new Switch({ props: switch1_props, $$inline: true });
    	binding_callbacks.push(() => bind(switch1, "checked", switch1_checked_binding));

    	switch2 = new Switch({
    			props: {
    				label: "Switch off (disabled)",
    				checked: false,
    				disabled: true
    			},
    			$$inline: true
    		});

    	switch3 = new Switch({
    			props: {
    				label: "Switch on (disabled)",
    				checked: true,
    				disabled: true
    			},
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_1$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(switch0.$$.fragment);
    			t0 = space();
    			create_component(switch1.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(switch2.$$.fragment);
    			t2 = space();
    			create_component(switch3.$$.fragment);
    			t3 = space();
    			create_component(code.$$.fragment);
    			attr_dev(div0, "class", "w-grid w-grid-container-2-16");
    			add_location(div0, file$c, 8, 2, 244);
    			attr_dev(div1, "class", "w-grid w-grid-container-2-16");
    			add_location(div1, file$c, 12, 2, 446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(switch0, div0, null);
    			append_dev(div0, t0);
    			mount_component(switch1, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(switch2, div1, null);
    			append_dev(div1, t2);
    			mount_component(switch3, div1, null);
    			insert_dev(target, t3, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch0_changes = {};
    			if (dirty & /*checked*/ 1) switch0_changes.label = "Switch " + (/*checked*/ ctx[0] ? "on" : "off");

    			if (!updating_checked && dirty & /*checked*/ 1) {
    				updating_checked = true;
    				switch0_changes.checked = /*checked*/ ctx[0];
    				add_flush_callback(() => updating_checked = false);
    			}

    			switch0.$set(switch0_changes);
    			const switch1_changes = {};
    			if (dirty & /*checked2*/ 2) switch1_changes.label = "Switch " + (/*checked2*/ ctx[1] ? "on" : "off");

    			if (!updating_checked_1 && dirty & /*checked2*/ 2) {
    				updating_checked_1 = true;
    				switch1_changes.checked = /*checked2*/ ctx[1];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			switch1.$set(switch1_changes);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(switch0.$$.fragment, local);
    			transition_in(switch1.$$.fragment, local);
    			transition_in(switch2.$$.fragment, local);
    			transition_in(switch3.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(switch0.$$.fragment, local);
    			transition_out(switch1.$$.fragment, local);
    			transition_out(switch2.$$.fragment, local);
    			transition_out(switch3.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(switch0);
    			destroy_component(switch1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(switch2);
    			destroy_component(switch3);
    			if (detaching) detach_dev(t3);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(8:0) <Panel title=\\\"Switch\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				title: "Switch",
    				shadow: true,
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel_changes = {};

    			if (dirty & /*$$scope, checked2, checked*/ 19) {
    				panel_changes.$$scope = { dirty, ctx };
    			}

    			panel.$set(panel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Switches", slots, []);
    	let checked = false;
    	let checked2 = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Switches> was created with unknown prop '${key}'`);
    	});

    	function switch0_checked_binding(value) {
    		checked = value;
    		$$invalidate(0, checked);
    	}

    	function switch1_checked_binding(value) {
    		checked2 = value;
    		$$invalidate(1, checked2);
    	}

    	$$self.$capture_state = () => ({
    		highlight,
    		Switch,
    		Panel,
    		Code,
    		checked,
    		checked2
    	});

    	$$self.$inject_state = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("checked2" in $$props) $$invalidate(1, checked2 = $$props.checked2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [checked, checked2, switch0_checked_binding, switch1_checked_binding];
    }

    class Switches extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switches",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/pages/Tabs.svelte generated by Svelte v3.29.7 */
    const file$d = "src/pages/Tabs.svelte";

    // (26:0) <Panel title="Tabs component">
    function create_default_slot_4$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Tabs component is implemnted as a container for one or more tabs.";
    			add_location(p, file$d, 26, 2, 853);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$2.name,
    		type: "slot",
    		source: "(26:0) <Panel title=\\\"Tabs component\\\">",
    		ctx
    	});

    	return block;
    }

    // (39:2) <Code>
    function create_default_slot_3$4(ctx) {
    	let html_tag;
    	let raw_value = highlight("<script> \n" + "   const items = [ \n" + "     { title: \"Tab 1\", active: true }, \n" + "     { title: \"Tab 2\", active: false }, \n" + "     { title: \"Tab 3\", active: false }, \n" + "     { title: \"Tab 4\", active: false }, \n" + "   ]; \n" + "</script> \n\n" + "<Tabs bind:items={items} />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$4.name,
    		type: "slot",
    		source: "(39:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (32:0) <Panel title="Basic tabs" shadow={true}>
    function create_default_slot_2$4(ctx) {
    	let tabs;
    	let updating_items;
    	let t0;
    	let br0;
    	let br1;
    	let t1;
    	let strong;
    	let t3;
    	let t4_value = /*activeTab1*/ ctx[2][0].title + "";
    	let t4;
    	let t5;
    	let br2;
    	let t6;
    	let br3;
    	let t7;
    	let code;
    	let current;

    	function tabs_items_binding(value) {
    		/*tabs_items_binding*/ ctx[4].call(null, value);
    	}

    	let tabs_props = {};

    	if (/*items*/ ctx[0] !== void 0) {
    		tabs_props.items = /*items*/ ctx[0];
    	}

    	tabs = new Tabs({ props: tabs_props, $$inline: true });
    	binding_callbacks.push(() => bind(tabs, "items", tabs_items_binding));

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_3$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabs.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t1 = space();
    			strong = element("strong");
    			strong.textContent = "Active tab:";
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			br2 = element("br");
    			t6 = space();
    			br3 = element("br");
    			t7 = space();
    			create_component(code.$$.fragment);
    			add_location(br0, file$d, 33, 2, 1016);
    			add_location(br1, file$d, 33, 6, 1020);
    			add_location(strong, file$d, 34, 2, 1027);
    			add_location(br2, file$d, 35, 2, 1080);
    			add_location(br3, file$d, 36, 2, 1087);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabs, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, strong, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabs_changes = {};

    			if (!updating_items && dirty & /*items*/ 1) {
    				updating_items = true;
    				tabs_changes.items = /*items*/ ctx[0];
    				add_flush_callback(() => updating_items = false);
    			}

    			tabs.$set(tabs_changes);
    			if ((!current || dirty & /*activeTab1*/ 4) && t4_value !== (t4_value = /*activeTab1*/ ctx[2][0].title + "")) set_data_dev(t4, t4_value);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabs, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(strong);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t7);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(32:0) <Panel title=\\\"Basic tabs\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (60:2) <Code>
    function create_default_slot_1$6(ctx) {
    	let html_tag;
    	let raw_value = highlight("<script> \n" + "   const items = [ \n" + "     { title: \"Tab 1\", active: false, icon: \"icon-bell\" }, \n" + "     { title: \"Tab 2\", active: true, icon: \"icon-chat\" }, \n" + "     { title: \"Tab 3\", active: false, icon: \"icon-settings\" }, \n" + "     { title: \"Tab 4\", active: false, icon: \"icon-help\" }, \n" + "   ]; \n" + "</script> \n\n" + "<Tabs bind:{items} />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$6.name,
    		type: "slot",
    		source: "(60:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (53:0) <Panel title="Tabs with icons" shadow={true}>
    function create_default_slot$6(ctx) {
    	let tabs;
    	let updating_items;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let strong;
    	let t4;
    	let t5_value = /*activeTab2*/ ctx[3][0].title + "";
    	let t5;
    	let t6;
    	let br2;
    	let t7;
    	let br3;
    	let t8;
    	let code;
    	let current;

    	function tabs_items_binding_1(value) {
    		/*tabs_items_binding_1*/ ctx[5].call(null, value);
    	}

    	let tabs_props = {};

    	if (/*items1*/ ctx[1] !== void 0) {
    		tabs_props.items = /*items1*/ ctx[1];
    	}

    	tabs = new Tabs({ props: tabs_props, $$inline: true });
    	binding_callbacks.push(() => bind(tabs, "items", tabs_items_binding_1));

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_1$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabs.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			br1 = element("br");
    			t2 = space();
    			strong = element("strong");
    			strong.textContent = "Active tab:";
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			br2 = element("br");
    			t7 = space();
    			br3 = element("br");
    			t8 = space();
    			create_component(code.$$.fragment);
    			add_location(br0, file$d, 54, 2, 1572);
    			add_location(br1, file$d, 55, 2, 1579);
    			add_location(strong, file$d, 56, 2, 1586);
    			add_location(br2, file$d, 57, 2, 1639);
    			add_location(br3, file$d, 58, 2, 1646);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabs, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, strong, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t8, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabs_changes = {};

    			if (!updating_items && dirty & /*items1*/ 2) {
    				updating_items = true;
    				tabs_changes.items = /*items1*/ ctx[1];
    				add_flush_callback(() => updating_items = false);
    			}

    			tabs.$set(tabs_changes);
    			if ((!current || dirty & /*activeTab2*/ 8) && t5_value !== (t5_value = /*activeTab2*/ ctx[3][0].title + "")) set_data_dev(t5, t5_value);
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabs, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(strong);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t8);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(53:0) <Panel title=\\\"Tabs with icons\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let panel0;
    	let t0;
    	let panel1;
    	let t1;
    	let panel2;
    	let current;

    	panel0 = new Panel({
    			props: {
    				title: "Tabs component",
    				$$slots: { default: [create_default_slot_4$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel1 = new Panel({
    			props: {
    				title: "Basic tabs",
    				shadow: true,
    				$$slots: { default: [create_default_slot_2$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel2 = new Panel({
    			props: {
    				title: "Tabs with icons",
    				shadow: true,
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel0.$$.fragment);
    			t0 = space();
    			create_component(panel1.$$.fragment);
    			t1 = space();
    			create_component(panel2.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(panel1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(panel2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel0_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				panel0_changes.$$scope = { dirty, ctx };
    			}

    			panel0.$set(panel0_changes);
    			const panel1_changes = {};

    			if (dirty & /*$$scope, activeTab1, items*/ 69) {
    				panel1_changes.$$scope = { dirty, ctx };
    			}

    			panel1.$set(panel1_changes);
    			const panel2_changes = {};

    			if (dirty & /*$$scope, activeTab2, items1*/ 74) {
    				panel2_changes.$$scope = { dirty, ctx };
    			}

    			panel2.$set(panel2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel0.$$.fragment, local);
    			transition_in(panel1.$$.fragment, local);
    			transition_in(panel2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel0.$$.fragment, local);
    			transition_out(panel1.$$.fragment, local);
    			transition_out(panel2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(panel1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(panel2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", slots, []);
    	

    	let items = [
    		{ title: "Tab 1", active: true },
    		{ title: "Tab 2", active: false },
    		{ title: "Tab 3", active: false },
    		{ title: "Tab 4", active: false }
    	];

    	let items1 = [
    		{
    			title: "Tab 1",
    			active: false,
    			icon: "icon-bell"
    		},
    		{
    			title: "Tab 2",
    			active: true,
    			icon: "icon-chat"
    		},
    		{
    			title: "Tab 3",
    			active: false,
    			icon: "icon-settings"
    		},
    		{
    			title: "Tab 4",
    			active: false,
    			icon: "icon-help"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	function tabs_items_binding(value) {
    		items = value;
    		$$invalidate(0, items);
    	}

    	function tabs_items_binding_1(value) {
    		items1 = value;
    		$$invalidate(1, items1);
    	}

    	$$self.$capture_state = () => ({
    		highlight,
    		Panel,
    		Tabs,
    		Code,
    		items,
    		items1,
    		activeTab1,
    		activeTab2
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("items1" in $$props) $$invalidate(1, items1 = $$props.items1);
    		if ("activeTab1" in $$props) $$invalidate(2, activeTab1 = $$props.activeTab1);
    		if ("activeTab2" in $$props) $$invalidate(3, activeTab2 = $$props.activeTab2);
    	};

    	let activeTab1;
    	let activeTab2;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*items*/ 1) {
    			// const click = (event) => {
    			//   console.log(event)
    			//   items.forEach(t => t.active = event.detail === t.title);
    			//   items = items;
    			// }
    			 $$invalidate(2, activeTab1 = items.filter(t => t.active));
    		}

    		if ($$self.$$.dirty & /*items1*/ 2) {
    			 $$invalidate(3, activeTab2 = items1.filter(t => t.active));
    		}
    	};

    	return [
    		items,
    		items1,
    		activeTab1,
    		activeTab2,
    		tabs_items_binding,
    		tabs_items_binding_1
    	];
    }

    class Tabs_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs_1",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/pages/TextFields.svelte generated by Svelte v3.29.7 */
    const file$e = "src/pages/TextFields.svelte";

    // (11:2) <Code>
    function create_default_slot_7(ctx) {
    	let html_tag;
    	let raw_value = highlight("<TextField label=\"First Name\" placeholder=\"Enter your name\" />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(11:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (6:0) <Panel title="Standard Text Field" shadow={true}>
    function create_default_slot_6(ctx) {
    	let div;
    	let textfield;
    	let t;
    	let code;
    	let current;

    	textfield = new Textfield({
    			props: {
    				label: "First Name",
    				placeholder: "Enter your name"
    			},
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(textfield.$$.fragment);
    			t = space();
    			create_component(code.$$.fragment);
    			add_location(div, file$e, 6, 2, 218);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(textfield, div, null);
    			insert_dev(target, t, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(textfield);
    			if (detaching) detach_dev(t);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(6:0) <Panel title=\\\"Standard Text Field\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (19:2) <Code>
    function create_default_slot_5(ctx) {
    	let html_tag;
    	let raw_value = highlight("<TextField label=\"Last Name\" placeholder=\"Enter your name\" disabled={true}/>") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(19:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (16:0) <Panel title="Disabled Text Field" shadow={true}>
    function create_default_slot_4$3(ctx) {
    	let textfield;
    	let t;
    	let code;
    	let current;

    	textfield = new Textfield({
    			props: {
    				label: "Last Name",
    				placeholder: "Enter your name",
    				disabled: true
    			},
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    			t = space();
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$3.name,
    		type: "slot",
    		source: "(16:0) <Panel title=\\\"Disabled Text Field\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (34:2) <Code>
    function create_default_slot_3$5(ctx) {
    	let html_tag;
    	let raw_value = highlight("<TextField label=\"Phone\" value=\"178 35 456666\" valid={true}/>\n" + "<TextField label=\"Phone disabled\" value=\"178 35 4566366\" valid={true} disabled={true} />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$5.name,
    		type: "slot",
    		source: "(34:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (24:0) <Panel title="Valid Text Field" shadow={true}>
    function create_default_slot_2$5(ctx) {
    	let div;
    	let textfield0;
    	let t0;
    	let textfield1;
    	let t1;
    	let code;
    	let current;

    	textfield0 = new Textfield({
    			props: {
    				label: "Phone",
    				value: "178 35 456666",
    				valid: true
    			},
    			$$inline: true
    		});

    	textfield1 = new Textfield({
    			props: {
    				label: "Phone disabled",
    				value: "178 35 4566366",
    				valid: true,
    				disabled: true
    			},
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_3$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(textfield0.$$.fragment);
    			t0 = space();
    			create_component(textfield1.$$.fragment);
    			t1 = space();
    			create_component(code.$$.fragment);
    			attr_dev(div, "class", "w-grid w-grid-container-2-16");
    			add_location(div, file$e, 24, 2, 729);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(textfield0, div, null);
    			append_dev(div, t0);
    			mount_component(textfield1, div, null);
    			insert_dev(target, t1, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(textfield0);
    			destroy_component(textfield1);
    			if (detaching) detach_dev(t1);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$5.name,
    		type: "slot",
    		source: "(24:0) <Panel title=\\\"Valid Text Field\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (49:2) <Code>
    function create_default_slot_1$7(ctx) {
    	let html_tag;
    	let raw_value = highlight("<TextField label=\"Phone\" value=\"178 35 456666\" valid={false}/>\n" + "<TextField label=\"Phone disabled\" value=\"178 35 4566366\" valid={false} disabled={true} />") + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$7.name,
    		type: "slot",
    		source: "(49:2) <Code>",
    		ctx
    	});

    	return block;
    }

    // (39:0) <Panel title="Invalid Text Field" shadow={true}>
    function create_default_slot$7(ctx) {
    	let div;
    	let textfield0;
    	let t0;
    	let textfield1;
    	let t1;
    	let code;
    	let current;

    	textfield0 = new Textfield({
    			props: {
    				label: "Phone",
    				value: "178 35 456",
    				valid: false
    			},
    			$$inline: true
    		});

    	textfield1 = new Textfield({
    			props: {
    				label: "Phone disabled",
    				value: "178 35 4566",
    				valid: false,
    				disabled: true
    			},
    			$$inline: true
    		});

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_1$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(textfield0.$$.fragment);
    			t0 = space();
    			create_component(textfield1.$$.fragment);
    			t1 = space();
    			create_component(code.$$.fragment);
    			attr_dev(div, "class", "w-grid w-grid-container-2-16");
    			add_location(div, file$e, 39, 2, 1228);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(textfield0, div, null);
    			append_dev(div, t0);
    			mount_component(textfield1, div, null);
    			insert_dev(target, t1, anchor);
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(textfield0);
    			destroy_component(textfield1);
    			if (detaching) detach_dev(t1);
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(39:0) <Panel title=\\\"Invalid Text Field\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let panel0;
    	let t0;
    	let panel1;
    	let t1;
    	let panel2;
    	let t2;
    	let panel3;
    	let current;

    	panel0 = new Panel({
    			props: {
    				title: "Standard Text Field",
    				shadow: true,
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel1 = new Panel({
    			props: {
    				title: "Disabled Text Field",
    				shadow: true,
    				$$slots: { default: [create_default_slot_4$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel2 = new Panel({
    			props: {
    				title: "Valid Text Field",
    				shadow: true,
    				$$slots: { default: [create_default_slot_2$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel3 = new Panel({
    			props: {
    				title: "Invalid Text Field",
    				shadow: true,
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel0.$$.fragment);
    			t0 = space();
    			create_component(panel1.$$.fragment);
    			t1 = space();
    			create_component(panel2.$$.fragment);
    			t2 = space();
    			create_component(panel3.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(panel1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(panel2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(panel3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel0_changes.$$scope = { dirty, ctx };
    			}

    			panel0.$set(panel0_changes);
    			const panel1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel1_changes.$$scope = { dirty, ctx };
    			}

    			panel1.$set(panel1_changes);
    			const panel2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel2_changes.$$scope = { dirty, ctx };
    			}

    			panel2.$set(panel2_changes);
    			const panel3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				panel3_changes.$$scope = { dirty, ctx };
    			}

    			panel3.$set(panel3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel0.$$.fragment, local);
    			transition_in(panel1.$$.fragment, local);
    			transition_in(panel2.$$.fragment, local);
    			transition_in(panel3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel0.$$.fragment, local);
    			transition_out(panel1.$$.fragment, local);
    			transition_out(panel2.$$.fragment, local);
    			transition_out(panel3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(panel1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(panel2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(panel3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextFields", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextFields> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Panel, TextField: Textfield, Code });
    	return [];
    }

    class TextFields extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextFields",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    var pages = {
        Buttons,
        Dividers,
        Grids,
        Panels,
        Searches,
        Switches,
        Tabs: Tabs_1,
        TextFields
    };

    /* src/components/sidebar/index.svelte generated by Svelte v3.29.7 */
    const file$f = "src/components/sidebar/index.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i].path;
    	child_ctx[1] = list[i].title;
    	return child_ctx;
    }

    // (8:2) {#each routes as { path, title }}
    function create_each_block$1(ctx) {
    	let a;
    	let t_value = /*title*/ ctx[1] + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*path*/ ctx[3]);
    			attr_dev(a, "class", "w-sidebar-link");
    			toggle_class(a, "w-sidebar-link-active", /*$router*/ ctx[2] === /*path*/ ctx[3]);
    			add_location(a, file$f, 8, 4, 209);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*routes*/ 1 && t_value !== (t_value = /*title*/ ctx[1] + "")) set_data_dev(t, t_value);

    			if (dirty & /*routes*/ 1 && a_href_value !== (a_href_value = /*path*/ ctx[3])) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$router, routes*/ 5) {
    				toggle_class(a, "w-sidebar-link-active", /*$router*/ ctx[2] === /*path*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(8:2) {#each routes as { path, title }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let each_value = /*routes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "w-logo");
    			add_location(div0, file$f, 5, 0, 111);
    			attr_dev(div1, "class", "w-sidebar");
    			add_location(div1, file$f, 6, 0, 145);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (dirty & /*routes, $router*/ 5) {
    				each_value = /*routes*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $router;
    	validate_store(router, "router");
    	component_subscribe($$self, router, $$value => $$invalidate(2, $router = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", slots, []);
    	let { title } = $$props;
    	let { routes } = $$props;
    	const writable_props = ["title", "routes"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("routes" in $$props) $$invalidate(0, routes = $$props.routes);
    	};

    	$$self.$capture_state = () => ({ router, title, routes, $router });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("routes" in $$props) $$invalidate(0, routes = $$props.routes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [routes, title, $router];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { title: 1, routes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'title'");
    		}

    		if (/*routes*/ ctx[0] === undefined && !("routes" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'routes'");
    		}
    	}

    	get title() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get routes() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.7 */
    const file$g = "src/App.svelte";

    function create_fragment$h(ctx) {
    	let div;
    	let aside;
    	let sidebar;
    	let t;
    	let main;
    	let switch_instance;
    	let current;

    	sidebar = new Sidebar({
    			props: { title, routes: /*routes*/ ctx[1] },
    			$$inline: true
    		});

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			aside = element("aside");
    			create_component(sidebar.$$.fragment);
    			t = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			add_location(aside, file$g, 30, 2, 1129);
    			add_location(main, file$g, 33, 2, 1183);
    			attr_dev(div, "class", "w-container");
    			add_location(div, file$g, 29, 0, 1101);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, aside);
    			mount_component(sidebar, aside, null);
    			append_dev(div, t);
    			append_dev(div, main);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(sidebar);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const title = "Components Library";

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const routes = [
    		{
    			path: "/",
    			title: "Button",
    			component: pages.Buttons
    		},
    		{
    			path: "/divider",
    			title: "Divider",
    			component: pages.Dividers
    		},
    		{
    			path: "/grid",
    			title: "Grid",
    			component: pages.Grids
    		},
    		{
    			path: "/panel",
    			title: "Panel",
    			component: pages.Panels
    		},
    		{
    			path: "/search",
    			title: "Search",
    			component: pages.Searches
    		},
    		{
    			path: "/switch",
    			title: "Switch",
    			component: pages.Switches
    		},
    		{
    			path: "/tabs",
    			title: "Tabs",
    			component: pages.Tabs
    		},
    		{
    			path: "/textfield",
    			title: "Text Field",
    			component: pages.TextFields
    		}
    	];

    	// set default component
    	let component = pages.Buttons;

    	// Map routes to page. If a route is hit the current
    	// reference is set to the route's component
    	routes.forEach(route => {
    		page_js(route.path, () => {
    			router.setPath(route.path);
    			$$invalidate(0, component = route.component);
    		});
    	});

    	// activate router
    	page_js.start();

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		page: page_js,
    		router,
    		pages,
    		Sidebar,
    		title,
    		routes,
    		component
    	});

    	$$self.$inject_state = $$props => {
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [component, routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=components.js.map
