
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
    /* **********************************************
         Begin prism-core.js
    ********************************************** */

    /// <reference lib="WebWorker"/>

    var _self = (typeof window !== 'undefined')
    	? window   // if in browser
    	: (
    		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
    		? self // if in worker
    		: {}   // if in node js
    	);

    /**
     * Prism: Lightweight, robust, elegant syntax highlighting
     *
     * @license MIT <https://opensource.org/licenses/MIT>
     * @author Lea Verou <https://lea.verou.me>
     * @namespace
     * @public
     */
    var Prism = (function (_self){

    // Private helper vars
    var lang = /\blang(?:uage)?-([\w-]+)\b/i;
    var uniqueId = 0;


    var _ = {
    	/**
    	 * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
    	 * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
    	 * additional languages or plugins yourself.
    	 *
    	 * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
    	 *
    	 * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
    	 * empty Prism object into the global scope before loading the Prism script like this:
    	 *
    	 * ```js
    	 * window.Prism = window.Prism || {};
    	 * Prism.manual = true;
    	 * // add a new <script> to load Prism's script
    	 * ```
    	 *
    	 * @default false
    	 * @type {boolean}
    	 * @memberof Prism
    	 * @public
    	 */
    	manual: _self.Prism && _self.Prism.manual,
    	disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

    	/**
    	 * A namespace for utility methods.
    	 *
    	 * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
    	 * change or disappear at any time.
    	 *
    	 * @namespace
    	 * @memberof Prism
    	 */
    	util: {
    		encode: function encode(tokens) {
    			if (tokens instanceof Token) {
    				return new Token(tokens.type, encode(tokens.content), tokens.alias);
    			} else if (Array.isArray(tokens)) {
    				return tokens.map(encode);
    			} else {
    				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
    			}
    		},

    		/**
    		 * Returns the name of the type of the given value.
    		 *
    		 * @param {any} o
    		 * @returns {string}
    		 * @example
    		 * type(null)      === 'Null'
    		 * type(undefined) === 'Undefined'
    		 * type(123)       === 'Number'
    		 * type('foo')     === 'String'
    		 * type(true)      === 'Boolean'
    		 * type([1, 2])    === 'Array'
    		 * type({})        === 'Object'
    		 * type(String)    === 'Function'
    		 * type(/abc+/)    === 'RegExp'
    		 */
    		type: function (o) {
    			return Object.prototype.toString.call(o).slice(8, -1);
    		},

    		/**
    		 * Returns a unique number for the given object. Later calls will still return the same number.
    		 *
    		 * @param {Object} obj
    		 * @returns {number}
    		 */
    		objId: function (obj) {
    			if (!obj['__id']) {
    				Object.defineProperty(obj, '__id', { value: ++uniqueId });
    			}
    			return obj['__id'];
    		},

    		/**
    		 * Creates a deep clone of the given object.
    		 *
    		 * The main intended use of this function is to clone language definitions.
    		 *
    		 * @param {T} o
    		 * @param {Record<number, any>} [visited]
    		 * @returns {T}
    		 * @template T
    		 */
    		clone: function deepClone(o, visited) {
    			visited = visited || {};

    			var clone, id;
    			switch (_.util.type(o)) {
    				case 'Object':
    					id = _.util.objId(o);
    					if (visited[id]) {
    						return visited[id];
    					}
    					clone = /** @type {Record<string, any>} */ ({});
    					visited[id] = clone;

    					for (var key in o) {
    						if (o.hasOwnProperty(key)) {
    							clone[key] = deepClone(o[key], visited);
    						}
    					}

    					return /** @type {any} */ (clone);

    				case 'Array':
    					id = _.util.objId(o);
    					if (visited[id]) {
    						return visited[id];
    					}
    					clone = [];
    					visited[id] = clone;

    					(/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
    						clone[i] = deepClone(v, visited);
    					});

    					return /** @type {any} */ (clone);

    				default:
    					return o;
    			}
    		},

    		/**
    		 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
    		 *
    		 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
    		 *
    		 * @param {Element} element
    		 * @returns {string}
    		 */
    		getLanguage: function (element) {
    			while (element && !lang.test(element.className)) {
    				element = element.parentElement;
    			}
    			if (element) {
    				return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
    			}
    			return 'none';
    		},

    		/**
    		 * Returns the script element that is currently executing.
    		 *
    		 * This does __not__ work for line script element.
    		 *
    		 * @returns {HTMLScriptElement | null}
    		 */
    		currentScript: function () {
    			if (typeof document === 'undefined') {
    				return null;
    			}
    			if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */) {
    				return /** @type {any} */ (document.currentScript);
    			}

    			// IE11 workaround
    			// we'll get the src of the current script by parsing IE11's error stack trace
    			// this will not work for inline scripts

    			try {
    				throw new Error();
    			} catch (err) {
    				// Get file src url from stack. Specifically works with the format of stack traces in IE.
    				// A stack will look like this:
    				//
    				// Error
    				//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
    				//    at Global code (http://localhost/components/prism-core.js:606:1)

    				var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];
    				if (src) {
    					var scripts = document.getElementsByTagName('script');
    					for (var i in scripts) {
    						if (scripts[i].src == src) {
    							return scripts[i];
    						}
    					}
    				}
    				return null;
    			}
    		},

    		/**
    		 * Returns whether a given class is active for `element`.
    		 *
    		 * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
    		 * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
    		 * given class is just the given class with a `no-` prefix.
    		 *
    		 * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
    		 * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
    		 * ancestors have the given class or the negated version of it, then the default activation will be returned.
    		 *
    		 * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
    		 * version of it, the class is considered active.
    		 *
    		 * @param {Element} element
    		 * @param {string} className
    		 * @param {boolean} [defaultActivation=false]
    		 * @returns {boolean}
    		 */
    		isActive: function (element, className, defaultActivation) {
    			var no = 'no-' + className;

    			while (element) {
    				var classList = element.classList;
    				if (classList.contains(className)) {
    					return true;
    				}
    				if (classList.contains(no)) {
    					return false;
    				}
    				element = element.parentElement;
    			}
    			return !!defaultActivation;
    		}
    	},

    	/**
    	 * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
    	 *
    	 * @namespace
    	 * @memberof Prism
    	 * @public
    	 */
    	languages: {
    		/**
    		 * Creates a deep copy of the language with the given id and appends the given tokens.
    		 *
    		 * If a token in `redef` also appears in the copied language, then the existing token in the copied language
    		 * will be overwritten at its original position.
    		 *
    		 * ## Best practices
    		 *
    		 * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
    		 * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
    		 * understand the language definition because, normally, the order of tokens matters in Prism grammars.
    		 *
    		 * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
    		 * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
    		 *
    		 * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
    		 * @param {Grammar} redef The new tokens to append.
    		 * @returns {Grammar} The new language created.
    		 * @public
    		 * @example
    		 * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
    		 *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
    		 *     // at its original position
    		 *     'comment': { ... },
    		 *     // CSS doesn't have a 'color' token, so this token will be appended
    		 *     'color': /\b(?:red|green|blue)\b/
    		 * });
    		 */
    		extend: function (id, redef) {
    			var lang = _.util.clone(_.languages[id]);

    			for (var key in redef) {
    				lang[key] = redef[key];
    			}

    			return lang;
    		},

    		/**
    		 * Inserts tokens _before_ another token in a language definition or any other grammar.
    		 *
    		 * ## Usage
    		 *
    		 * This helper method makes it easy to modify existing languages. For example, the CSS language definition
    		 * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
    		 * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
    		 * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
    		 * this:
    		 *
    		 * ```js
    		 * Prism.languages.markup.style = {
    		 *     // token
    		 * };
    		 * ```
    		 *
    		 * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
    		 * before existing tokens. For the CSS example above, you would use it like this:
    		 *
    		 * ```js
    		 * Prism.languages.insertBefore('markup', 'cdata', {
    		 *     'style': {
    		 *         // token
    		 *     }
    		 * });
    		 * ```
    		 *
    		 * ## Special cases
    		 *
    		 * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
    		 * will be ignored.
    		 *
    		 * This behavior can be used to insert tokens after `before`:
    		 *
    		 * ```js
    		 * Prism.languages.insertBefore('markup', 'comment', {
    		 *     'comment': Prism.languages.markup.comment,
    		 *     // tokens after 'comment'
    		 * });
    		 * ```
    		 *
    		 * ## Limitations
    		 *
    		 * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
    		 * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
    		 * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
    		 * deleting properties which is necessary to insert at arbitrary positions.
    		 *
    		 * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
    		 * Instead, it will create a new object and replace all references to the target object with the new one. This
    		 * can be done without temporarily deleting properties, so the iteration order is well-defined.
    		 *
    		 * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
    		 * you hold the target object in a variable, then the value of the variable will not change.
    		 *
    		 * ```js
    		 * var oldMarkup = Prism.languages.markup;
    		 * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
    		 *
    		 * assert(oldMarkup !== Prism.languages.markup);
    		 * assert(newMarkup === Prism.languages.markup);
    		 * ```
    		 *
    		 * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
    		 * object to be modified.
    		 * @param {string} before The key to insert before.
    		 * @param {Grammar} insert An object containing the key-value pairs to be inserted.
    		 * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
    		 * object to be modified.
    		 *
    		 * Defaults to `Prism.languages`.
    		 * @returns {Grammar} The new grammar object.
    		 * @public
    		 */
    		insertBefore: function (inside, before, insert, root) {
    			root = root || /** @type {any} */ (_.languages);
    			var grammar = root[inside];
    			/** @type {Grammar} */
    			var ret = {};

    			for (var token in grammar) {
    				if (grammar.hasOwnProperty(token)) {

    					if (token == before) {
    						for (var newToken in insert) {
    							if (insert.hasOwnProperty(newToken)) {
    								ret[newToken] = insert[newToken];
    							}
    						}
    					}

    					// Do not insert token which also occur in insert. See #1525
    					if (!insert.hasOwnProperty(token)) {
    						ret[token] = grammar[token];
    					}
    				}
    			}

    			var old = root[inside];
    			root[inside] = ret;

    			// Update references in other language definitions
    			_.languages.DFS(_.languages, function(key, value) {
    				if (value === old && key != inside) {
    					this[key] = ret;
    				}
    			});

    			return ret;
    		},

    		// Traverse a language definition with Depth First Search
    		DFS: function DFS(o, callback, type, visited) {
    			visited = visited || {};

    			var objId = _.util.objId;

    			for (var i in o) {
    				if (o.hasOwnProperty(i)) {
    					callback.call(o, i, o[i], type || i);

    					var property = o[i],
    					    propertyType = _.util.type(property);

    					if (propertyType === 'Object' && !visited[objId(property)]) {
    						visited[objId(property)] = true;
    						DFS(property, callback, null, visited);
    					}
    					else if (propertyType === 'Array' && !visited[objId(property)]) {
    						visited[objId(property)] = true;
    						DFS(property, callback, i, visited);
    					}
    				}
    			}
    		}
    	},

    	plugins: {},

    	/**
    	 * This is the most high-level function in Prism’s API.
    	 * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
    	 * each one of them.
    	 *
    	 * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
    	 *
    	 * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
    	 * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
    	 * @memberof Prism
    	 * @public
    	 */
    	highlightAll: function(async, callback) {
    		_.highlightAllUnder(document, async, callback);
    	},

    	/**
    	 * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
    	 * {@link Prism.highlightElement} on each one of them.
    	 *
    	 * The following hooks will be run:
    	 * 1. `before-highlightall`
    	 * 2. `before-all-elements-highlight`
    	 * 3. All hooks of {@link Prism.highlightElement} for each element.
    	 *
    	 * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
    	 * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
    	 * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
    	 * @memberof Prism
    	 * @public
    	 */
    	highlightAllUnder: function(container, async, callback) {
    		var env = {
    			callback: callback,
    			container: container,
    			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
    		};

    		_.hooks.run('before-highlightall', env);

    		env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

    		_.hooks.run('before-all-elements-highlight', env);

    		for (var i = 0, element; element = env.elements[i++];) {
    			_.highlightElement(element, async === true, env.callback);
    		}
    	},

    	/**
    	 * Highlights the code inside a single element.
    	 *
    	 * The following hooks will be run:
    	 * 1. `before-sanity-check`
    	 * 2. `before-highlight`
    	 * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
    	 * 4. `before-insert`
    	 * 5. `after-highlight`
    	 * 6. `complete`
    	 *
    	 * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
    	 * the element's language.
    	 *
    	 * @param {Element} element The element containing the code.
    	 * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
    	 * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
    	 * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
    	 * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
    	 *
    	 * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
    	 * asynchronous highlighting to work. You can build your own bundle on the
    	 * [Download page](https://prismjs.com/download.html).
    	 * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
    	 * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
    	 * @memberof Prism
    	 * @public
    	 */
    	highlightElement: function(element, async, callback) {
    		// Find language
    		var language = _.util.getLanguage(element);
    		var grammar = _.languages[language];

    		// Set language on the element, if not present
    		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

    		// Set language on the parent, for styling
    		var parent = element.parentElement;
    		if (parent && parent.nodeName.toLowerCase() === 'pre') {
    			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
    		}

    		var code = element.textContent;

    		var env = {
    			element: element,
    			language: language,
    			grammar: grammar,
    			code: code
    		};

    		function insertHighlightedCode(highlightedCode) {
    			env.highlightedCode = highlightedCode;

    			_.hooks.run('before-insert', env);

    			env.element.innerHTML = env.highlightedCode;

    			_.hooks.run('after-highlight', env);
    			_.hooks.run('complete', env);
    			callback && callback.call(env.element);
    		}

    		_.hooks.run('before-sanity-check', env);

    		if (!env.code) {
    			_.hooks.run('complete', env);
    			callback && callback.call(env.element);
    			return;
    		}

    		_.hooks.run('before-highlight', env);

    		if (!env.grammar) {
    			insertHighlightedCode(_.util.encode(env.code));
    			return;
    		}

    		if (async && _self.Worker) {
    			var worker = new Worker(_.filename);

    			worker.onmessage = function(evt) {
    				insertHighlightedCode(evt.data);
    			};

    			worker.postMessage(JSON.stringify({
    				language: env.language,
    				code: env.code,
    				immediateClose: true
    			}));
    		}
    		else {
    			insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
    		}
    	},

    	/**
    	 * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
    	 * and the language definitions to use, and returns a string with the HTML produced.
    	 *
    	 * The following hooks will be run:
    	 * 1. `before-tokenize`
    	 * 2. `after-tokenize`
    	 * 3. `wrap`: On each {@link Token}.
    	 *
    	 * @param {string} text A string with the code to be highlighted.
    	 * @param {Grammar} grammar An object containing the tokens to use.
    	 *
    	 * Usually a language definition like `Prism.languages.markup`.
    	 * @param {string} language The name of the language definition passed to `grammar`.
    	 * @returns {string} The highlighted HTML.
    	 * @memberof Prism
    	 * @public
    	 * @example
    	 * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
    	 */
    	highlight: function (text, grammar, language) {
    		var env = {
    			code: text,
    			grammar: grammar,
    			language: language
    		};
    		_.hooks.run('before-tokenize', env);
    		env.tokens = _.tokenize(env.code, env.grammar);
    		_.hooks.run('after-tokenize', env);
    		return Token.stringify(_.util.encode(env.tokens), env.language);
    	},

    	/**
    	 * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
    	 * and the language definitions to use, and returns an array with the tokenized code.
    	 *
    	 * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
    	 *
    	 * This method could be useful in other contexts as well, as a very crude parser.
    	 *
    	 * @param {string} text A string with the code to be highlighted.
    	 * @param {Grammar} grammar An object containing the tokens to use.
    	 *
    	 * Usually a language definition like `Prism.languages.markup`.
    	 * @returns {TokenStream} An array of strings and tokens, a token stream.
    	 * @memberof Prism
    	 * @public
    	 * @example
    	 * let code = `var foo = 0;`;
    	 * let tokens = Prism.tokenize(code, Prism.languages.javascript);
    	 * tokens.forEach(token => {
    	 *     if (token instanceof Prism.Token && token.type === 'number') {
    	 *         console.log(`Found numeric literal: ${token.content}`);
    	 *     }
    	 * });
    	 */
    	tokenize: function(text, grammar) {
    		var rest = grammar.rest;
    		if (rest) {
    			for (var token in rest) {
    				grammar[token] = rest[token];
    			}

    			delete grammar.rest;
    		}

    		var tokenList = new LinkedList();
    		addAfter(tokenList, tokenList.head, text);

    		matchGrammar(text, tokenList, grammar, tokenList.head, 0);

    		return toArray(tokenList);
    	},

    	/**
    	 * @namespace
    	 * @memberof Prism
    	 * @public
    	 */
    	hooks: {
    		all: {},

    		/**
    		 * Adds the given callback to the list of callbacks for the given hook.
    		 *
    		 * The callback will be invoked when the hook it is registered for is run.
    		 * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
    		 *
    		 * One callback function can be registered to multiple hooks and the same hook multiple times.
    		 *
    		 * @param {string} name The name of the hook.
    		 * @param {HookCallback} callback The callback function which is given environment variables.
    		 * @public
    		 */
    		add: function (name, callback) {
    			var hooks = _.hooks.all;

    			hooks[name] = hooks[name] || [];

    			hooks[name].push(callback);
    		},

    		/**
    		 * Runs a hook invoking all registered callbacks with the given environment variables.
    		 *
    		 * Callbacks will be invoked synchronously and in the order in which they were registered.
    		 *
    		 * @param {string} name The name of the hook.
    		 * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
    		 * @public
    		 */
    		run: function (name, env) {
    			var callbacks = _.hooks.all[name];

    			if (!callbacks || !callbacks.length) {
    				return;
    			}

    			for (var i=0, callback; callback = callbacks[i++];) {
    				callback(env);
    			}
    		}
    	},

    	Token: Token
    };
    _self.Prism = _;


    // Typescript note:
    // The following can be used to import the Token type in JSDoc:
    //
    //   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

    /**
     * Creates a new token.
     *
     * @param {string} type See {@link Token#type type}
     * @param {string | TokenStream} content See {@link Token#content content}
     * @param {string|string[]} [alias] The alias(es) of the token.
     * @param {string} [matchedStr=""] A copy of the full string this token was created from.
     * @class
     * @global
     * @public
     */
    function Token(type, content, alias, matchedStr) {
    	/**
    	 * The type of the token.
    	 *
    	 * This is usually the key of a pattern in a {@link Grammar}.
    	 *
    	 * @type {string}
    	 * @see GrammarToken
    	 * @public
    	 */
    	this.type = type;
    	/**
    	 * The strings or tokens contained by this token.
    	 *
    	 * This will be a token stream if the pattern matched also defined an `inside` grammar.
    	 *
    	 * @type {string | TokenStream}
    	 * @public
    	 */
    	this.content = content;
    	/**
    	 * The alias(es) of the token.
    	 *
    	 * @type {string|string[]}
    	 * @see GrammarToken
    	 * @public
    	 */
    	this.alias = alias;
    	// Copy of the full string this token was created from
    	this.length = (matchedStr || '').length | 0;
    }

    /**
     * A token stream is an array of strings and {@link Token Token} objects.
     *
     * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
     * them.
     *
     * 1. No adjacent strings.
     * 2. No empty strings.
     *
     *    The only exception here is the token stream that only contains the empty string and nothing else.
     *
     * @typedef {Array<string | Token>} TokenStream
     * @global
     * @public
     */

    /**
     * Converts the given token or token stream to an HTML representation.
     *
     * The following hooks will be run:
     * 1. `wrap`: On each {@link Token}.
     *
     * @param {string | Token | TokenStream} o The token or token stream to be converted.
     * @param {string} language The name of current language.
     * @returns {string} The HTML representation of the token or token stream.
     * @memberof Token
     * @static
     */
    Token.stringify = function stringify(o, language) {
    	if (typeof o == 'string') {
    		return o;
    	}
    	if (Array.isArray(o)) {
    		var s = '';
    		o.forEach(function (e) {
    			s += stringify(e, language);
    		});
    		return s;
    	}

    	var env = {
    		type: o.type,
    		content: stringify(o.content, language),
    		tag: 'span',
    		classes: ['token', o.type],
    		attributes: {},
    		language: language
    	};

    	var aliases = o.alias;
    	if (aliases) {
    		if (Array.isArray(aliases)) {
    			Array.prototype.push.apply(env.classes, aliases);
    		} else {
    			env.classes.push(aliases);
    		}
    	}

    	_.hooks.run('wrap', env);

    	var attributes = '';
    	for (var name in env.attributes) {
    		attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
    	}

    	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    };

    /**
     * @param {string} text
     * @param {LinkedList<string | Token>} tokenList
     * @param {any} grammar
     * @param {LinkedListNode<string | Token>} startNode
     * @param {number} startPos
     * @param {RematchOptions} [rematch]
     * @returns {void}
     * @private
     *
     * @typedef RematchOptions
     * @property {string} cause
     * @property {number} reach
     */
    function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
    	for (var token in grammar) {
    		if (!grammar.hasOwnProperty(token) || !grammar[token]) {
    			continue;
    		}

    		var patterns = grammar[token];
    		patterns = Array.isArray(patterns) ? patterns : [patterns];

    		for (var j = 0; j < patterns.length; ++j) {
    			if (rematch && rematch.cause == token + ',' + j) {
    				return;
    			}

    			var patternObj = patterns[j],
    				inside = patternObj.inside,
    				lookbehind = !!patternObj.lookbehind,
    				greedy = !!patternObj.greedy,
    				lookbehindLength = 0,
    				alias = patternObj.alias;

    			if (greedy && !patternObj.pattern.global) {
    				// Without the global flag, lastIndex won't work
    				var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
    				patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
    			}

    			/** @type {RegExp} */
    			var pattern = patternObj.pattern || patternObj;

    			for ( // iterate the token list and keep track of the current token/string position
    				var currentNode = startNode.next, pos = startPos;
    				currentNode !== tokenList.tail;
    				pos += currentNode.value.length, currentNode = currentNode.next
    			) {

    				if (rematch && pos >= rematch.reach) {
    					break;
    				}

    				var str = currentNode.value;

    				if (tokenList.length > text.length) {
    					// Something went terribly wrong, ABORT, ABORT!
    					return;
    				}

    				if (str instanceof Token) {
    					continue;
    				}

    				var removeCount = 1; // this is the to parameter of removeBetween

    				if (greedy && currentNode != tokenList.tail.prev) {
    					pattern.lastIndex = pos;
    					var match = pattern.exec(text);
    					if (!match) {
    						break;
    					}

    					var from = match.index + (lookbehind && match[1] ? match[1].length : 0);
    					var to = match.index + match[0].length;
    					var p = pos;

    					// find the node that contains the match
    					p += currentNode.value.length;
    					while (from >= p) {
    						currentNode = currentNode.next;
    						p += currentNode.value.length;
    					}
    					// adjust pos (and p)
    					p -= currentNode.value.length;
    					pos = p;

    					// the current node is a Token, then the match starts inside another Token, which is invalid
    					if (currentNode.value instanceof Token) {
    						continue;
    					}

    					// find the last node which is affected by this match
    					for (
    						var k = currentNode;
    						k !== tokenList.tail && (p < to || typeof k.value === 'string');
    						k = k.next
    					) {
    						removeCount++;
    						p += k.value.length;
    					}
    					removeCount--;

    					// replace with the new match
    					str = text.slice(pos, p);
    					match.index -= pos;
    				} else {
    					pattern.lastIndex = 0;

    					var match = pattern.exec(str);
    				}

    				if (!match) {
    					continue;
    				}

    				if (lookbehind) {
    					lookbehindLength = match[1] ? match[1].length : 0;
    				}

    				var from = match.index + lookbehindLength,
    					matchStr = match[0].slice(lookbehindLength),
    					to = from + matchStr.length,
    					before = str.slice(0, from),
    					after = str.slice(to);

    				var reach = pos + str.length;
    				if (rematch && reach > rematch.reach) {
    					rematch.reach = reach;
    				}

    				var removeFrom = currentNode.prev;

    				if (before) {
    					removeFrom = addAfter(tokenList, removeFrom, before);
    					pos += before.length;
    				}

    				removeRange(tokenList, removeFrom, removeCount);

    				var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
    				currentNode = addAfter(tokenList, removeFrom, wrapped);

    				if (after) {
    					addAfter(tokenList, currentNode, after);
    				}

    				if (removeCount > 1) {
    					// at least one Token object was removed, so we have to do some rematching
    					// this can only happen if the current pattern is greedy
    					matchGrammar(text, tokenList, grammar, currentNode.prev, pos, {
    						cause: token + ',' + j,
    						reach: reach
    					});
    				}
    			}
    		}
    	}
    }

    /**
     * @typedef LinkedListNode
     * @property {T} value
     * @property {LinkedListNode<T> | null} prev The previous node.
     * @property {LinkedListNode<T> | null} next The next node.
     * @template T
     * @private
     */

    /**
     * @template T
     * @private
     */
    function LinkedList() {
    	/** @type {LinkedListNode<T>} */
    	var head = { value: null, prev: null, next: null };
    	/** @type {LinkedListNode<T>} */
    	var tail = { value: null, prev: head, next: null };
    	head.next = tail;

    	/** @type {LinkedListNode<T>} */
    	this.head = head;
    	/** @type {LinkedListNode<T>} */
    	this.tail = tail;
    	this.length = 0;
    }

    /**
     * Adds a new node with the given value to the list.
     * @param {LinkedList<T>} list
     * @param {LinkedListNode<T>} node
     * @param {T} value
     * @returns {LinkedListNode<T>} The added node.
     * @template T
     */
    function addAfter(list, node, value) {
    	// assumes that node != list.tail && values.length >= 0
    	var next = node.next;

    	var newNode = { value: value, prev: node, next: next };
    	node.next = newNode;
    	next.prev = newNode;
    	list.length++;

    	return newNode;
    }
    /**
     * Removes `count` nodes after the given node. The given node will not be removed.
     * @param {LinkedList<T>} list
     * @param {LinkedListNode<T>} node
     * @param {number} count
     * @template T
     */
    function removeRange(list, node, count) {
    	var next = node.next;
    	for (var i = 0; i < count && next !== list.tail; i++) {
    		next = next.next;
    	}
    	node.next = next;
    	next.prev = node;
    	list.length -= i;
    }
    /**
     * @param {LinkedList<T>} list
     * @returns {T[]}
     * @template T
     */
    function toArray(list) {
    	var array = [];
    	var node = list.head.next;
    	while (node !== list.tail) {
    		array.push(node.value);
    		node = node.next;
    	}
    	return array;
    }


    if (!_self.document) {
    	if (!_self.addEventListener) {
    		// in Node.js
    		return _;
    	}

    	if (!_.disableWorkerMessageHandler) {
    		// In worker
    		_self.addEventListener('message', function (evt) {
    			var message = JSON.parse(evt.data),
    				lang = message.language,
    				code = message.code,
    				immediateClose = message.immediateClose;

    			_self.postMessage(_.highlight(code, _.languages[lang], lang));
    			if (immediateClose) {
    				_self.close();
    			}
    		}, false);
    	}

    	return _;
    }

    // Get current script and highlight
    var script = _.util.currentScript();

    if (script) {
    	_.filename = script.src;

    	if (script.hasAttribute('data-manual')) {
    		_.manual = true;
    	}
    }

    function highlightAutomaticallyCallback() {
    	if (!_.manual) {
    		_.highlightAll();
    	}
    }

    if (!_.manual) {
    	// If the document state is "loading", then we'll use DOMContentLoaded.
    	// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
    	// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
    	// might take longer one animation frame to execute which can create a race condition where only some plugins have
    	// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
    	// See https://github.com/PrismJS/prism/issues/2102
    	var readyState = document.readyState;
    	if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
    		document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
    	} else {
    		if (window.requestAnimationFrame) {
    			window.requestAnimationFrame(highlightAutomaticallyCallback);
    		} else {
    			window.setTimeout(highlightAutomaticallyCallback, 16);
    		}
    	}
    }

    return _;

    })(_self);

    if ( module.exports) {
    	module.exports = Prism;
    }

    // hack for components to work correctly in node.js
    if (typeof commonjsGlobal !== 'undefined') {
    	commonjsGlobal.Prism = Prism;
    }

    // some additional documentation/types

    /**
     * The expansion of a simple `RegExp` literal to support additional properties.
     *
     * @typedef GrammarToken
     * @property {RegExp} pattern The regular expression of the token.
     * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
     * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
     * @property {boolean} [greedy=false] Whether the token is greedy.
     * @property {string|string[]} [alias] An optional alias or list of aliases.
     * @property {Grammar} [inside] The nested grammar of this token.
     *
     * The `inside` grammar will be used to tokenize the text value of each token of this kind.
     *
     * This can be used to make nested and even recursive language definitions.
     *
     * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
     * each another.
     * @global
     * @public
    */

    /**
     * @typedef Grammar
     * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
     * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
     * @global
     * @public
     */

    /**
     * A function which will invoked after an element was successfully highlighted.
     *
     * @callback HighlightCallback
     * @param {Element} element The element successfully highlighted.
     * @returns {void}
     * @global
     * @public
    */

    /**
     * @callback HookCallback
     * @param {Object<string, any>} env The environment variables of the hook.
     * @returns {void}
     * @global
     * @public
     */


    /* **********************************************
         Begin prism-markup.js
    ********************************************** */

    Prism.languages.markup = {
    	'comment': /<!--[\s\S]*?-->/,
    	'prolog': /<\?[\s\S]+?\?>/,
    	'doctype': {
    		// https://www.w3.org/TR/xml/#NT-doctypedecl
    		pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    		greedy: true,
    		inside: {
    			'internal-subset': {
    				pattern: /(\[)[\s\S]+(?=\]>$)/,
    				lookbehind: true,
    				greedy: true,
    				inside: null // see below
    			},
    			'string': {
    				pattern: /"[^"]*"|'[^']*'/,
    				greedy: true
    			},
    			'punctuation': /^<!|>$|[[\]]/,
    			'doctype-tag': /^DOCTYPE/,
    			'name': /[^\s<>'"]+/
    		}
    	},
    	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
    	'tag': {
    		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    		greedy: true,
    		inside: {
    			'tag': {
    				pattern: /^<\/?[^\s>\/]+/,
    				inside: {
    					'punctuation': /^<\/?/,
    					'namespace': /^[^\s>\/:]+:/
    				}
    			},
    			'attr-value': {
    				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
    				inside: {
    					'punctuation': [
    						{
    							pattern: /^=/,
    							alias: 'attr-equals'
    						},
    						/"|'/
    					]
    				}
    			},
    			'punctuation': /\/?>/,
    			'attr-name': {
    				pattern: /[^\s>\/]+/,
    				inside: {
    					'namespace': /^[^\s>\/:]+:/
    				}
    			}

    		}
    	},
    	'entity': [
    		{
    			pattern: /&[\da-z]{1,8};/i,
    			alias: 'named-entity'
    		},
    		/&#x?[\da-f]{1,8};/i
    	]
    };

    Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
    	Prism.languages.markup['entity'];
    Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

    // Plugin to make entity title show the real entity, idea by Roman Komarov
    Prism.hooks.add('wrap', function (env) {

    	if (env.type === 'entity') {
    		env.attributes['title'] = env.content.replace(/&amp;/, '&');
    	}
    });

    Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    	/**
    	 * Adds an inlined language to markup.
    	 *
    	 * An example of an inlined language is CSS with `<style>` tags.
    	 *
    	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
    	 * case insensitive.
    	 * @param {string} lang The language key.
    	 * @example
    	 * addInlined('style', 'css');
    	 */
    	value: function addInlined(tagName, lang) {
    		var includedCdataInside = {};
    		includedCdataInside['language-' + lang] = {
    			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
    			lookbehind: true,
    			inside: Prism.languages[lang]
    		};
    		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

    		var inside = {
    			'included-cdata': {
    				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    				inside: includedCdataInside
    			}
    		};
    		inside['language-' + lang] = {
    			pattern: /[\s\S]+/,
    			inside: Prism.languages[lang]
    		};

    		var def = {};
    		def[tagName] = {
    			pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
    			lookbehind: true,
    			greedy: true,
    			inside: inside
    		};

    		Prism.languages.insertBefore('markup', 'cdata', def);
    	}
    });

    Prism.languages.html = Prism.languages.markup;
    Prism.languages.mathml = Prism.languages.markup;
    Prism.languages.svg = Prism.languages.markup;

    Prism.languages.xml = Prism.languages.extend('markup', {});
    Prism.languages.ssml = Prism.languages.xml;
    Prism.languages.atom = Prism.languages.xml;
    Prism.languages.rss = Prism.languages.xml;


    /* **********************************************
         Begin prism-css.js
    ********************************************** */

    (function (Prism) {

    	var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

    	Prism.languages.css = {
    		'comment': /\/\*[\s\S]*?\*\//,
    		'atrule': {
    			pattern: /@[\w-]+[\s\S]*?(?:;|(?=\s*\{))/,
    			inside: {
    				'rule': /^@[\w-]+/,
    				'selector-function-argument': {
    					pattern: /(\bselector\s*\((?!\s*\))\s*)(?:[^()]|\((?:[^()]|\([^()]*\))*\))+?(?=\s*\))/,
    					lookbehind: true,
    					alias: 'selector'
    				},
    				'keyword': {
    					pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
    					lookbehind: true
    				}
    				// See rest below
    			}
    		},
    		'url': {
    			// https://drafts.csswg.org/css-values-3/#urls
    			pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
    			greedy: true,
    			inside: {
    				'function': /^url/i,
    				'punctuation': /^\(|\)$/,
    				'string': {
    					pattern: RegExp('^' + string.source + '$'),
    					alias: 'url'
    				}
    			}
    		},
    		'selector': RegExp('[^{}\\s](?:[^{};"\']|' + string.source + ')*?(?=\\s*\\{)'),
    		'string': {
    			pattern: string,
    			greedy: true
    		},
    		'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
    		'important': /!important\b/i,
    		'function': /[-a-z0-9]+(?=\()/i,
    		'punctuation': /[(){};:,]/
    	};

    	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

    	var markup = Prism.languages.markup;
    	if (markup) {
    		markup.tag.addInlined('style', 'css');

    		Prism.languages.insertBefore('inside', 'attr-value', {
    			'style-attr': {
    				pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
    				inside: {
    					'attr-name': {
    						pattern: /^\s*style/i,
    						inside: markup.tag.inside
    					},
    					'punctuation': /^\s*=\s*['"]|['"]\s*$/,
    					'attr-value': {
    						pattern: /.+/i,
    						inside: Prism.languages.css
    					}
    				},
    				alias: 'language-css'
    			}
    		}, markup.tag);
    	}

    }(Prism));


    /* **********************************************
         Begin prism-clike.js
    ********************************************** */

    Prism.languages.clike = {
    	'comment': [
    		{
    			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
    			lookbehind: true
    		},
    		{
    			pattern: /(^|[^\\:])\/\/.*/,
    			lookbehind: true,
    			greedy: true
    		}
    	],
    	'string': {
    		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    		greedy: true
    	},
    	'class-name': {
    		pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
    		lookbehind: true,
    		inside: {
    			'punctuation': /[.\\]/
    		}
    	},
    	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    	'boolean': /\b(?:true|false)\b/,
    	'function': /\w+(?=\()/,
    	'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
    	'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    	'punctuation': /[{}[\];(),.:]/
    };


    /* **********************************************
         Begin prism-javascript.js
    ********************************************** */

    Prism.languages.javascript = Prism.languages.extend('clike', {
    	'class-name': [
    		Prism.languages.clike['class-name'],
    		{
    			pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
    			lookbehind: true
    		}
    	],
    	'keyword': [
    		{
    			pattern: /((?:^|})\s*)(?:catch|finally)\b/,
    			lookbehind: true
    		},
    		{
    			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|(?:get|set)(?=\s*[\[$\w\xA0-\uFFFF])|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
    			lookbehind: true
    		},
    	],
    	'number': /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
    	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    	'function': /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    	'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    });

    Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

    Prism.languages.insertBefore('javascript', 'keyword', {
    	'regex': {
    		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
    		lookbehind: true,
    		greedy: true,
    		inside: {
    			'regex-source': {
    				pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
    				lookbehind: true,
    				alias: 'language-regex',
    				inside: Prism.languages.regex
    			},
    			'regex-flags': /[a-z]+$/,
    			'regex-delimiter': /^\/|\/$/
    		}
    	},
    	// This must be declared before keyword because we use "function" inside the look-forward
    	'function-variable': {
    		pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
    		alias: 'function'
    	},
    	'parameter': [
    		{
    			pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		}
    	],
    	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    });

    Prism.languages.insertBefore('javascript', 'string', {
    	'template-string': {
    		pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
    		greedy: true,
    		inside: {
    			'template-punctuation': {
    				pattern: /^`|`$/,
    				alias: 'string'
    			},
    			'interpolation': {
    				pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
    				lookbehind: true,
    				inside: {
    					'interpolation-punctuation': {
    						pattern: /^\${|}$/,
    						alias: 'punctuation'
    					},
    					rest: Prism.languages.javascript
    				}
    			},
    			'string': /[\s\S]+/
    		}
    	}
    });

    if (Prism.languages.markup) {
    	Prism.languages.markup.tag.addInlined('script', 'javascript');
    }

    Prism.languages.js = Prism.languages.javascript;


    /* **********************************************
         Begin prism-file-highlight.js
    ********************************************** */

    (function () {
    	if (typeof self === 'undefined' || !self.Prism || !self.document) {
    		return;
    	}

    	var Prism = window.Prism;

    	var LOADING_MESSAGE = 'Loading…';
    	var FAILURE_MESSAGE = function (status, message) {
    		return '✖ Error ' + status + ' while fetching file: ' + message;
    	};
    	var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';

    	var EXTENSIONS = {
    		'js': 'javascript',
    		'py': 'python',
    		'rb': 'ruby',
    		'ps1': 'powershell',
    		'psm1': 'powershell',
    		'sh': 'bash',
    		'bat': 'batch',
    		'h': 'c',
    		'tex': 'latex'
    	};

    	var STATUS_ATTR = 'data-src-status';
    	var STATUS_LOADING = 'loading';
    	var STATUS_LOADED = 'loaded';
    	var STATUS_FAILED = 'failed';

    	var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])'
    		+ ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';

    	var lang = /\blang(?:uage)?-([\w-]+)\b/i;

    	/**
    	 * Sets the Prism `language-xxxx` or `lang-xxxx` class to the given language.
    	 *
    	 * @param {HTMLElement} element
    	 * @param {string} language
    	 * @returns {void}
    	 */
    	function setLanguageClass(element, language) {
    		var className = element.className;
    		className = className.replace(lang, ' ') + ' language-' + language;
    		element.className = className.replace(/\s+/g, ' ').trim();
    	}


    	Prism.hooks.add('before-highlightall', function (env) {
    		env.selector += ', ' + SELECTOR;
    	});

    	Prism.hooks.add('before-sanity-check', function (env) {
    		var pre = /** @type {HTMLPreElement} */ (env.element);
    		if (pre.matches(SELECTOR)) {
    			env.code = ''; // fast-path the whole thing and go to complete

    			pre.setAttribute(STATUS_ATTR, STATUS_LOADING); // mark as loading

    			// add code element with loading message
    			var code = pre.appendChild(document.createElement('CODE'));
    			code.textContent = LOADING_MESSAGE;

    			var src = pre.getAttribute('data-src');

    			var language = env.language;
    			if (language === 'none') {
    				// the language might be 'none' because there is no language set;
    				// in this case, we want to use the extension as the language
    				var extension = (/\.(\w+)$/.exec(src) || [, 'none'])[1];
    				language = EXTENSIONS[extension] || extension;
    			}

    			// set language classes
    			setLanguageClass(code, language);
    			setLanguageClass(pre, language);

    			// preload the language
    			var autoloader = Prism.plugins.autoloader;
    			if (autoloader) {
    				autoloader.loadLanguages(language);
    			}

    			// load file
    			var xhr = new XMLHttpRequest();
    			xhr.open('GET', src, true);
    			xhr.onreadystatechange = function () {
    				if (xhr.readyState == 4) {
    					if (xhr.status < 400 && xhr.responseText) {
    						// mark as loaded
    						pre.setAttribute(STATUS_ATTR, STATUS_LOADED);

    						// highlight code
    						code.textContent = xhr.responseText;
    						Prism.highlightElement(code);

    					} else {
    						// mark as failed
    						pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

    						if (xhr.status >= 400) {
    							code.textContent = FAILURE_MESSAGE(xhr.status, xhr.statusText);
    						} else {
    							code.textContent = FAILURE_EMPTY_MESSAGE;
    						}
    					}
    				}
    			};
    			xhr.send(null);
    		}
    	});

    	Prism.plugins.fileHighlight = {
    		/**
    		 * Executes the File Highlight plugin for all matching `pre` elements under the given container.
    		 *
    		 * Note: Elements which are already loaded or currently loading will not be touched by this method.
    		 *
    		 * @param {ParentNode} [container=document]
    		 */
    		highlight: function highlight(container) {
    			var elements = (container || document).querySelectorAll(SELECTOR);

    			for (var i = 0, element; element = elements[i++];) {
    				Prism.highlightElement(element);
    			}
    		}
    	};

    	var logged = false;
    	/** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */
    	Prism.fileHighlight = function () {
    		if (!logged) {
    			console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
    			logged = true;
    		}
    		Prism.plugins.fileHighlight.highlight.apply(this, arguments);
    	};

    })();
    });

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

    /* src/components/textfield/index.svelte generated by Svelte v3.29.7 */

    const file$5 = "src/components/textfield/index.svelte";

    // (15:2) {#if valid}
    function create_if_block_1$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "w-textfield-icon icon-checkmark");
    			add_location(span, file$5, 14, 13, 473);
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
    function create_if_block$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "w-textfield-icon icon-alert");
    			add_location(span, file$5, 15, 23, 550);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(16:2) {#if valid === false}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let input;
    	let t2;
    	let t3;
    	let if_block0 = /*valid*/ ctx[4] && create_if_block_1$2(ctx);
    	let if_block1 = /*valid*/ ctx[4] === false && create_if_block$2(ctx);

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
    			add_location(div0, file$5, 12, 2, 315);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			input.disabled = /*disabled*/ ctx[2];
    			input.value = /*value*/ ctx[3];
    			toggle_class(input, "w-textfield-invalid", /*valid*/ ctx[4] === false);
    			add_location(input, file$5, 13, 2, 362);
    			attr_dev(div1, "class", /*elClasses*/ ctx[5]);
    			add_location(div1, file$5, 11, 0, 289);
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
    					if_block1 = create_if_block$2(ctx);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
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
    			id: create_fragment$5.name
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

    /* src/pages/Buttons.svelte generated by Svelte v3.29.7 */
    const file$6 = "src/pages/Buttons.svelte";

    // (8:0) <Panel title="Button" shadow={true}>
    function create_default_slot_2(ctx) {
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
    			add_location(p, file$6, 8, 2, 209);
    			add_location(li0, file$6, 15, 6, 413);
    			add_location(li1, file$6, 18, 6, 526);
    			add_location(ul, file$6, 14, 4, 402);
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(8:0) <Panel title=\\\"Button\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (25:0) <Panel title="Primary buttons" shadow={true}>
    function create_default_slot_1(ctx) {
    	let p;
    	let button0;
    	let t0;
    	let button1;
    	let t1;
    	let button2;
    	let t2;
    	let button3;
    	let t3;
    	let br;
    	let t4;
    	let h3;
    	let t6;
    	let div;
    	let raw_value = highlight("<Button icon=\"icon-help\" on:click={clickHandler} />\n" + "<Button icon=\"icon-settings\" title=\"Settings\" />\n" + "<Button icon=\"icon-chat\" title=\"Chat\" disabled={true} on:click={clickHandler} />\n" + "<Button title=\"Primary\" on:click={clickHandler} />") + "";
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
    			br = element("br");
    			t4 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t6 = space();
    			div = element("div");
    			add_location(p, file$6, 25, 2, 696);
    			add_location(br, file$6, 32, 2, 935);
    			add_location(h3, file$6, 33, 2, 942);
    			attr_dev(div, "class", "w-code");
    			add_location(div, file$6, 34, 2, 967);
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
    			insert_dev(target, br, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(button3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(25:0) <Panel title=\\\"Primary buttons\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (46:0) <Panel title="Secondary buttons" shadow={true}>
    function create_default_slot(ctx) {
    	let p;
    	let button0;
    	let t0;
    	let button1;
    	let t1;
    	let button2;
    	let t2;
    	let br;
    	let t3;
    	let h3;
    	let t5;
    	let div;
    	let raw_value = highlight("<Button secondary={true} title=\"Secondary\" />\n" + "<Button secondary={true} title=\"Disabled\" disabled={true} />\n" + "<Button secondary={true} icon=\"icon-bell\" title=\"Bell\" />") + "";
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

    	const block = {
    		c: function create() {
    			p = element("p");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    			t2 = space();
    			br = element("br");
    			t3 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t5 = space();
    			div = element("div");
    			add_location(p, file$6, 46, 2, 1366);
    			add_location(br, file$6, 52, 2, 1557);
    			add_location(h3, file$6, 53, 2, 1564);
    			attr_dev(div, "class", "w-code");
    			add_location(div, file$6, 54, 2, 1589);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			mount_component(button0, p, null);
    			append_dev(p, t0);
    			mount_component(button1, p, null);
    			append_dev(p, t1);
    			mount_component(button2, p, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(46:0) <Panel title=\\\"Secondary buttons\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let panel0;
    	let t0;
    	let panel1;
    	let t1;
    	let panel2;
    	let current;

    	panel0 = new Panel({
    			props: {
    				title: "Button",
    				shadow: true,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel1 = new Panel({
    			props: {
    				title: "Primary buttons",
    				shadow: true,
    				$$slots: { default: [create_default_slot_1] },
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Buttons", slots, []);

    	const help = event => {
    		alert(event.detail.text);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Buttons> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Button, Panel, help });
    	return [help];
    }

    class Buttons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttons",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/pages/Dividers.svelte generated by Svelte v3.29.7 */
    const file$7 = "src/pages/Dividers.svelte";

    // (5:0) <Panel title="Divider vertical" shadow={true}>
    function create_default_slot_1$1(ctx) {
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
    			set_style(div0, "display", "inline-block");
    			set_style(div0, "margin", "10px");
    			add_location(div0, file$7, 5, 2, 161);
    			set_style(div1, "display", "inline-block");
    			add_location(div1, file$7, 6, 2, 225);
    			set_style(div2, "display", "inline-block");
    			set_style(div2, "margin", "10px");
    			add_location(div2, file$7, 7, 2, 297);
    			set_style(div3, "display", "inline-block");
    			add_location(div3, file$7, 8, 2, 361);
    			set_style(div4, "display", "inline-block");
    			set_style(div4, "margin", "10px");
    			add_location(div4, file$7, 9, 2, 446);
    			set_style(div5, "display", "inline-block");
    			add_location(div5, file$7, 10, 2, 510);
    			set_style(div6, "display", "inline-block");
    			set_style(div6, "margin", "10px");
    			add_location(div6, file$7, 11, 2, 595);
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
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(divider0.$$.fragment, local);
    			transition_in(divider1.$$.fragment, local);
    			transition_in(divider2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(divider0.$$.fragment, local);
    			transition_out(divider1.$$.fragment, local);
    			transition_out(divider2.$$.fragment, local);
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(5:0) <Panel title=\\\"Divider vertical\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    // (15:0) <Panel title="Divider standard" shadow={true}>
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
    	let div3;
    	let divider3;
    	let t9;
    	let br6;
    	let t10;
    	let br7;
    	let t11;
    	let div5;
    	let divider4;
    	let t12;
    	let br8;
    	let t13;
    	let br9;
    	let t14;
    	let h3;
    	let t16;
    	let div4;
    	let raw_value = highlight("<Divider title=\"Small\"/>\n" + "<Divider title=\"Medium\" size=\"medium\"/>\n" + "<Divider title=\"Large\" size=\"large\"/>\n" + "<Divider title=\"X Large\" size=\"x-large\"/>\n" + "<Divider title=\"XX Large\" size=\"xx-large\"/>") + "";
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

    	divider3 = new Divider({
    			props: { title: "X Large", size: "x-large" },
    			$$inline: true
    		});

    	divider4 = new Divider({
    			props: { title: "XX Large", size: "xx-large" },
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
    			div3 = element("div");
    			create_component(divider3.$$.fragment);
    			t9 = space();
    			br6 = element("br");
    			t10 = space();
    			br7 = element("br");
    			t11 = space();
    			div5 = element("div");
    			create_component(divider4.$$.fragment);
    			t12 = space();
    			br8 = element("br");
    			t13 = space();
    			br9 = element("br");
    			t14 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t16 = space();
    			div4 = element("div");
    			add_location(br0, file$7, 17, 4, 758);
    			add_location(br1, file$7, 18, 4, 769);
    			add_location(div0, file$7, 15, 4, 718);
    			add_location(br2, file$7, 23, 4, 843);
    			add_location(br3, file$7, 24, 4, 854);
    			add_location(div1, file$7, 21, 2, 788);
    			add_location(br4, file$7, 29, 4, 926);
    			add_location(br5, file$7, 30, 4, 937);
    			add_location(div2, file$7, 27, 2, 873);
    			add_location(br6, file$7, 35, 4, 1013);
    			add_location(br7, file$7, 36, 4, 1024);
    			add_location(div3, file$7, 33, 2, 956);
    			add_location(br8, file$7, 41, 4, 1102);
    			add_location(br9, file$7, 42, 4, 1113);
    			add_location(h3, file$7, 43, 4, 1124);
    			attr_dev(div4, "class", "w-code");
    			add_location(div4, file$7, 44, 4, 1151);
    			add_location(div5, file$7, 39, 2, 1043);
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
    			insert_dev(target, div3, anchor);
    			mount_component(divider3, div3, null);
    			append_dev(div3, t9);
    			append_dev(div3, br6);
    			append_dev(div3, t10);
    			append_dev(div3, br7);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div5, anchor);
    			mount_component(divider4, div5, null);
    			append_dev(div5, t12);
    			append_dev(div5, br8);
    			append_dev(div5, t13);
    			append_dev(div5, br9);
    			append_dev(div5, t14);
    			append_dev(div5, h3);
    			append_dev(div5, t16);
    			append_dev(div5, div4);
    			div4.innerHTML = raw_value;
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(divider0.$$.fragment, local);
    			transition_in(divider1.$$.fragment, local);
    			transition_in(divider2.$$.fragment, local);
    			transition_in(divider3.$$.fragment, local);
    			transition_in(divider4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(divider0.$$.fragment, local);
    			transition_out(divider1.$$.fragment, local);
    			transition_out(divider2.$$.fragment, local);
    			transition_out(divider3.$$.fragment, local);
    			transition_out(divider4.$$.fragment, local);
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
    			if (detaching) detach_dev(div3);
    			destroy_component(divider3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div5);
    			destroy_component(divider4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(15:0) <Panel title=\\\"Divider standard\\\" shadow={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let panel0;
    	let t;
    	let panel1;
    	let current;

    	panel0 = new Panel({
    			props: {
    				title: "Divider vertical",
    				shadow: true,
    				$$slots: { default: [create_default_slot_1$1] },
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Dividers", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dividers> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Divider, Panel });
    	return [];
    }

    class Dividers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dividers",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/pages/Grids.svelte generated by Svelte v3.29.7 */
    const file$8 = "src/pages/Grids.svelte";

    // (5:0) <Panel title="Grid">
    function create_default_slot$2(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let br0;
    	let t4;
    	let h30;
    	let t6;
    	let div3;
    	let raw0_value = highlight("<div class=\"w-grid w-grid-container-2-4\">\n\t<div>C1</div>\n\t<div>C2</div>\n</div>") + "";
    	let t7;
    	let divider0;
    	let t8;
    	let div6;
    	let div4;
    	let t10;
    	let div5;
    	let t12;
    	let br1;
    	let t13;
    	let h31;
    	let t15;
    	let div7;
    	let raw1_value = highlight("<div class=\"w-grid w-grid-container-2-8\">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>") + "";
    	let t16;
    	let divider1;
    	let t17;
    	let div10;
    	let div8;
    	let t19;
    	let div9;
    	let t21;
    	let br2;
    	let t22;
    	let h32;
    	let t24;
    	let div11;
    	let raw2_value = highlight("<div class=\"w-grid w-grid-container-2-12\">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>") + "";
    	let t25;
    	let divider2;
    	let t26;
    	let div14;
    	let div12;
    	let t28;
    	let div13;
    	let t30;
    	let br3;
    	let t31;
    	let h33;
    	let t33;
    	let div15;
    	let raw3_value = highlight("<div class=\"w-grid w-grid-container-2-16\">\n\t<div>Column 1</div>\n\t<div>Column 2</div>\n</div>") + "";
    	let t34;
    	let divider3;
    	let current;
    	divider0 = new Divider({ $$inline: true });
    	divider1 = new Divider({ $$inline: true });
    	divider2 = new Divider({ $$inline: true });
    	divider3 = new Divider({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "C1";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "C2";
    			t3 = space();
    			br0 = element("br");
    			t4 = space();
    			h30 = element("h3");
    			h30.textContent = "Code example:";
    			t6 = space();
    			div3 = element("div");
    			t7 = space();
    			create_component(divider0.$$.fragment);
    			t8 = space();
    			div6 = element("div");
    			div4 = element("div");
    			div4.textContent = "Column 1";
    			t10 = space();
    			div5 = element("div");
    			div5.textContent = "Column 2";
    			t12 = space();
    			br1 = element("br");
    			t13 = space();
    			h31 = element("h3");
    			h31.textContent = "Code example:";
    			t15 = space();
    			div7 = element("div");
    			t16 = space();
    			create_component(divider1.$$.fragment);
    			t17 = space();
    			div10 = element("div");
    			div8 = element("div");
    			div8.textContent = "Column 1";
    			t19 = space();
    			div9 = element("div");
    			div9.textContent = "Column 2";
    			t21 = space();
    			br2 = element("br");
    			t22 = space();
    			h32 = element("h3");
    			h32.textContent = "Code example:";
    			t24 = space();
    			div11 = element("div");
    			t25 = space();
    			create_component(divider2.$$.fragment);
    			t26 = space();
    			div14 = element("div");
    			div12 = element("div");
    			div12.textContent = "Column 1";
    			t28 = space();
    			div13 = element("div");
    			div13.textContent = "Column 2";
    			t30 = space();
    			br3 = element("br");
    			t31 = space();
    			h33 = element("h3");
    			h33.textContent = "Code example:";
    			t33 = space();
    			div15 = element("div");
    			t34 = space();
    			create_component(divider3.$$.fragment);
    			add_location(div0, file$8, 6, 4, 181);
    			add_location(div1, file$8, 7, 4, 199);
    			attr_dev(div2, "class", "w-grid w-grid-container-2-4");
    			add_location(div2, file$8, 5, 2, 135);
    			add_location(br0, file$8, 9, 2, 224);
    			add_location(h30, file$8, 10, 2, 233);
    			attr_dev(div3, "class", "w-code");
    			add_location(div3, file$8, 11, 2, 258);
    			add_location(div4, file$8, 17, 4, 460);
    			add_location(div5, file$8, 18, 4, 484);
    			attr_dev(div6, "class", "w-grid w-grid-container-2-8");
    			add_location(div6, file$8, 16, 2, 414);
    			add_location(br1, file$8, 20, 2, 515);
    			add_location(h31, file$8, 21, 2, 524);
    			attr_dev(div7, "class", "w-code");
    			add_location(div7, file$8, 22, 2, 549);
    			add_location(div8, file$8, 28, 4, 764);
    			add_location(div9, file$8, 29, 4, 788);
    			attr_dev(div10, "class", "w-grid w-grid-container-2-12");
    			add_location(div10, file$8, 27, 2, 717);
    			add_location(br2, file$8, 31, 2, 819);
    			add_location(h32, file$8, 32, 2, 828);
    			attr_dev(div11, "class", "w-code");
    			add_location(div11, file$8, 33, 2, 853);
    			add_location(div12, file$8, 38, 4, 1068);
    			add_location(div13, file$8, 39, 4, 1092);
    			attr_dev(div14, "class", "w-grid w-grid-container-2-16");
    			add_location(div14, file$8, 37, 2, 1021);
    			add_location(br3, file$8, 41, 2, 1123);
    			add_location(h33, file$8, 42, 2, 1132);
    			attr_dev(div15, "class", "w-code");
    			add_location(div15, file$8, 43, 2, 1157);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div3, anchor);
    			div3.innerHTML = raw0_value;
    			insert_dev(target, t7, anchor);
    			mount_component(divider0, target, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div4);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div7, anchor);
    			div7.innerHTML = raw1_value;
    			insert_dev(target, t16, anchor);
    			mount_component(divider1, target, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div8);
    			append_dev(div10, t19);
    			append_dev(div10, div9);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, h32, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, div11, anchor);
    			div11.innerHTML = raw2_value;
    			insert_dev(target, t25, anchor);
    			mount_component(divider2, target, anchor);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, div14, anchor);
    			append_dev(div14, div12);
    			append_dev(div14, t28);
    			append_dev(div14, div13);
    			insert_dev(target, t30, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, h33, anchor);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, div15, anchor);
    			div15.innerHTML = raw3_value;
    			insert_dev(target, t34, anchor);
    			mount_component(divider3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(divider0.$$.fragment, local);
    			transition_in(divider1.$$.fragment, local);
    			transition_in(divider2.$$.fragment, local);
    			transition_in(divider3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(divider0.$$.fragment, local);
    			transition_out(divider1.$$.fragment, local);
    			transition_out(divider2.$$.fragment, local);
    			transition_out(divider3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t7);
    			destroy_component(divider0, detaching);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t16);
    			destroy_component(divider1, detaching);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(div11);
    			if (detaching) detach_dev(t25);
    			destroy_component(divider2, detaching);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(div14);
    			if (detaching) detach_dev(t30);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(h33);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(div15);
    			if (detaching) detach_dev(t34);
    			destroy_component(divider3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(5:0) <Panel title=\\\"Grid\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				title: "Grid",
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Grids", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Grids> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Divider, Panel });
    	return [];
    }

    class Grids extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grids",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/pages/Panels.svelte generated by Svelte v3.29.7 */
    const file$9 = "src/pages/Panels.svelte";

    // (5:0) <Panel title="Simple panel">
    function create_default_slot_1$2(ctx) {
    	let h3;
    	let t1;
    	let div;
    	let raw_value = highlight("<Panel title=\"Simple panel\"></Panel>") + "";

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t1 = space();
    			div = element("div");
    			add_location(h3, file$9, 5, 2, 134);
    			attr_dev(div, "class", "w-code");
    			add_location(div, file$9, 6, 2, 159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(5:0) <Panel title=\\\"Simple panel\\\">",
    		ctx
    	});

    	return block;
    }

    // (13:0) <Panel title="Shadow panel" shadow={true}>
    function create_default_slot$3(ctx) {
    	let h3;
    	let t1;
    	let div;
    	let raw_value = highlight("<Panel title=\"Shadow panel\" shadow={true}></Panel>") + "";

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t1 = space();
    			div = element("div");
    			add_location(h3, file$9, 13, 2, 313);
    			attr_dev(div, "class", "w-code");
    			add_location(div, file$9, 14, 2, 338);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
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

    function create_fragment$9(ctx) {
    	let panel0;
    	let t0;
    	let br;
    	let t1;
    	let panel1;
    	let current;

    	panel0 = new Panel({
    			props: {
    				title: "Simple panel",
    				$$slots: { default: [create_default_slot_1$2] },
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
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			create_component(panel1.$$.fragment);
    			add_location(br, file$9, 11, 0, 261);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel0, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
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
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
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
    	validate_slots("Panels", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Panels> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Panel });
    	return [];
    }

    class Panels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panels",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/pages/Searches.svelte generated by Svelte v3.29.7 */
    const file$a = "src/pages/Searches.svelte";

    // (5:0) <Panel title="Search">
    function create_default_slot$4(ctx) {
    	let div0;
    	let search0;
    	let t0;
    	let search1;
    	let t1;
    	let h3;
    	let t3;
    	let div1;
    	let raw_value = highlight("<Search label=\"Search\" placeholder=\"Search\" width={200}/>\n" + "<Search label=\"Phone disabled\" placeholder=\"Search\" disabled={true} />") + "";
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

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(search0.$$.fragment);
    			t0 = space();
    			create_component(search1.$$.fragment);
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t3 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "w-grid w-grid-container-2-20");
    			add_location(div0, file$a, 5, 2, 136);
    			add_location(h3, file$a, 10, 2, 329);
    			attr_dev(div1, "class", "w-code");
    			add_location(div1, file$a, 11, 2, 354);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(search0, div0, null);
    			append_dev(div0, t0);
    			mount_component(search1, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			div1.innerHTML = raw_value;
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(search0.$$.fragment, local);
    			transition_in(search1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(search0.$$.fragment, local);
    			transition_out(search1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(search0);
    			destroy_component(search1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(5:0) <Panel title=\\\"Search\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				title: "Search",
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Searches", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Searches> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Search, Panel });
    	return [];
    }

    class Searches extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Searches",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/pages/Switches.svelte generated by Svelte v3.29.7 */
    const file$b = "src/pages/Switches.svelte";

    // (7:0) <Panel title="Switch">
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
    	let br;
    	let t4;
    	let h3;
    	let t6;
    	let div2;
    	let raw_value = highlight("<Switch label=\"Switch {checked1 ? \"on\" : \"off\"}\" bind:checked />\n" + "<Switch label=\"Switch on (disabled)\" checked={true} disabled={true} />") + "";
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
    			br = element("br");
    			t4 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t6 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "w-grid w-grid-container-2-16");
    			add_location(div0, file$b, 7, 2, 178);
    			attr_dev(div1, "class", "w-grid w-grid-container-2-16");
    			add_location(div1, file$b, 11, 2, 380);
    			add_location(br, file$b, 16, 2, 587);
    			add_location(h3, file$b, 17, 2, 596);
    			attr_dev(div2, "class", "w-code");
    			add_location(div2, file$b, 18, 2, 621);
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
    			insert_dev(target, br, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);
    			div2.innerHTML = raw_value;
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
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(switch0.$$.fragment, local);
    			transition_in(switch1.$$.fragment, local);
    			transition_in(switch2.$$.fragment, local);
    			transition_in(switch3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(switch0.$$.fragment, local);
    			transition_out(switch1.$$.fragment, local);
    			transition_out(switch2.$$.fragment, local);
    			transition_out(switch3.$$.fragment, local);
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
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(7:0) <Panel title=\\\"Switch\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				title: "Switch",
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switches",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/pages/TextFields.svelte generated by Svelte v3.29.7 */
    const file$c = "src/pages/TextFields.svelte";

    // (5:0) <Panel title="Standard Text Field">
    function create_default_slot_3(ctx) {
    	let textfield;
    	let t0;
    	let br;
    	let t1;
    	let h3;
    	let t3;
    	let div;
    	let raw_value = highlight("<TextField label=\"First Name\" placeholder=\"Enter your name\" />") + "";
    	let current;

    	textfield = new Textfield({
    			props: {
    				label: "First Name",
    				placeholder: "Enter your name"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t3 = space();
    			div = element("div");
    			add_location(br, file$c, 7, 2, 218);
    			add_location(h3, file$c, 8, 2, 227);
    			attr_dev(div, "class", "w-code");
    			add_location(div, file$c, 9, 2, 252);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(5:0) <Panel title=\\\"Standard Text Field\\\">",
    		ctx
    	});

    	return block;
    }

    // (15:0) <Panel title="Disabled Text Field">
    function create_default_slot_2$1(ctx) {
    	let textfield;
    	let t0;
    	let br;
    	let t1;
    	let h3;
    	let t3;
    	let div;
    	let raw_value = highlight("<TextField label=\"Last Name\" placeholder=\"Enter your name\" disabled={true}/>") + "";
    	let current;

    	textfield = new Textfield({
    			props: {
    				label: "Last Name",
    				placeholder: "Enter your name",
    				disabled: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t3 = space();
    			div = element("div");
    			add_location(br, file$c, 17, 2, 499);
    			add_location(h3, file$c, 18, 2, 508);
    			attr_dev(div, "class", "w-code");
    			add_location(div, file$c, 19, 2, 533);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(15:0) <Panel title=\\\"Disabled Text Field\\\">",
    		ctx
    	});

    	return block;
    }

    // (25:0) <Panel title="Valid Text Field">
    function create_default_slot_1$3(ctx) {
    	let div0;
    	let textfield0;
    	let t0;
    	let textfield1;
    	let t1;
    	let h3;
    	let t3;
    	let div1;
    	let raw_value = highlight("<TextField label=\"Phone\" value=\"178 35 456666\" valid={true}/>\n" + "<TextField label=\"Phone disabled\" value=\"178 35 4566366\" valid={true} disabled={true} />") + "";
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

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(textfield0.$$.fragment);
    			t0 = space();
    			create_component(textfield1.$$.fragment);
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t3 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "w-grid w-grid-container-2-16");
    			add_location(div0, file$c, 25, 2, 710);
    			add_location(h3, file$c, 34, 2, 949);
    			attr_dev(div1, "class", "w-code");
    			add_location(div1, file$c, 35, 2, 974);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(textfield0, div0, null);
    			append_dev(div0, t0);
    			mount_component(textfield1, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			div1.innerHTML = raw_value;
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(textfield0);
    			destroy_component(textfield1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(25:0) <Panel title=\\\"Valid Text Field\\\">",
    		ctx
    	});

    	return block;
    }

    // (41:0) <Panel title="Invalid Text Field">
    function create_default_slot$6(ctx) {
    	let div0;
    	let textfield0;
    	let t0;
    	let textfield1;
    	let t1;
    	let h3;
    	let t3;
    	let div1;
    	let raw_value = highlight("<TextField label=\"Phone\" value=\"178 35 456666\" valid={false}/>\n" + "<TextField label=\"Phone disabled\" value=\"178 35 4566366\" valid={false} disabled={true} />") + "";
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

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(textfield0.$$.fragment);
    			t0 = space();
    			create_component(textfield1.$$.fragment);
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Code example:";
    			t3 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "w-grid w-grid-container-2-16");
    			add_location(div0, file$c, 41, 2, 1233);
    			add_location(h3, file$c, 50, 2, 1468);
    			attr_dev(div1, "class", "w-code");
    			add_location(div1, file$c, 51, 2, 1493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(textfield0, div0, null);
    			append_dev(div0, t0);
    			mount_component(textfield1, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			div1.innerHTML = raw_value;
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(textfield0);
    			destroy_component(textfield1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(41:0) <Panel title=\\\"Invalid Text Field\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
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
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel1 = new Panel({
    			props: {
    				title: "Disabled Text Field",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel2 = new Panel({
    			props: {
    				title: "Valid Text Field",
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	panel3 = new Panel({
    			props: {
    				title: "Invalid Text Field",
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextFields", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextFields> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ highlight, Panel, TextField: Textfield });
    	return [];
    }

    class TextFields extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextFields",
    			options,
    			id: create_fragment$c.name
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
        TextFields
    };

    /* src/components/sidebar/index.svelte generated by Svelte v3.29.7 */
    const file$d = "src/components/sidebar/index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i].path;
    	child_ctx[1] = list[i].title;
    	return child_ctx;
    }

    // (8:2) {#each routes as { path, title }}
    function create_each_block(ctx) {
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
    			add_location(a, file$d, 8, 4, 209);
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(8:2) {#each routes as { path, title }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let each_value = /*routes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    			add_location(div0, file$d, 5, 0, 111);
    			attr_dev(div1, "class", "w-sidebar");
    			add_location(div1, file$d, 6, 0, 145);
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
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { title: 1, routes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$d.name
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
    const file$e = "src/App.svelte";

    function create_fragment$e(ctx) {
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
    			add_location(aside, file$e, 29, 2, 1068);
    			add_location(main, file$e, 32, 2, 1122);
    			attr_dev(div, "class", "w-container");
    			add_location(div, file$e, 28, 0, 1040);
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const title = "Components Library";

    function instance$e($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$e.name
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
