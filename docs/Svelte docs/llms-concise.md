# Svelte & SvelteKit Documentation (Complete Reference)

> Compiled from https://svelte.dev/docs on 2026-08-11. This document combines the official Svelte docs, SvelteKit docs, and Svelte CLI (`sv`) docs into a single reference file, gathered from Svelte's own `llms-full.txt` / `llms.txt` documentation exports (not just the "for LLMs" landing page, but the full underlying reference content for Svelte, SvelteKit, and the CLI).
>
> **Note on completeness:** The source documentation is extremely large (it spans hundreds of reference pages, including the full Svelte API reference modules like `svelte`, `svelte/reactivity`, `svelte/transition`, `svelte/animate`, `svelte/actions`, `svelte/attachments`, `svelte/store`, `svelte/motion`, `svelte/easing`, `svelte/events`, `svelte/legacy`, `svelte/server`, `svelte/compiler`, TypeScript docs, custom elements, testing, v4/v5 migration guides, and all of SvelteKit's advanced routing/hooks/service-worker/adapter/deployment pages). This file captures the full **Svelte core guide** (component syntax, runes, template syntax, styling, special elements, `await`), the full **SvelteKit guide** (routing, loading data, form actions, page options, state management, remote functions), and the full **Svelte CLI (`sv`) reference**, in the order presented by Svelte's own documentation tooling. Some of the deepest API-reference sub-pages (individual function signatures for every module) were beyond what could be captured in this pass — for those, refer to https://svelte.dev/docs/svelte and https://svelte.dev/docs/kit directly, or the raw exports at https://svelte.dev/llms-full.txt.

---

# PART 1 — SVELTE (CORE)

## Overview

Svelte is a framework for building user interfaces on the web. It uses a compiler to turn declarative components written in HTML, CSS and JavaScript...

```svelte
<!--- file: App.svelte --->
<script>
	function greet() {
		alert('Welcome to Svelte!');
	}
</script>

<button onclick={greet}>click me</button>

<style>
	button {
		font-size: 2em;
	}
</style>
```

...into lean, tightly optimized JavaScript.

You can use it to build anything on the web, from standalone components to ambitious full stack apps (using Svelte's companion application framework, SvelteKit) and everything in between.

These pages serve as reference documentation. If you're new to Svelte, we recommend starting with the interactive tutorial and coming back here when you have questions. You can also try Svelte online in the playground.

## Getting started

We recommend using SvelteKit, which lets you build almost anything. It's the official application framework from the Svelte team and powered by Vite. Create a new project with:

```sh
npx sv create myapp
cd myapp
npm install
npm run dev
```

Don't worry if you don't know Svelte yet! You can ignore all the nice features SvelteKit brings on top for now and dive into it later.

### Alternatives to SvelteKit

You can also use Svelte directly with Vite via `vite-plugin-svelte` by running `npm create vite@latest` and selecting the `svelte` option (or, if working with an existing project, adding the plugin to your `vite.config.js` file). With this, `npm run build` will generate HTML, JS, and CSS files inside the `dist` directory. In most cases, you will probably need to choose a routing library as well.

> Vite is often used in standalone mode to build single page apps (SPAs), which you can also build with SvelteKit.

There are also plugins for other bundlers, but we recommend Vite.

### Editor tooling

The Svelte team maintains a VS Code extension, and there are integrations with various other editors and tools as well. You can also check your code from the command line using `npx sv check`.

### Getting help

Don't be shy about asking for help in the Discord chatroom! You can also find answers on Stack Overflow.

## `.svelte` files

Components are the building blocks of Svelte applications. They are written into `.svelte` files, using a superset of HTML.

All three sections — script, styles and markup — are optional.

```svelte
<script module>
	// module-level logic goes here
	// (you will rarely use this)
</script>

<script>
	// instance-level logic goes here
</script>

/// file: MyComponent.svelte

<!-- markup (zero or more items) goes here -->

<style>
	/* styles go here */
</style>
```

### `<script>`

A `<script>` block contains JavaScript (or TypeScript, when adding the `lang="ts"` attribute) that runs when a component instance is created. Variables declared (or imported) at the top level can be referenced in the component's markup.

In addition to normal JavaScript, you can use _runes_ to declare component props (`$props`) and add reactivity to your component.

### `<script module>`

A `<script>` tag with a `module` attribute runs once when the module first evaluates, rather than for each component instance. Variables declared in this block can be referenced elsewhere in the component, but not vice versa.

```svelte
<script module>
	let total = 0;
</script>

<script>
	total += 1;
	console.log(`instantiated ${total} times`);
</script>
```

You can `export` bindings from this block, and they will become exports of the compiled module. You cannot `export default`, since the default export is the component itself.

> If you are using TypeScript and import such exports from a `module` block into a `.ts` file, make sure your editor knows about them (works out of the box with the official VS Code extension / IntelliJ plugin; otherwise set up the TypeScript editor plugin).

> **Legacy:** In Svelte 4, this script tag was created using `<script context="module">`.

### `<style>`

CSS inside a `<style>` block will be scoped to that component.

```svelte
<style>
	p {
		/* this will only affect <p> elements in this component */
		color: burlywood;
	}
</style>
```

## `.svelte.js` and `.svelte.ts` files

Besides `.svelte` files, Svelte also operates on `.svelte.js` and `.svelte.ts` files. These behave like any other `.js`/`.ts` module, except that you can use runes. This is useful for creating reusable reactive logic, or sharing reactive state across your app (though note that you cannot export reassigned state — see `$state`).

> **Legacy:** This is a concept that didn't exist prior to Svelte 5.

## What are runes?

> **rune** /ruːn/ _noun_ — A letter or mark used as a mystical or magic symbol.

Runes are symbols that you use in `.svelte` and `.svelte.js`/`.svelte.ts` files to control the Svelte compiler. If you think of Svelte as a language, runes are part of the syntax — they are _keywords_.

Runes have a `$` prefix and look like functions:

```js
let message = $state('hello');
```

They differ from normal JavaScript functions in important ways:

- You don't need to import them — they are part of the language
- They're not values — you can't assign them to a variable or pass them as arguments to a function
- Just like JavaScript keywords, they are only valid in certain positions (the compiler will help you if you put them in the wrong place)

> **Legacy:** Runes didn't exist prior to Svelte 5.

## `$state`

The `$state` rune allows you to create _reactive state_, which means that your UI _reacts_ when it changes.

```svelte
<script>
	let count = $state(0);
</script>

<button onclick={() => count++}>
	clicks: {count}
</button>
```

Unlike other frameworks, there is no API for interacting with state — `count` is just a number, and you update it like any other variable.

### Deep state

If `$state` is used with an array or a simple object, the result is a deeply reactive _state proxy_. Proxies allow Svelte to run code when you read or write properties, including via methods like `array.push(...)`, triggering granular updates.

State is proxified recursively until Svelte finds something other than an array or simple object (like a class or `Object.create` object).

```js
let todos = $state([{ done: false, text: 'add more todos' }]);
```

Modifying an individual todo's property triggers updates to anything depending on that specific property:

```js
todos[0].done = !todos[0].done;
```

Pushing a new object to the array also proxifies it:

```js
todos.push({ done: false, text: 'eat lunch' });
```

> When you update properties of proxies, the original object is _not_ mutated. If you need your own proxy handlers, wrap the object _after_ wrapping it in `$state`.

Destructuring a reactive value evaluates references at the point of destructuring (as in normal JS) — they are not reactive:

```js
let { done, text } = todos[0];
// this will not affect the value of `done`
todos[0].done = !todos[0].done;
```

### Classes

Class instances are not proxied. Instead, use `$state` in class fields (public or private), or as the first assignment to a property immediately inside the constructor:

```js
class Todo {
	done = $state(false);

	constructor(text) {
		this.text = $state(text);
	}

	reset() {
		this.text = '';
		this.done = false;
	}
}
```

> The compiler transforms fields into get/set methods on the class prototype referencing private fields — so the properties are not enumerable.

`this` matters when calling methods. `<button onclick={todo.reset}>` won't work correctly (`this` becomes the button). Use an inline function `() => todo.reset()` or an arrow function class field `reset = () => {...}`.

### Built-in classes

Svelte provides reactive implementations of built-in classes like `Set`, `Map`, `Date` and `URL`, importable from `svelte/reactivity`.

### `$state.raw`

For objects/arrays you don't want deeply reactive, use `$state.raw`. Raw state cannot be mutated, only _reassigned_:

```js
let person = $state.raw({ name: 'Heraclitus', age: 49 });
person.age += 1; // no effect
person = { name: 'Heraclitus', age: 50 }; // works
```

Improves performance for large arrays/objects you weren't planning to mutate. Raw state can _contain_ reactive state.

### `$state.snapshot`

Takes a static snapshot of a deeply reactive `$state` proxy:

```svelte
<script>
	let counter = $state({ count: 0 });
	function onclick() {
		console.log($state.snapshot(counter)); // plain object, not Proxy
	}
</script>
```

Handy for passing to libraries/APIs that don't expect a proxy (e.g. `structuredClone`). If a value has `toJSON`, the snapshot clones the value returned by `toJSON`.

### `$state.eager`

State changes may not appear in the UI immediately if used by an `await` expression (updates are synchronized). Use `$state.eager(value)` to update UI as soon as state changes — e.g. immediate visual feedback for navigation:

```svelte
<nav>
	<a href="/" aria-current={$state.eager(pathname) === '/' ? 'page' : null}>home</a>
</nav>
```

Use sparingly, only for feedback in response to user action.

### Passing state into functions

JavaScript is pass-by-value. To have access to _current_ values, you need functions:

```js
function add(getA, getB) {
	return () => getA() + getB();
}
let a = 1,
	b = 2;
let total = add(
	() => a,
	() => b
);
console.log(total()); // 3
```

State in Svelte works the same way — referencing something declared with `$state` accesses its _current value_. This includes get/set properties on proxies — though for that pattern, consider classes instead.

### Passing state across modules

You can declare state in `.svelte.js`/`.svelte.ts` files, but can only _export_ it if it's not directly reassigned:

```js
// NOT allowed:
export let count = $state(0);
export function increment() {
	count += 1;
}
```

This is because the compiler transforms every reference to `count`, but only within the same file — the compiler can't transform references in importing files.

Two ways to share state between modules — don't reassign it:

```js
export const counter = $state({ count: 0 });
export function increment() {
	counter.count += 1;
}
```

...or don't directly export it:

```js
let count = $state(0);
export function getCount() {
	return count;
}
export function increment() {
	count += 1;
}
```

## `$derived`

```svelte
<script>
	let count = $state(0);
	let doubled = $derived(count * 2);
</script>

<button onclick={() => count++}>{doubled}</button><p>{count} doubled is {doubled}</p>
```

The expression inside `$derived(...)` should be free of side-effects; Svelte disallows state changes inside derived expressions. Class fields can be marked `$derived` too.

> Code in Svelte components only executes once at creation. Without `$derived`, `doubled` would keep its original value.

### `$derived.by`

For complex derivations that don't fit a short expression, use `$derived.by` with a function:

```svelte
<script>
	let numbers = $state([1, 2, 3]);
	let total = $derived.by(() => {
		let total = 0;
		for (const n of numbers) total += n;
		return total;
	});
</script>
```

`$derived(expression)` is equivalent to `$derived.by(() => expression)`.

### Understanding dependencies

Anything read synchronously inside the `$derived` expression is a _dependency_. When state changes, the derived is marked _dirty_ and recalculated when next read.

If an expression contains `await`, Svelte transforms it so state _after_ the `await` is also tracked (only for the expression itself, not functions it calls). To exempt state from dependency tracking, use `untrack`.

### Overriding derived values

Since Svelte 5.25, derived values can be temporarily overridden by reassigning them (unless declared with `const`) — useful for optimistic UI:

```svelte
<script>
	let { post, like } = $props();
	let likes = $derived(post.likes);

	async function onclick() {
		likes += 1;
		try {
			await like();
		} catch {
			likes -= 1;
		}
	}
</script>

<button {onclick}>🧡 {likes}</button>
```

### Deriveds and reactivity

Unlike `$state`, `$derived` values are left as-is (not deeply reactive). E.g. `let selected = $derived(items[index])` — mutating `selected` will affect the underlying `items` array (assuming `items` is deeply reactive).

### Destructuring

Destructuring a `$derived` declaration makes all resulting variables reactive:

```js
let { a, b, c } = $derived(stuff());
// equivalent to:
let _stuff = $derived(stuff());
let a = $derived(_stuff.a);
let b = $derived(_stuff.b);
let c = $derived(_stuff.c);
```

### Update propagation

Svelte uses _push-pull reactivity_ — state updates immediately notify everything that depends on them (push), but deriveds aren't re-evaluated until read (pull). If a derived's new value is referentially identical to the old one, downstream updates are skipped.

## `$effect`

Effects run when state updates; used for calling third-party libraries, drawing on `<canvas>`, network requests. They only run in the browser, not during SSR.

Generally you should _not_ update state inside effects — see "When not to use `$effect`" below.

```svelte
<script>
	let size = $state(50);
	let color = $state('#ff3e00');
	let canvas;

	$effect(() => {
		const context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = color;
		context.fillRect(0, 0, size, size);
	});
</script>

<canvas bind:this={canvas} width="100" height="100"></canvas>
```

Svelte tracks which state/derived is accessed (unless inside `untrack`) and re-runs on later changes.

### Understanding lifecycle

Effects run after the component has mounted to the DOM, in a microtask after state changes. Re-runs are batched and happen after DOM updates are applied. `$effect` can be used anywhere (not just top-level), as long as a parent effect is running.

> Svelte uses effects internally to represent template logic — that's how `{name}` expressions update.

An effect can return a _teardown function_, run immediately before the effect re-runs or when destroyed:

```svelte
<script>
	let count = $state(0);
	let milliseconds = $state(1000);

	$effect(() => {
		const interval = setInterval(() => {
			count += 1;
		}, milliseconds);
		return () => clearInterval(interval);
	});
</script>
```

### Understanding dependencies

`$effect` picks up reactive values (`$state`, `$derived`, `$props`) _synchronously_ read (including indirectly via function calls). If `$state`/`$derived` are used directly inside the `$effect` (e.g. during creation of a reactive class), they are NOT treated as dependencies.

Values read _asynchronously_ (after `await` or in `setTimeout`) are not tracked. An effect only reruns when the _object_ it reads changes, not a property inside it (mutation vs reassignment).

An effect only depends on values read the _last time it ran_ — conditional code means dependencies can change between runs.

### `$effect.pre`

Runs code _before_ the DOM updates (otherwise identical to `$effect`):

```svelte
<script>
	import { tick } from 'svelte';
	let div = $state();
	let messages = $state([]);

	$effect.pre(() => {
		if (!div) return;
		messages.length;
		if (div.offsetHeight + div.scrollTop > div.scrollHeight - 20) {
			tick().then(() => div.scrollTo(0, div.scrollHeight));
		}
	});
</script>
```

### `$effect.tracking`

Advanced feature — tells you if code is running inside a tracking context (effect or template):

```svelte
<script>
	console.log('in component setup:', $effect.tracking()); // false
	$effect(() => {
		console.log('in effect:', $effect.tracking()); // true
	});
</script>

<p>in template: {$effect.tracking()}</p> <!-- true -->
```

Used to implement abstractions like `createSubscriber`.

### `$effect.pending`

When using `await` in components, `$effect.pending()` tells you how many promises are pending in the current boundary (not including child boundaries):

```svelte
<script>
	let a = $state(1);
	let b = $state(2);
	async function add(a, b) {
		await new Promise((f) => setTimeout(f, 500));
		return a + b;
	}
</script>

<p>{a} + {b} = {await add(a, b)}</p>
{#if $effect.pending()}
	<p>pending promises: {$effect.pending()}</p>
{/if}
```

### `$effect.root`

Advanced feature — creates a non-tracked scope that doesn't auto-cleanup, for manually controlled nested effects, and allows effect creation outside component initialisation:

```js
const destroy = $effect.root(() => {
	$effect(() => {
		/* setup */
	});
	return () => {
		/* cleanup */
	};
});
destroy();
```

### When not to use `$effect`

`$effect` is an escape hatch (analytics, direct DOM manipulation) — avoid using it to synchronize state:

```svelte
<!-- DON'T -->
<script>
	let count = $state(0);
	let doubled = $state();
	$effect(() => {
		doubled = count * 2;
	});
</script>
```

```svelte
<!-- DO -->
<script>
	let count = $state(0);
	let doubled = $derived(count * 2);
</script>
```

For anything more complex, use `$derived.by`. If you want a reassignable derived value (optimistic UI), deriveds can be directly overridden as of 5.25.

Avoid convoluted effects linking two values together (e.g. two synced range inputs) — use `oninput` callbacks or, better, function bindings instead.

If you absolutely must update `$state` within an effect and hit an infinite loop reading/writing the same state, use `untrack`.

## `$props`

Props are passed to components like attributes:

```svelte
<!--- file: App.svelte --->
<script>
	import MyComponent from './MyComponent.svelte';
</script>

<MyComponent adjective="cool" />
```

Received via `$props`, usually destructured:

```svelte
<!--- file: MyComponent.svelte --->
<script>
	let { adjective } = $props();
</script>

<p>this component is {adjective}</p>
```

### Fallback values

```js
let { adjective = 'happy' } = $props();
```

Fallback values are not turned into reactive state proxies.

### Renaming props

```js
let { super: trouper = 'lights are gonna find me' } = $props();
```

### Rest props

```js
let { a, b, c, ...others } = $props();
```

### Updating props

Prop references update when the prop updates in the parent, but the child can temporarily _reassign_ the prop (useful for unsaved ephemeral state). You should NOT _mutate_ props unless bindable.

- If the prop is a regular object, mutation has no effect.
- If the prop is a reactive state proxy, mutation _will_ have an effect but triggers an `ownership_invalid_mutation` warning (component mutating state it doesn't 'own').
- Fallback values of non-`$bindable` props are left untouched (not reactive proxies), so mutations don't cause updates.

In summary: don't mutate props. Use callback props, or `$bindable` if parent/child should share the object.

### Type safety

```svelte
<script lang="ts">
	let { adjective }: { adjective: string } = $props();
</script>
```

JSDoc equivalent:

```svelte
<script>
	/** @type {{ adjective: string }} */
	let { adjective } = $props();
</script>
```

DOM element interfaces are in `svelte/elements`. Snippet props like `children` should use the `Snippet` interface from `'svelte'`.

### `$props.id()`

(Added 5.20.0) Generates an ID unique to the current component instance, consistent between server/client when hydrating. Useful for `for`/`aria-labelledby`:

```svelte
<script>
	const uid = $props.id();
</script>

<label for="{uid}-firstname">First Name: </label>
<input id="{uid}-firstname" type="text" />
```

## `$bindable`

Props ordinarily flow one way (parent → child). `$bindable` allows data to flow up too, and allows a state proxy to be _mutated_ in the child.

```svelte
<script>
	let { value = $bindable(), ...props } = $props();
</script>

/// file: FancyInput.svelte
<input bind:value {...props} />
```

Parent uses `bind:`:

```svelte
<script>
	import FancyInput from './FancyInput.svelte';
	let message = $state('hello');
</script>

/// file: App.svelte
<FancyInput bind:value={message} />
<p>{message}</p>
```

Parent doesn't _have_ to use `bind:` — can pass a normal prop. Fallback for unbound case:

```js
let { value = $bindable('fallback'), ...props } = $props();
```

## `$inspect`

Development-only (noop in production). Roughly `console.log`, but re-runs when its argument changes, tracking reactive state deeply:

```svelte
<script>
	let count = $state(0);
	let message = $state('hello');
	$inspect(count, message);
</script>
```

On updates, prints a stack trace (except in the playground).

### `$inspect(...).with`

Returns an object with a `with` method — a callback invoked instead of `console.log`, receiving `"init"`/`"update"` plus the inspected values:

```js
$inspect(count).with((type, count) => {
	if (type === 'update') debugger;
});
```

### `$inspect.trace(...)`

(Added 5.14) Traces the surrounding function in development. Whenever it re-runs as part of an effect or derived, prints which reactive state caused it. Must be the first statement of a function body. Takes an optional label argument.

## `$host`

When compiling as a custom element, `$host` provides access to the host element (e.g. to dispatch custom events):

```svelte
<svelte:options customElement="my-stepper" />

<script>
	function dispatch(type) {
		$host().dispatchEvent(new CustomEvent(type));
	}
</script>

/// file: Stepper.svelte
<button onclick={() => dispatch('decrement')}>decrement</button>
<button onclick={() => dispatch('increment')}>increment</button>
```

## Basic markup

Markup inside a Svelte component is "HTML++".

### Tags

Lowercase (`<div>`) = HTML element. Capitalised or dot-notation (`<Widget>`, `<my.stuff>`) = component.

### Element attributes

Work like HTML by default; values may be unquoted; can contain or _be_ JS expressions.

```svelte
<a href="page/{p}">page {p}</a>
<button disabled={!clickable}>...</button>
```

Boolean attributes included if truthy, excluded if falsy. Other attributes included unless nullish.

```svelte
<input required={false} placeholder="This input field is not required" />
<div title={null}>This div has no title attribute</div>
```

> Quoting a singular expression doesn't affect parsing now, but in Svelte 6 it will coerce the value to a string.

Shorthand: `{name}` when attribute name matches value name.

### Component props

Same shorthand rules apply. Values passed to components are conventionally called "properties"/"props" rather than "attributes".

### Spread attributes

```svelte
<Widget a="b" {...things} c="d" />
```

Order matters (later spreads/attrs override earlier).

### Events

```svelte
<button onclick={() => console.log('clicked')}>click me</button>
```

Case sensitive (`onclick` vs `onClick` listen to different events). Same rules as attributes apply (shorthand, spread). Event attributes always fire after binding events. Some handlers attached with `addEventListener` directly, others _delegated_.

`ontouchstart`/`ontouchmove` handlers are passive by default for performance; use `on` from `svelte/events` if you truly need `preventDefault()` (e.g. in an action).

#### Event delegation

Reduces memory footprint: a single listener at the app root handles delegated events. Gotchas:

- Manually dispatched events need `{ bubbles: true }` to reach the app root.
- Avoid `stopPropagation` with `addEventListener` directly — prefer `on` from `svelte/events`.

Delegated events: `beforeinput`, `click`, `change`, `dblclick`, `contextmenu`, `focusin`, `focusout`, `input`, `keydown`, `keyup`, `mousedown`, `mousemove`, `mouseout`, `mouseover`, `mouseup`, `pointerdown`, `pointermove`, `pointerout`, `pointerover`, `pointerup`, `touchend`, `touchmove`, `touchstart`.

### Text expressions

```svelte
{expression}
```

`null`/`undefined` omitted; others coerced to strings. Use HTML entities (`&lbrace;`/`&#123;` etc.) for literal braces. Regex literals need parens: `{(/^[A-Za-z ]+$/).test(value) ? x : y}`.

Expressions are escaped to prevent injection; use `{@html}` to render raw HTML.

### Comments

```svelte
<!-- this is a comment! -->
```

`<!-- svelte-ignore a11y_autofocus -->` disables the next warning. `@component` comments show up on hover in other files (supports markdown/code blocks).

## `{#if ...}`

```svelte
{#if expression}...{/if}
{#if expression}...{:else if expression}...{/if}
{#if expression}...{:else}...{/if}
```

## `{#each ...}`

```svelte
{#each expression as name}...{/each}
{#each expression as name, index}...{/each}
```

Values can be arrays, array-likes, or iterables (`Map`, `Set`) — converted via `Array.from`. `null`/`undefined` treated as empty array.

### Keyed each blocks

```svelte
{#each expression as name (key)}...{/each}
{#each expression as name, index (key)}...{/each}
```

Key must uniquely identify each item; Svelte inserts/moves/deletes intelligently rather than patching in place. Strings/numbers recommended. Destructuring/rest patterns supported.

### Each blocks without an item

```svelte
{#each expression}...{/each}
{#each expression, index}...{/each}
```

E.g. chess board: `{#each { length: 8 }, rank}`.

### Else blocks

```svelte
{#each expression as name}...{:else}...{/each}
```

Rendered if the list is empty.

## `{#key ...}`

```svelte
{#key expression}...{/key}
```

Destroys/recreates contents when the expression value changes — reinstantiates components, or replays transitions.

## `{#await ...}`

```svelte
{#await expression}...{:then name}...{:catch name}...{/await}
{#await expression}...{:then name}...{/await}
{#await expression then name}...{/await}
{#await expression catch name}...{/await}
```

Branches on pending/fulfilled/rejected. During SSR, only the pending branch renders (unless the expression isn't a `Promise`, in which case only `:then` renders). `catch`/initial block can be omitted. Can lazy-load components: `{#await import('./Component.svelte') then { default: Component }}`.

## `{#snippet ...}`

```svelte
{#snippet name()}...{/snippet}
{#snippet name(param1, param2, paramN)}...{/snippet}
```

Reusable chunks of markup, rendered via `{@render}`. Parameters can have defaults and be destructured (no rest parameters).

### Snippet scope

Declared anywhere; can reference outer values; visible to siblings and their children in the same lexical scope. Can reference themselves/each other (recursion).

### Passing snippets to components

- **Explicit props:** pass as named props, e.g. `<Table data={fruits} {header} {row} />`.
- **Implicit props:** snippets declared directly inside a component tag implicitly become props on it.
- **Implicit `children` snippet:** non-snippet content inside component tags becomes the `children` snippet. Can't have a prop named `children` if there's also content.
- **Optional snippet props:** `{@render children?.()}` or an `{#if children}...{:else}...{/if}` fallback.

### Typing snippets

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	interface Props {
		data: any[];
		children: Snippet;
		row: Snippet<[any]>;
	}
	let { data, children, row }: Props = $props();
</script>
```

Can use generics for tighter typing (`<script lang="ts" generics="T">`).

### Exporting snippets

Top-level snippets can be exported from `<script module>` if they don't reference non-module `<script>` declarations (Svelte 5.5.0+).

### Programmatic snippets

Via `createRawSnippet` (advanced).

### Snippets and slots

Slots (Svelte 4) are deprecated in favor of snippets.

## `{@render ...}`

```svelte
{@render sum(1, 2)}
```

Expression can be an identifier or arbitrary expression: `{@render (cool ? coolSnippet : lameSnippet)()}`.

### Optional snippets

```svelte
{@render children?.()}
```

or an `{#if}`/`:else` fallback.

## `{@html ...}`

```svelte
<article>{@html content}</article>
```

> Escape the string or only use trusted values, to prevent XSS. Never render unsanitized content.

Expression must be valid standalone HTML (`{@html '<div>'}content{@html '</div>'}` won't work). Doesn't compile Svelte code.

### Styling

`{@html}` content is invisible to scoped styles — use `:global` to target it.

## `{@attach ...}`

Functions that run in an effect when an element mounts or when state read inside the function updates; can return a cleanup function. (Available in Svelte 5.29+.)

```svelte
<script>
	function myAttachment(element) {
		console.log(element.nodeName);
		return () => console.log('cleaning up');
	}
</script>

<div {@attach myAttachment}>...</div>
```

An element can have any number of attachments.

### Attachment factories

A function can _return_ an attachment (e.g. `tooltip(content)`), re-running when reactive dependencies change.

### Inline attachments

```svelte
<canvas
	{@attach (canvas) => {
		/* ... */
	}}
></canvas>
```

### Conditional attachments

Falsy values (`false`/`undefined`) are treated as no attachment.

```svelte
<div {@attach enabled && myAttachment}>...</div>
```

### Passing attachments to components

On a component, `{@attach ...}` creates a prop keyed by a `Symbol`. If the component spreads props onto an element, that element receives the attachments — enabling wrapper components.

### Controlling when attachments re-run

Attachments are fully reactive (unlike actions) — re-run on changes to the factory function or its args or any state read inside. To avoid expensive re-setup, pass data inside a function and read it in a child effect.

### Creating attachments programmatically

Via `createAttachmentKey` (from `svelte/attachments`).

### Converting actions to attachments

Via `fromAction` (from `svelte/attachments`).

## `{@const ...}`

> Legacy syntax — prefer `{const x = $derived(y)}` (declaration tags).

```svelte
{#each boxes as box}
	{@const area = box.width * box.height}
	{box.width} * {box.height} = {area}
{/each}
```

Only allowed as an immediate child of a block, a component, or `<svelte:boundary>`.

## `{@debug ...}`

```svelte
{@debug user}
{@debug user1, user2, user3}
```

Logs values of specific variables (comma-separated names only, not arbitrary expressions) and pauses execution if devtools is open. Without arguments, inserts an unconditional `debugger` statement.

## `{let/const ...}`

Declaration tags define local variables in markup with `const`/`let` (available since Svelte 5.56; `{@const ...}` is legacy).

```svelte
{#each boxes as box}
	{const area = box.width * box.height}
	{const label = `${box.width} ⨉ ${box.height} = ${area}`}
	<p>{label}</p>
{/each}
```

For reactive values, combine with `$state`/`$derived`:

```svelte
{#if editing}
	{let name = $state(user.name)}
	{const greeting = $derived(`Hello ${name}`)}
	<input bind:value={name} />
	<p>{greeting}</p>
{/if}
```

Usable anywhere; can reference outer values; visible to siblings and children in the same lexical scope.

## `bind:`

`bind:` lets data flow child → parent. Syntax: `bind:property={expression}` (an lvalue). Shorthand `bind:value` when identifier matches property name. Svelte creates a listener that updates the bound value (existing listeners fire first). Most bindings are two-way; a few are readonly.

### Function bindings

`bind:property={get, set}` for validation/transformation (Svelte 5.9.0+):

```svelte
<input bind:value={() => value, (v) => (value = v.toLowerCase())} />
```

For readonly bindings (e.g. dimension bindings), `get` should be `null`:

```svelte
<div bind:clientWidth={null, redraw} bind:clientHeight={null, redraw}>...</div>
```

### `<input bind:value>`

```svelte
<input bind:value={message} />
```

Numeric inputs (`type="number"`/`"range"`) coerce to a number; empty/invalid → `undefined`. Since 5.6.0, `defaultValue` on an `<input>` inside a `<form>` is used on reset (initial render prefers the binding value unless null/undefined).

### `<input bind:checked>`

For checkboxes. Since 5.6.0, `defaultChecked` used on form reset. Use `bind:group` for radios instead of `bind:checked`.

### `<input bind:indeterminate>`

Checkboxes can be in an indeterminate state independent of checked/unchecked.

### `<input bind:group>`

Radio inputs are mutually exclusive (single value); checkbox inputs populate an array. Only works within the same Svelte component.

### `<input bind:files>`

Gets the `FileList`. To set programmatically, must use a `DataTransfer` object (FileList can't be constructed/modified directly). `DataTransfer` may not exist server-side — leave state uninitialized to avoid SSR errors.

### `<select bind:value>`

Corresponds to the `value` property of the selected `<option>` (any value type). `<select multiple>` binds an array. Option value can be omitted if it matches text content. `selected` attribute sets default value (used on form reset); binding value takes precedence on initial render if not undefined.

### `<audio>`

Two-way: `currentTime`, `playbackRate`, `paused`, `volume`, `muted`. Readonly: `duration`, `buffered`, `seekable`, `seeking`, `ended`, `readyState`, `played`.

### `<video>`

Same as `<audio>` plus readonly `videoWidth`/`videoHeight`.

### `<img>`

Readonly: `naturalWidth`, `naturalHeight`.

### `<details bind:open>`

Binds to the `open` property.

### `window`/`document`

See `<svelte:window>` and `<svelte:document>`.

### Contenteditable bindings

`innerHTML`, `innerText`, `textContent` on elements with `contenteditable`.

### Dimensions

Readonly, measured via `ResizeObserver`: `clientWidth`, `clientHeight`, `offsetWidth`, `offsetHeight`, `contentRect`, `contentBoxSize`, `borderBoxSize`, `devicePixelContentBoxSize`.

> `display: inline` elements (except intrinsically-sized ones like `<img>`/`<canvas>`) have no width/height and can't be observed — change `display` to something else (e.g. `inline-block`).

### `bind:this`

```svelte
<canvas bind:this={canvas}></canvas>
```

Value is `undefined` until mounted — read inside an effect/handler, not during initialisation. Components support `bind:this` too, exposing instance exports.

### `bind:property` for components

```svelte
<Keypad bind:value={pin} />
```

Mark the prop bindable in the child with `$bindable()`. Declaring bindable means it _can_ (not _must_) be bound. Bindable props can have fallback values (applies only when unbound; if bound + fallback present, parent must supply non-undefined or a runtime error is thrown).

## `use:`

> In Svelte 5.29+, consider attachments (`{@attach}`) instead — more flexible/composable.

Actions run when an element mounts, added via `use:`, typically using `$effect` for setup/teardown:

```svelte
<script>
	function myaction(node) {
		$effect(() => {
			// setup
			return () => {
				/* teardown */
			};
		});
	}
</script>

<div use:myaction>...</div>
```

Called with an argument: `use:myaction={data}` — called once (not during SSR), does _not_ re-run if the argument changes.

> **Legacy:** Before `$effect`, actions could return `{ update, destroy }` — effects are preferred now.

### Typing

`Action<NodeType, Param, CustomEvents>` interface, e.g. for typing custom dispatched events like `swipeleft`/`swiperight`.

## `transition:`

Triggered by an element entering/leaving the DOM due to a state change. While a block transitions out, all its elements (even without their own transitions) stay in the DOM until every transition completes. `transition:` is _bidirectional_ — reversible mid-flight.

```svelte
<script>
	import { fade } from 'svelte/transition';
	let visible = $state(false);
</script>

{#if visible}<div transition:fade>fades in and out</div>{/if}
```

### Local vs global

Local (default): only play when their own block is created/destroyed. `|global`: play when any ancestor block changes too.

### Built-in transitions

From `svelte/transition`.

### Transition parameters

```svelte
<div transition:fade={{ duration: 2000 }}>...</div>
```

### Custom transition functions

```ts
transition = (node, params, options: { direction: 'in' | 'out' | 'both' }) => ({
	delay?, duration?, easing?, css?: (t, u) => string, tick?: (t, u) => void
})
```

If `css` is returned, Svelte generates web-animation keyframes. `t` goes 0→1 (in) or 1→0 (out) after easing; `u = 1 - t`. Called repeatedly _before_ the transition begins. Prefer `css` over `tick` (web animations run off main thread). If the function returns a function instead of an object, it's called in the next microtask (enables crossfade coordination). Third arg `options.direction` is `in`/`out`/`both`.

### Transition events

`introstart`, `introend`, `outrostart`, `outroend` are dispatched in addition to standard DOM events.

## `in:` and `out:`

Like `transition:` but not bidirectional — an `in` continues playing alongside an `out` rather than reversing if outroed mid-flight. Aborted out transitions restart from scratch.

## `animate:`

Triggered when contents of a _keyed_ each block reorder (not on add/remove). Must be on an element that's an _immediate_ child of a keyed each block. Use built-in (`svelte/animate`) or custom functions.

```svelte
{#each list as item, index (item)}
	<li animate:flip>{item}</li>
{/each}
```

### Animation parameters

```svelte
<li animate:flip={{ delay: 500 }}>{item}</li>
```

### Custom animation functions

```ts
animation = (node, { from: DOMRect, to: DOMRect }, params) => ({
	delay?, duration?, easing?, css?: (t, u) => string, tick?: (t, u) => void
})
```

`from`/`to` are DOMRects of start/end position. As with transitions, prefer `css` over `tick`.

## `style:`

Shorthand for setting multiple styles:

```svelte
<div style:color="red">...</div>
<!-- equivalent to style="color: red;" -->
```

Supports expressions, shorthand (`style:color`), multiple styles per element, `|important` modifier, and CSS custom properties (`style:--columns={columns}`). `style:` directives take precedence over `style` attributes, even over `!important`.

## `class`

Two ways: `class` attribute and `class:` directive.

### Attributes

```svelte
<div class={large ? 'large' : 'small'}>...</div>
```

> Falsy values like `false`/`NaN` are stringified (historical reasons); `undefined`/`null` omit the attribute. Future Svelte will omit all falsy values.

### Objects and arrays

Since 5.16, `class` can be an object or array (converted via `clsx`):

```svelte
<div class={{ cool, lame: !cool }}>...</div>
<div class={[faded && 'opacity-50 saturate-0', large && 'scale-200']}>...</div>
```

Arrays can nest arrays/objects (flattened) — useful for combining local classes with props:

```svelte
<button {...props} class={['cool-button', props.class]}>{@render props.children?.()}</button>
```

Since 5.19, `ClassValue` type exported from `svelte/elements` for type-safe class props.

### The `class:` directive

Pre-5.16 convenience, largely superseded by the `class` attribute's object/array form:

```svelte
<div class:cool class:lame={!cool}>...</div>
<div class:cool class:lame={!cool}>...</div>
<!-- shorthand -->
```

## `await`

Since Svelte 5.36, `await` can be used inside components (top-level `<script>`, `$derived(...)`, markup). Experimental — opt in via `compilerOptions.experimental.async: true` in `svelte.config.js`. Flag removed in Svelte 6.

### Synchronized updates

Changes to state an `await` expression depends on are not reflected in the UI until the async work completes — prevents inconsistent UI. Updates can overlap; a fast update can be reflected while an earlier slow one is still ongoing.

### Concurrency

Independent `await` expressions in markup run in parallel, even if visually sequential. Sequential `await`s inside `<script>`/async functions run like normal async JS. Independent `$derived(await ...)` expressions update independently once created (though creation is sequential) — watch for `await_waterfall` warnings.

### Indicating loading states

Wrap content in `<svelte:boundary>` with a `pending` snippet — shown on first creation only, not subsequent updates (use `$effect.pending()` for those). `settled()` (from `svelte`) returns a promise resolving when the current update completes.

### Error handling

Errors in `await` bubble to the nearest error boundary (`<svelte:boundary>`).

### Server-side rendering

`render(...)` from `svelte/server` supports async SSR — `await render(App)`. If a `<svelte:boundary>` with `pending` is hit during SSR, that snippet renders while the rest is ignored; other `await`s resolve before `render(...)` returns.

### Forking

`fork(...)` (from `svelte`, added 5.42) lets you run `await` expressions you _expect_ to happen soon (e.g. preloading on hover/focus), returning a `Fork` with `commit()`/`discard()`.

### Caveats / Breaking changes

Experimental — subject to change. With `experimental.async: true`, block effects (`{#if}`, `{#each}`) now run before `$effect.pre`/`beforeUpdate` in the same component.

## Scoped styles

`<style>` CSS is scoped by default via a hashed class (e.g. `svelte-123xyz`) added to affected elements.

### Specificity

Scoped selectors get a specificity increase of 0-1-0 from the scoping class — a component's `p` selector beats a global stylesheet's `p`, even loaded later. After the first occurrence, repeated scoping classes use `:where(.svelte-xyz123)` to avoid further specificity increases.

### Scoped keyframes

`@keyframes` names are scoped/hashed too; `animation` rules adjusted accordingly.

## Global styles

### `:global(...)`

```svelte
<style>
	:global(body) {
		margin: 0;
	}
	div :global(strong) {
		color: goldenrod;
	}
	p:global(.big.red) {
		/* ... */
	}
</style>
```

Global keyframes need `-global-` prefix (stripped at compile time, referenced elsewhere without the prefix).

### `:global`

```svelte
<style>
	:global {
		div { ... }
		p { ... }
	}
	.a :global { .b .c .d {...} }
</style>
```

Equivalent to `.a :global .b .c .d`, but nested form preferred.

## Custom properties

Pass static/dynamic CSS custom properties to components:

```svelte
<Slider bind:value min={0} max={100} --track-color="black" --thumb-color="rgb({r} {g} {b})" />
```

Desugars to a wrapping `<svelte-css-wrapper style="display:contents; ...">` (or `<g>` for SVG). Read with `var(...)` and fallbacks inside the component. Custom properties can also be defined on a parent element/`:root` in a global stylesheet.

> The extra wrapper element doesn't affect layout but _does_ affect selectors using `>` to target a direct child of the component's container.

## Nested `<style>` elements

Only one top-level `<style>` tag per component. A `<style>` nested inside other elements/blocks is inserted as-is (unscoped, unprocessed) into the DOM.

## `<svelte:boundary>`

```svelte
<svelte:boundary onerror={handler}>...</svelte:boundary>
```

(Added 5.3.0.) Walls off parts of your app to: show UI while `await` expressions first resolve, and handle rendering/effect errors with fallback UI. If a boundary handles an error, its existing content is removed.

> Errors outside the render process (event handlers, `setTimeout`, async work after the fact) are NOT caught by error boundaries.

### Properties

- **`pending`** — snippet shown while the boundary is first created, until all `await`s inside resolve. Not shown for subsequent async updates (use `$effect.pending()` for those). In the playground, your app is wrapped in a boundary with an empty pending snippet.
- **`failed`** — snippet rendered on error, receiving `(error, reset)`; `reset` recreates the contents. Can be passed explicitly (`{failed}`) or implicitly (declared inside the boundary).
- **`onerror`** — called with `(error, reset)`, useful for error reporting or lifting `error`/`reset` outside the boundary via component state. Rethrown/inner errors bubble to a parent boundary if one exists.

### Using `transformError`

By default, error boundaries have no effect server-side (a render error fails the whole render). Since 5.51, boundaries with a `failed` snippet can control this via `render(...)`'s `transformError` option (SvelteKit handles this automatically if you use it).

---

# PART 2 — SVELTEKIT

## Introduction

### What is SvelteKit?

SvelteKit is a framework for rapidly developing robust, performant web applications using Svelte. Coming from React, it's similar to Next; from Vue, similar to Nuxt.

### What is Svelte?

Svelte is a way of writing UI components that the compiler converts into JS (render) and CSS (style). You don't need to know Svelte to follow SvelteKit docs, but it helps.

### SvelteKit vs Svelte

Svelte renders UI components; SvelteKit builds entire apps around modern best practices: a router, build optimizations, offline support, preloading, configurable rendering (SSR/CSR/prerendering), image optimization, and more — leveraging Vite + the Svelte plugin for HMR.

## Creating a project

```sh
npx sv create my-app
cd my-app
npm run dev
```

Two basic concepts: each page is a Svelte component; pages are created by adding files to `src/routes` (server-rendered first visit, then client-side takeover).

### Editor setup

VS Code + Svelte extension recommended (other editors supported too).

## Project types

SvelteKit offers configurable rendering — you can mix rendering strategies per-route. Rendering settings, project structure, and routing stay the same regardless of project type; only the adapter/config changes.

- **Default rendering** — SSR for first page, CSR for subsequent nav ("transitional apps").
- **Static site generation (SSG)** — `adapter-static` fully prerenders; or `prerender` page option per-route with a different adapter for dynamic pages.
- **Single-page app (SPA)** — exclusively CSR.
- **Multi-page app (MPA)** — `data-sveltekit-reload` for full page nav; `csr = false` removes all JS on a page.
- **Separate backend** — deploy SvelteKit frontend separately (adapter-node/serverless) or as an SPA served by your backend.
- **Serverless app** — `adapter-auto` (zero config) or `adapter-vercel`/`adapter-netlify`/`adapter-cloudflare`, some with `edge` option.
- **Your own server** — `adapter-node`.
- **Container** — `adapter-node` in Docker/LXC.
- **Library** — `@sveltejs/package` via `sv create` library template.
- **Offline app** — full service worker support.
- **Mobile app** — SvelteKit SPA + Tauri or Capacitor.
- **Desktop app** — SvelteKit SPA + Tauri, Wails, or Electron.
- **Browser extension** — `adapter-static` or community adapters.
- **Embedded device** — efficient rendering; `bundleStrategy: 'single'` helps limit concurrent requests.

## Project structure

```tree
my-project/
├ src/
│ ├ lib/
│ │ ├ server/
│ │ │ └ [your server-only lib files]
│ │ └ [your lib files]
│ ├ params/
│ │ └ [your param matchers]
│ ├ routes/
│ │ └ [your routes]
│ ├ app.html
│ ├ error.html
│ ├ hooks.client.js
│ ├ hooks.server.js
│ ├ service-worker.js
│ └ instrumentation.server.js
├ static/
│ └ [your static assets]
├ tests/
│ └ [your tests]
├ package.json
├ svelte.config.js
├ tsconfig.json
└ vite.config.js
```

### `src`

- `lib` — library code, importable via `$lib` alias, packageable via `svelte-package`.
  - `server` — server-only lib code, `$lib/server` alias; SvelteKit blocks client imports of it.
- `params` — param matchers for advanced routing.
- `routes` — your routes; can colocate route-only components.
- `app.html` — page template with placeholders: `%sveltekit.head%`, `%sveltekit.body%`, `%sveltekit.assets%`, `%sveltekit.nonce%`, `%sveltekit.env.[NAME]%`, `%sveltekit.version%`.
- `error.html` — rendered when everything else fails; placeholders `%sveltekit.status%`, `%sveltekit.error.message%`.
- `hooks.client.js` / `hooks.server.js` — client/server hooks.
- `service-worker.js` — service worker.
- `instrumentation.server.js` — observability/instrumentation setup (requires adapter support; runs before app code loads).

Vitest unit tests (if added) live in `src` with `.test.js`.

### `static`

Assets served unaltered (e.g. `robots.txt`). Prefer `import`ing assets for hashed cache-busting names.

### `tests`

Playwright browser tests (if added).

### `package.json`

Must include `@sveltejs/kit`, `svelte`, `vite` as devDependencies; `"type": "module"` for native ESM (`.cjs` for legacy CommonJS).

### `svelte.config.js` / `tsconfig.json` / `vite.config.js`

Svelte/SvelteKit config; TypeScript config (extends generated `.svelte-kit/tsconfig.json`); Vite config using the `@sveltejs/kit/vite` plugin.

### `.svelte-kit`

Generated build directory (configurable via `outDir`) — safe to delete/ignore.

## Web standards

SvelteKit builds on standard Web APIs, available in modern browsers and many non-browser runtimes (Cloudflare Workers, Deno, Vercel Functions), polyfilled where needed in Node adapters.

### Fetch APIs

`fetch` available in hooks, server routes, browser. A special `fetch` in `load`, server hooks, API routes, and remote functions invokes endpoints directly during SSR (no HTTP roundtrip), preserves credentials, and allows relative URLs server-side.

- **Request** — `event.request` in hooks/server routes; `.json()`, `.formData()`.
- **Response** — returned from `fetch`/`+server.js` handlers.
- **Headers** — read `request.headers`, set `response.headers` (e.g. via the `json` helper).

### FormData

Native form submissions use `FormData` — `await event.request.formData()`.

### Stream APIs

`ReadableStream`, `WritableStream`, `TransformStream` for large/chunked responses.

### URL APIs

`URL` interface — `event.url`, `page.url`, `from`/`to` in navigation hooks. `URLSearchParams` via `url.searchParams`.

### Web Crypto

`crypto` global — used internally for CSP headers; also usable for e.g. `crypto.randomUUID()`.

## Routing

Filesystem-based router. `src/routes` = root; `src/routes/about` → `/about`; `src/routes/blog/[slug]` → dynamic parameter route. (Configurable via project config.)

Route files use a `+` prefix. Rules of thumb:

- All files can run on the server.
- All files run on the client except `+server` files.
- `+layout` and `+error` apply to subdirectories too.

### `+page`

#### `+page.svelte`

Defines a page; SSR on initial request, CSR on subsequent nav by default. Uses `<a>` for navigation (not a framework `<Link>`). Receives data via the `data` prop (typed with `PageProps`, added 2.16.0). As of 2.24, pages also receive a typed `params` prop (useful with remote functions).

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<h1>{data.title}</h1><div>{@html data.content}</div>
```

> **Legacy:** Svelte 4 used `export let data`.

#### `+page.js`

Exports a `load` function, runs server-side during SSR and client-side during nav.

```js
/// file: src/routes/blog/[slug]/+page.js
import { error } from '@sveltejs/kit';
/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	if (params.slug === 'hello-world') {
		return { title: 'Hello world!', content: '...' };
	}
	error(404, 'Not found');
}
```

Can also export page options: `prerender`, `ssr`, `csr`.

#### `+page.server.js`

For `load` that must run server-only (DB access, private env vars). `PageLoad` → `PageServerLoad`. Return value must be serializable via devalue. Can export the same page options, plus **actions** (form actions).

### `+error`

Custom error page per-route:

```svelte
<!--- file: src/routes/blog/[slug]/+error.svelte --->
<script>
	import { page } from '$app/state';
</script>

<h1>{page.status}: {page.error.message}</h1>
```

> **Legacy:** `$app/state` added in 2.12; earlier use `$app/stores`.

SvelteKit walks up the tree for the closest `+error.svelte`; falls back to a static `src/error.html`. If the root layout's `load` errors, the closest boundary is _above_ the root `+error`. 404s use `src/routes/+error.svelte`. `+error.svelte` is _not_ used for errors inside `handle` or `+server.js` handlers.

### `+layout`

#### `+layout.svelte`

Default layout:

```svelte
<script>
	let { children } = $props();
</script>

{@render children()}
```

Custom layouts (nav bars etc.) must include `{@render children()}`. Layouts nest — a `/settings` layout applies only below it while inheriting the root layout. Each layout inherits the one above unless using advanced layouts.

#### `+layout.js`

`load` function providing `data` to `+layout.svelte`, inherited by all child pages. Page options exported here become defaults for children.

#### `+layout.server.js`

Server-only version — `LayoutLoad` → `LayoutServerLoad`.

### `+server`

API routes ("endpoints"). Export HTTP-verb functions (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`, `HEAD`) taking a `RequestEvent`, returning a `Response`.

```js
/// file: src/routes/api/random-number/+server.js
import { error } from '@sveltejs/kit';
/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
	const min = Number(url.searchParams.get('min') ?? '0');
	const max = Number(url.searchParams.get('max') ?? '1');
	const d = max - min;
	if (isNaN(d) || d < 0) error(400, 'min and max must be numbers, and min must be less than max');
	return new Response(String(min + Math.random() * d));
}
```

Response body can be a `ReadableStream` (streaming/SSE, except on buffering platforms like Lambda). Helpers: `error`, `redirect`, `json` from `@sveltejs/kit`. Errors render a JSON or fallback-HTML error page depending on `Accept` header — `+error.svelte` is NOT used here. `+layout` files don't affect `+server.js` — use `handle` hook for pre-request logic.

#### Receiving data

```js
/// file: src/routes/api/add/+server.js
import { json } from '@sveltejs/kit';
/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { a, b } = await request.json();
	return json(a + b);
}
```

> Form actions are generally preferred for browser→server data.

If a `GET` handler exists, a `HEAD` request returns its `content-length`.

#### Fallback method handler

`export async function fallback({ request })` matches any unhandled method (e.g. `MOVE`). For `HEAD`, `GET` takes precedence over `fallback`.

#### Content negotiation

`+server.js` can coexist with `+page` files in the same directory. `PUT`/`PATCH`/`DELETE`/`OPTIONS` always go to `+server.js`. `GET`/`POST`/`HEAD` go to the page if `Accept` prioritizes `text/html`, else to `+server.js`. `GET` responses include `Vary: Accept` for correct caching.

### `$types`

SvelteKit generates a `$types.d.ts` (TS or JSDoc) giving type safety for root files. `PageProps`/`LayoutProps` (2.16.0+) shortcut typing `data` (+`form`/`children`). `PageLoad`/`PageServerLoad`/`LayoutLoad`/`LayoutServerLoad` type `params` and return values. VS Code / LSP-compatible editors can infer these types without explicit annotation (works with `svelte-check` too).

### Other files

Non-`+` files in route directories are ignored by SvelteKit — good for colocating route-specific components/utils. Shared code across routes → `$lib`.

## Loading data

### Page data

`+page.js` `load` exports feed the `data` prop of `+page.svelte`. Universal `load` (in `+page.js`) runs both server and browser (unless `ssr = false`, then browser-only). Server-only `load` (in `+page.server.js`) needs `PageServerLoad` type and can access private env vars / DB.

### Layout data

Same idea for `+layout.svelte`/`+layout.js`/`+layout.server.js` — data available to the layout and all its children.

### `page.data`

Access page data from a parent layout (e.g. root layout setting `<title>`) via `page.data` — typed by `App.PageData`.

> **Legacy:** `$app/state` since 2.12; earlier `$app/stores` (`$page.data`).

### Universal vs server

- Server `load` (`+page.server.js`/`+layout.server.js`) always runs server-side.
- Universal `load` (`+page.js`/`+layout.js`) runs server-side on first SSR visit, again during hydration (reusing fetch responses), then only client-side thereafter (or always client-side if `ssr` disabled — SPA mode).
- If both exist, server `load` runs first, and its return becomes the `data` property of the universal `load`'s event argument.
- **Input:** both get `params`, `route`, `url`, `fetch`, `setHeaders`, `parent`, `depends`, `untrack`. Server load event additionally has `clientAddress`, `cookies`, `locals`, `platform`, `request`.
- **Output:** universal `load` can return anything (custom classes, component constructors); server `load` must return devalue-serializable data (JSON + `BigInt`, `Date`, `Map`, `Set`, `RegExp`, cyclical refs); can include Promises (streamed). Custom types need transport hooks.
- **When to use which:** server for DB/private creds; universal for external API fetches (avoids extra hop) or non-serializable returns.

### Using URL data

- **`url`** — a `URL` instance; `url.hash` unavailable during `load` (server-only unavailability).
- **`route`** — `route.id`, e.g. `/a/[b]/[...c]`.
- **`params`** — derived from `url.pathname` + `route.id`.

### Making fetch requests

Provided `fetch` (in `load`): credentialed on server (inherits cookie/authorization), relative URLs server-side, internal `+server.js` requests skip the HTTP hop, SSR responses are captured/inlined into HTML (`text`/`json`/`arrayBuffer`; headers NOT serialized unless via `filterSerializedResponseHeaders`), hydration reads from HTML (consistency, no extra request).

### Cookies

Server `load` gets/sets cookies via `cookies`. Forwarded through provided `fetch` only if target host matches SvelteKit's own domain or a more specific subdomain. Not forwarded with `credentials: 'include'` (unknown domain ownership) — use `handleFetch` hook to work around.

### Headers

`setHeaders` (server-only effect) — e.g. to mirror upstream cache headers. Can't set a header twice; can't set `set-cookie` via `setHeaders` (use `cookies.set`).

### Using parent data

`await parent()` accesses parent `load` data. In `+page.server.js`/`+layout.server.js`, returns parent `+layout.server.js` data. In `+page.js`/`+layout.js`, returns parent `+layout.js` data (a missing `+layout.js` acts as `({data}) => data`, so server data still flows through). Avoid waterfalls — call independent async work before `await parent()`.

### Errors

`error(status, message)` from `@sveltejs/kit` throws for expected errors, rendering the nearest `+error.svelte`. Unexpected errors invoke `handleError` (500).

> No longer need `throw error(...)` since SvelteKit 2 — just call `error(...)`.

### Redirects

`redirect(status, location)` throws to redirect. Don't call inside `try {...}` (redirect would trigger the catch). Client-side programmatic nav: `goto` from `$app/navigation`.

### Streaming with promises

Server `load` can return promises for non-essential slow data — streamed to the browser as they resolve (skeleton loading states via `{#await}`). Await essential data last so parallel work starts immediately. Handle promise rejections (attach a noop `.catch` or use SvelteKit's `fetch`) to avoid "unhandled promise rejection" server crashes.

> On non-streaming platforms (Lambda, Firebase) responses buffer — page waits for all promises. Streaming only works with JS enabled; universal `load` shouldn't return promises for SSR'd pages (they're recreated client-side, not streamed). Headers/status/redirects can't change after streaming starts.

### Parallel loading

All `load` functions run concurrently for a given navigation; client-side nav groups multiple server `load` results into one response.

### Rerunning load functions

SvelteKit tracks dependencies to avoid unnecessary reruns:

- Reruns if a referenced `params`/`url` property changed, `url.searchParams` access on a changed param, `await parent()` reran (or a server-load parent for a universal-load child), a declared `fetch`/`depends` URL was invalidated, or `invalidateAll()` was called.
- Dependency tracking stops once `load` returns — e.g. reading `params.x` inside a streamed promise won't trigger reruns (dev warning given).
- Search params tracked independently from the rest of the URL.

#### Untracking dependencies

```js
export async function load({ untrack, url }) {
	if (untrack(() => url.pathname === '/')) return { message: 'Welcome!' };
}
```

#### Manual invalidation

`invalidate(url)` (from `$app/navigation`) reruns `load`s depending on that URL (via `fetch(url)` or `depends(url)`, where `url` can be a custom `[a-z]:...` identifier); `invalidateAll()` reruns everything. Server load never auto-depends on fetched URLs (avoids leaking secrets).

### Implications for authentication

Layout `load` doesn't run on every request (e.g. client-side nav between children); layout/page `load` run concurrently unless `await parent()` is called — if a layout `load` throws, page `load` still runs but its data won't reach the client. Strategies: use `handle` hooks to protect multiple routes upfront, or auth-guard specific `+page.server.js` loads; putting the guard only in `+layout.server.js` requires every child to `await parent()`.

### Using `getRequestEvent`

`getRequestEvent` (from `$app/server`) retrieves the current server `load`'s `event` without passing it around — useful for shared auth-guard helpers:

```js
/// file: src/lib/server/auth.js
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export function requireLogin() {
	const { locals, url } = getRequestEvent();
	if (!locals.user) {
		const params = new URLSearchParams({ redirectTo: url.pathname + url.search });
		redirect(303, `/login?${params}`);
	}
	return locals.user;
}
```

## Form actions

`+page.server.js` can export **actions** — server logic invoked via `<form>` `POST`, progressively enhanceable with JS.

### Default actions

```js
/// file: src/routes/login/+page.server.js
export const actions = {
	default: async (event) => {
		/* log the user in */
	}
};
```

```svelte
<form method="POST">
	<label>Email <input name="email" type="email" /></label>
	<label>Password <input name="password" type="password" /></label>
	<button>Log in</button>
</form>
```

Actions always use `POST` (GET should have no side effects). Invoke from other pages via `<form method="POST" action="/login">`.

### Named actions

```js
export const actions = {
	login: async (event) => {
		/* ... */
	},
	register: async (event) => {
		/* ... */
	}
};
```

Invoke via `action="?/register"` (or full path from elsewhere: `action="/login?/register"`). `formaction="?/register"` on a button targets a different action than the parent `<form>`. Can't mix default + named actions in the same file (query param persists in URL otherwise, breaking subsequent default POSTs).

### Anatomy of an action

Receives a `RequestEvent`; read via `request.formData()`. Response data is available via `form` prop (on the page you submitted from) and `page.form` app-wide until next update.

#### Validation errors

`fail(status, data)` (from `@sveltejs/kit`) returns e.g. 400/422 with data; available via `page.status`/`form`.

#### Redirects

Work exactly like in `load` — `redirect(status, location)`.

### Loading data

After an action runs (barring redirect/unexpected error), the page re-renders with the action's return as `form`, meaning `load` functions rerun afterward. `handle` runs _before_ the action and does NOT rerun after — update `event.locals` manually inside the action if you set/delete cookies there.

### Progressive enhancement

#### `use:enhance`

```svelte
<script>
	import { enhance } from '$app/forms';
</script>
<form method="POST" use:enhance>
```

Only works with `method="POST"` pointing at `+page.server.js` actions (not `GET`, not `+server.js` endpoints — errors otherwise). Default behavior (no argument): updates `form`/`page.form`/`page.status` (only if action is same-page), resets the form, `invalidateAll()` on success, `goto` on redirect, renders nearest `+error` on error, resets focus appropriately.

#### Customising `use:enhance`

Pass a `SubmitFunction` returning an optional callback receiving `ActionResult`:

```svelte
<form method="POST" use:enhance={({ formElement, formData, action, cancel, submitter }) => {
	return async ({ result, update }) => { /* ... */ };
}}>
```

To restore default post-submit behavior, call `update` (accepts `invalidateAll`/`reset`) or `applyAction(result)`. `applyAction` behavior by `result.type`: `success`/`failure` sets `page.status`/`form`/`page.form`; `redirect` calls `goto(location, { invalidateAll: true })`; `error` renders nearest `+error` boundary. Focus always resets.

#### Custom event listener

Full manual implementation using `fetch`, `deserialize` (from `$app/forms`, needed because `JSON.parse` doesn't handle `Date`/`BigInt`), `invalidateAll`, `applyAction`. `+server.js` alongside `+page.server.js` intercepts `fetch` by default — use the `x-sveltekit-action: true` header to route to the page action instead.

### Alternatives

`+server.js` for a JSON API (non-progressively-enhanced fetch calls).

### GET vs POST

`method="GET"` (or omitted) forms behave like `<a>` — client-side router navigation, invokes `load` but not an action; supports `data-sveltekit-reload`/`replacestate`/`keepfocus`/`noscroll` like links.

## Page options

Exported from `+page.js`/`+page.server.js` (or shared via `+layout.js`/`+layout.server.js`); child overrides parent; export from root layout for app-wide default.

### `prerender`

```js
export const prerender = true; // or false, or 'auto'
```

`true` on root layout + selective `false` also works. `'auto'` = prerendered but still included in the dynamic-SSR manifest (e.g. `/blog/[slug]` with some prerendered, some server-rendered). Prerenderer crawls `<a>` links from the root outward; explicit entry points via `config.kit.prerender.entries` or an `entries` export.

`building` from `$app/environment` is `true` while prerendering.

#### Prerendering server routes

`+server.js` isn't affected by layouts but inherits defaults from pages that fetch from it. If a page's `load` fetches `/my-server-route.json` and is prerendered, that route is treated as prerenderable unless it opts out.

#### When not to prerender

Rule: any two users hitting the page directly must get the same server content. Fine to prerender param-based routes (e.g. `[slug]`). `url.searchParams` access during prerendering is forbidden (use only in browser, e.g. `onMount`). Pages with actions can't be prerendered (needs a live server for POSTs).

#### Route conflicts

Prerendering writes files — you can't have `foo` (file) and `foo/bar` (needing `foo` as directory) simultaneously. Recommended: always include a file extension for `+server.js` routes. Pages avoid this via `foo/index.html`.

#### Troubleshooting

"marked as prerenderable but not prerendered" errors: fix via `config.kit.prerender.entries`/`entries` export, ensure a link exists from another prerendered SSR'd page, or switch to `prerender = 'auto'`.

### `entries`

```js
/// file: src/routes/blog/[slug]/+page.server.js
/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return [{ slug: 'hello-world' }, { slug: 'another-blog-post' }];
}
export const prerender = true;
```

Can be `async` (e.g. query a CMS).

### `ssr`

```js
export const ssr = false;
```

Renders an empty shell instead of full SSR (e.g. browser-only globals). Setting on root layout turns the whole app into an SPA. Not recommended for statically generated sites. Boolean/string-literal page options are evaluated statically; otherwise SvelteKit imports the module server-side (build + possibly runtime) — so browser-only code should live in `+page.svelte`/`+layout.svelte`, not `+page.js`/`+layout.js`.

### `csr`

```js
export const csr = false;
```

No hydration/JS shipped: works with HTML+CSS only, `<script>` tags removed, forms can't be progressively enhanced, links do full-page nav, HMR disabled.

```js
import { dev } from '$app/environment';
export const csr = dev; // enable during dev for HMR
```

### `trailingSlash`

`'never'` (default), `'always'`, or `'ignore'`. `/about/` redirects to `/about` by default. Exportable from `+layout.js`/`+layout.server.js`/`+server.js` too. Affects prerendering output filenames (`about/index.html` vs `about.html`).

> Ignoring trailing slashes not recommended — relative-path semantics differ, and `/x`/`/x/` are treated as separate (harmful to SEO) URLs.

### `config`

Adapter-specific deployment config (e.g. Vercel edge vs serverless). `config` objects merge at the top level only (not deeper) between layouts/pages.

```js
/** @type {import('some-adapter').Config} */
export const config = { runtime: 'edge' };
```

## State management

### Avoid shared state on the server

Servers are stateless conceptually but long-lived/shared in practice — never store per-user data in module-level variables (leaks between users, lost on restart). Authenticate via cookies + persist to a database.

### No side-effects in `load`

`load` should be pure — no writing to global/shared state. Just `return` the data and pass it around (or use `page.data`).

### Using state and stores with context

`page.data`/app state work via Svelte's context API (`setContext`/`getContext`) — not global state. Pattern: pass a function into `setContext` for reactivity across boundaries.

```svelte
<!--- file: src/routes/+layout.svelte --->
<script>
	import { setContext } from 'svelte';
	let { data } = $props();
	setContext('user', () => data.user);
</script>
```

```svelte
<!--- file: src/routes/user/+page.svelte --->
<script>
	import { getContext } from 'svelte';
	const user = getContext('user');
</script>

<p>Welcome {user().name}</p>
```

During SSR, deeper-level context updates won't propagate up to already-rendered parents (unlike CSR, where they will) — pass state _down_ to avoid hydration "flash". Without SSR, plain shared modules are fine.

### Component and page state is preserved

SvelteKit reuses layout/page components across navigation — lifecycle methods (`onMount`/`onDestroy`) don't rerun, only props update. Non-reactive derived values computed inline won't recalculate — use `$derived` for reactivity. Use `afterNavigate`/`beforeNavigate` if code truly needs to rerun, or wrap in `{#key page.url.pathname}` to force remount.

### Storing state in the URL

Good for filters/sort order that should survive reload/SSR — search params (`?sort=price&order=ascending`), accessible via `url` param in `load` or `page.url.searchParams` in components.

### Storing ephemeral state in snapshots

For disposable-but-nice-to-restore UI state (e.g. "is accordion open"), use SvelteKit's **snapshots** to associate component state with a history entry.

## Remote functions

_(Available since 2.27, experimental.)_

Remote functions provide type-safe client↔server communication. Called anywhere in your app, but always run server-side — safe to access server-only modules (env vars, DB clients). Combined with Svelte's experimental `await`, lets you load/manipulate data directly in components.

Opt in via `svelte.config.js`:

```js
/// file: svelte.config.js
const config = {
	kit: { experimental: { remoteFunctions: true } },
	compilerOptions: { experimental: { async: true } }
};
export default config;
```

### Overview

Exported from `.remote.js`/`.remote.ts` files (anywhere in `src`, except `src/lib/server`); four flavours: `query`, `form`, `command`, `prerender`. Client-side, exports become `fetch` wrappers hitting a generated HTTP endpoint. Third-party libraries can provide them too.

### `query`

Reads dynamic data server-side.

```js
/// file: src/routes/blog/data.remote.js
import { query } from '$app/server';
import * as db from '$lib/server/database';

export const getPosts = query(async () => {
	return await db.sql`SELECT title, slug FROM post ORDER BY published_at DESC`;
});
```

> For _static_ data, prefer `prerender` functions — queries can't be used when the whole page is prerendered (e.g. with `adapter-static`).

Returned query works like a `Promise`:

```svelte
<script>
	import { getPosts } from './data.remote';
</script>

<ul>
	{#each await getPosts() as { title, slug }}
		<li><a href="/blog/{slug}">{title}</a></li>
	{/each}
</ul>
```

Errors/pending states bubble to the nearest `<svelte:boundary>`. Alternative (non-`await`) API: `query.loading`, `.error`, `.current` properties.

#### Query arguments

```js
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query } from '$app/server';

export const getPost = query(v.string(), async (slug) => {
	const [post] = await db.sql`SELECT * FROM post WHERE slug = ${slug}`;
	if (!post) error(404, 'Not found');
	return post;
});
```

Validate args with any Standard Schema library (Zod, Valibot). Both argument and return value serialized via devalue (handles `Date`, `Map`, custom transport-hook types). For `query`/`prerender` args (not return values), objects/maps/sets are key-sorted for consistent cache keys regardless of property order (arrays preserve order).

#### Deduplication

Calling a query serializes the argument as a cache key: server-side, a request-scoped cache dedupes repeated calls; client-side, identical invocations share the same instance. You can `await` a query anywhere (components, handlers, `load`, callbacks) and SvelteKit dedupes across consumers. Cache persists while the query is in active use (rendered/awaited/referenced); released once unused.

#### Refreshing queries

```svelte
<button onclick={() => getPosts().refresh()}>Check for new posts</button>
```

Queries are cached on the page (`getPosts() === getPosts()`), so no local reference is needed.

### `query.batch`

Batches requests within the same macrotask (solves n+1). Server callback receives an array of call arguments and must return `(input, index) => output`:

```js
import * as v from 'valibot';
import { query } from '$app/server';
import * as db from '$lib/server/database';

export const getWeather = query.batch(v.string(), async (cityIds) => {
	const weather = await db.sql`SELECT * FROM weather WHERE city_id = ANY(${cityIds})`;
	const lookup = new Map(weather.map((w) => [w.city_id, w]));
	return (cityId) => lookup.get(cityId);
});
```

### `query.live`

For real-time data — callback (typically an async generator) returns an `AsyncIterable`:

```js
import { query } from '$app/server';
export const getTime = query.live(async function* () {
	while (true) {
		yield new Date();
		await new Promise((f) => setTimeout(f, 1000));
	}
});
```

During SSR, `await getTime()` returns the first yielded value then closes the iterator (serialized/reused for hydration). Client-side, the connection stays open while actively used (shared across instances), disconnecting when unused. Exposes `connected` property and `reconnect()` method.

---

# PART 3 — SVELTE CLI (`sv`)

## Overview

`sv` is a toolkit for creating and maintaining Svelte applications.

### Usage

```sh
npx sv <command> <args>
```

(Or the package-manager equivalent, e.g. `pnpm dlx sv <command>`.) If `sv` is already a local dependency, that installation is used; otherwise it downloads and runs the latest version without installing — handy for `sv create`.

### Acknowledgements

Thanks to Christopher Brown (original owner of the `sv` npm name) for allowing its use — his original package lives at `@chbrown/sv`.

## Frequently asked questions

### How do I run the `sv` CLI?

- **npm:** `npx sv create`
- **pnpm:** `pnpm dlx sv create`
- **Bun:** `bunx sv create`
- **Deno:** `deno run npm:sv create`
- **Yarn:** `yarn dlx sv create`

### `npx sv` is not working

Some package managers (mostly npm/yarn) prefer locally installed tools, which can cause silent no-ops or errors. Known issues/workarounds are tracked on GitHub (`npx sv create` does nothing; `sv` name collision with `runit`; `sv` conflicting with PowerShell's `Set-Variable`).

## `sv create`

Sets up a new SvelteKit project.

```sh
npx sv create [options] [path]
```

### Options

- **`--from-playground <url>`** — scaffold from a playground URL (downloads files, detects deps, sets up full project).
- **`--template <name>`** — `minimal` | `demo` | `library`.
- **`--types <option>`** — `ts` (default `.ts` files, `lang="ts"`) or `jsdoc`.
- **`--no-types`** — skip typechecking (not recommended).
- **`--add [add-ons...]`** — add-ons during create (same format as `sv add`), e.g. `npx sv create --add eslint prettier [path]`.
- **`--no-add-ons`** — skip the interactive add-ons prompt.
- **`--install <package-manager>`** — `npm`|`pnpm`|`yarn`|`bun`|`deno`.
- **`--no-install`** — skip dependency install.
- **`--no-dir-check`** — skip the empty-directory check.

## `sv add`

Updates an existing project with new functionality.

```sh
npx sv add
npx sv add [add-ons]
```

### Options

- **`-C`, `--cwd`** — path to the project root.
- **`--no-git-check`** — skip uncommitted-changes warning.
- **`--no-download-check`** — skip community add-on download warning (maintainers haven't reviewed community add-ons for malicious code!).
- **`--install <package-manager>`** — as above.
- **`--no-install`** — skip install prompt.

### Official add-ons

`ai-tools`, `better-auth`, `drizzle`, `eslint`, `mdsvex`, `paraglide`, `playwright`, `prettier`, `storybook`, `sveltekit-adapter`, `tailwindcss`, `vitest`.

### Community add-ons

Experimental. npm packages discoverable via the `sv-add` keyword on npmx.

```sh
npx sv add @supacool                       # org-published add-on
npx sv add file:../path/to/my-addon        # local add-on
npx sv add eslint @supacool                # mix official + community
npx sv create --add eslint @supacool       # during create
```

> On Windows PowerShell, escape `@` with single quotes: `npx sv add '@supacool'`.

## `sv check`

Finds errors/warnings: unused CSS, accessibility hints, JS/TS compiler errors. Requires Node 16+; requires `svelte-check` installed (`npm i -D svelte-check`).

```sh
npx sv check
```

### Options

- **`--workspace <path>`** — checks all subdirectories except `node_modules`/`--ignore`.
- **`--output <format>`** — `human` | `human-verbose` | `machine` | `machine-verbose`.
- **`--watch`** — keep process alive, watch for changes.
- **`--preserveWatchOutput`** — don't clear screen in watch mode.
- **`--tsconfig <path>`** — restrict to files matched by that config; also enables checking `.js`/`.ts` files.
- **`--no-tsconfig`** — only check `.svelte` files (skip `.js`/`.ts` type-checking).
- **`--ignore <paths>`** — comma-separated paths to ignore (relative to workspace root).
- **`--fail-on-warnings`** — non-zero exit on warnings.
- **`--compiler-warnings <warnings>`** — comma-separated `code:behaviour` pairs (`ignore`|`error`), e.g. `"css_unused_selector:ignore,a11y_missing_attribute:error"`.
- **`--diagnostic-sources <sources>`** — comma-separated `js`|`svelte`|`css` (all active by default).
- **`--threshold <level>`** — `warning` (default, shows both) | `error` (errors only).

### Machine-readable output

`machine`/`machine-verbose` output ndjson-like lines for CI: a `START` record with the workspace path, `ERROR`/`WARNING` records (filename, line/col, message; verbose adds end position, diagnostic code, description, source), and a final `COMPLETED` summary record (or `FAILURE` on runtime error).

### FAQ

**Why no "check only changed files" option?** `svelte-check` needs the whole project for valid checks — a renamed prop's usage sites elsewhere would be missed otherwise.

## `sv migrate`

Migrates Svelte(Kit) codebases (delegates to `svelte-migrate`). Annotates code with `@migration` tasks where needed.

```sh
npx sv migrate
npx sv migrate [migration]
```

### Migrations

- **`app-state`** — `$app/stores` → `$app/state` in `.svelte` files.
- **`svelte-5`** — Svelte 4 → 5, including runes migration.
- **`self-closing-tags`** — replaces self-closing non-void elements.
- **`svelte-4`** — Svelte 3 → 4.
- **`sveltekit-2`** — SvelteKit 1 → 2.
- **`package`** — `@sveltejs/package` v1 → v2.
- **`routes`** — pre-release SvelteKit → SvelteKit 1 filesystem routing.

## Official add-ons (details)

### `ai-tools`

Adds Svelte AI tooling (MCP server, skills, sub-agents) to help LLMs write better Svelte code.

```sh
npx sv add ai-tools
```

Delivery options: the **Svelte plugin** (bundles MCP + skills + sub-agents, auto-updating; available for Claude Code / OpenCode — Claude Code enables it via committed `.claude/settings.json`), or **individual tools** (MCP config for local/remote setup, an agents.md README, skills, sub-agents) for clients without plugin support.

Options: `ide` (`claude-code`, `cursor`, `gemini`, `opencode`, `vscode`, `other`), `delivery` (`plugin`|`tools`), `tools` (`mcp`, `svelte-code-writer`, `svelte-core-bestpractices`, `svelte-file-editor`), `mcpSetup` (`local`|`remote`).

### `better-auth`

[Better Auth](https://www.better-auth.com/) — framework-agnostic TS auth library.

```sh
npx sv add better-auth
```

Gives: complete SvelteKit auth setup with Drizzle adapter, email/password auth by default, optional demo pages.

Option: `demo` — `password` | `github` (or both).

### `drizzle`

[Drizzle ORM](https://orm.drizzle.team/).

```sh
npx sv add drizzle
```

Gives: DB access kept in server files, `.env` for credentials, Better Auth compatibility, optional Docker config.

Options: `database` (`postgresql`|`mysql`|`sqlite`), `client` (varies by database — e.g. `postgres.js`/`neon` for postgresql; `mysql2`/`planetscale` for mysql; `better-sqlite3`/`libsql`/`turso` for sqlite), `docker` (postgresql/mysql only).

### `eslint`

```sh
npx sv add eslint
```

Gives: packages incl. `eslint-plugin-svelte`, `eslint.config.js`, updated `.vscode/extensions.json`, TS/Prettier integration.

### `experimental`

Enables Svelte/SvelteKit experimental features, optionally moves packages to `next`.

```sh
npx sv add experimental
```

Options: `versions` (`kit` → `@sveltejs/kit@next` + adapter/peers), `features` (`async`, `remoteFunctions`, `explicitEnvironmentVariables` [SvelteKit ^2 only], `handleRenderingErrors`, `forkPreloads`).

### `mdsvex`

[mdsvex](https://mdsvex.pngwn.io) — MDX-like markdown preprocessor for Svelte.

```sh
npx sv add mdsvex
```

### `paraglide`

[Paraglide (Inlang)](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — compiler-based i18n.

```sh
npx sv add paraglide
```

Gives: Inlang project settings, Vite plugin, `reroute`/`handle` hooks, `text-direction`/`lang` attrs in `app.html`, updated `.gitignore`, optional demo page.

Options: `languageTags` (BCP 47 tags), `demo` (yes/no).

### `playwright`

```sh
npx sv add playwright
```

Gives: package.json scripts, Playwright config, updated `.gitignore`, a demo test.

### `prettier`

```sh
npx sv add prettier
```

Gives: package.json scripts, `.prettierignore`/`.prettierrc`, eslint config integration.

### `storybook`

```sh
npx sv add storybook
```

Runs `npx storybook init` via `sv`, wiring up Storybook for SvelteKit or Svelte+Vite with default config, SvelteKit module mocking, link handling.

### `sveltekit-adapter`

```sh
npx sv add sveltekit-adapter
```

Options: `adapter` — `auto` | `node` | `static` | `vercel` | `cloudflare` | `netlify`. `cloudflare target` (workers/pages) only for `cloudflare`.

### `tailwindcss`

```sh
npx sv add tailwindcss
```

Gives: Tailwind setup per official SvelteKit guide, Vite plugin, updated layout/app CSS files, Prettier integration.

Option: `plugins` — `typography` | `forms`.

### `vitest`

```sh
npx sv add vitest
```

Gives: packages + scripts, client/server-aware Vite test config, demo tests.

Option: `usages` — `unit` | `component`.

## Creating your own add-on

Experimental. Scaffold with:

```sh
npx sv create --template addon [path]
```

### Project structure

```js
import { transforms } from '@sveltejs/sv-utils';
import { defineAddon, defineAddonOptions } from 'sv';

export default defineAddon({
	id: 'addon-name',
	shortDescription: 'a better description of what your addon does ;)',
	options: defineAddonOptions()
		.add('who', { question: 'To whom should the addon say hello?', type: 'string' })
		.build(),
	setup: ({ dependsOn, isKit, unsupported, addOption }) => {
		if (!isKit) unsupported('Requires SvelteKit');
		dependsOn('vitest');
	},
	run: ({ isKit, cancel, sv, options, file, language, directory }) => {
		sv.file(
			directory.kitRoutes + '/+page.svelte',
			transforms.svelte(({ ast, svelte }) => {
				svelte.addFragment(ast, `<p>Hello ${options.who}!</p>`);
			})
		);
	},
	nextSteps: ({ options }) => ['enjoy the add-on!']
});
```

Two packages, clear boundary: **`sv`** = _where/when_ (paths, workspace detection, dependency tracking, file I/O, orchestration); **`@sveltejs/sv-utils`** = _what_ (parsers, language tooling, typed transforms — pure, no filesystem/workspace awareness). This makes transforms testable/composable independent of a workspace.

### Development

```sh
cd /path/to/test-project
npx sv add file:../path/to/my-addon
```

Also usable for private/internal add-ons not meant for npm publishing.

### Testing

`sv/testing` exports `createSetupTest` — a factory taking your vitest imports, returning `setupTest`, which creates real SvelteKit projects from templates, runs your add-on, and exposes the resulting files.

```js
import { expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createSetupTest } from 'sv/testing';
import * as vitest from 'vitest';
import addon from './index.js';

const { test, testCases } = createSetupTest(vitest)(
	{ addon },
	{
		kinds: [{ type: 'default', options: { 'your-addon-name': { who: 'World' } } }],
		filter: (testCase) => testCase.variant.includes('kit'),
		browser: false
	}
);

test.concurrent.for(testCases)('my-addon $kind.type $variant', async (testCase, ctx) => {
	const cwd = ctx.cwd(testCase);
	const page = fs.readFileSync(path.resolve(cwd, 'src/routes/+page.svelte'), 'utf8');
	expect(page).toContain('Hello World!');
});
```

Requires `globalSetup: ['tests/setup/global.js']` in `vitest.config.js`, with:

```js
import { fileURLToPath } from 'node:url';
import { setupGlobal } from 'sv/testing';
const TEST_DIR = fileURLToPath(new URL('../../.test-output/', import.meta.url));
export default setupGlobal({ TEST_DIR });
```

### Publishing

- **Bundling** — bundled with `tsdown` into a single file; everything except `sv` (a peer dependency).
- **`package.json`** — `sv` as `peerDependencies`, **no** `dependencies`, `exports` pointing at the bundled `.mjs`, `"keywords": ["sv-add", ...]` for discoverability.
- **Package names** — must publish under an npm org (`@my-org/sv`, not a bare name). Packages under the `sv` scope name can be referenced by org alone (`npx sv add @my-org`). Version pinning: `npx sv add @my-org/sv@1.2.3`.
- **Entry points** — CLI looks for `./sv` export first, falls back to `.`; supports either a dedicated add-on package (default export) or a multi-purpose package (`./sv` sub-export).
- **Publish** — `npm login && npm publish` (`prepublishOnly` builds automatically).

### Next steps output

```js
import { color } from '@sveltejs/sv-utils';
export default defineAddon({
	nextSteps: ({ options }) => [
		`Run ${color.command('npm run dev')} to start developing`,
		`Check out the docs at https://...`
	]
});
```

### Version compatibility

Specify a minimum `sv` version in `peerDependencies` — users get a compatibility warning on major-version mismatch.

## `sv` programmatic API

### `defineAddon`

See "Creating your own add-on" above for the full shape (`id`, `options`, `setup`, `run`, `nextSteps`). The `run` callback's `sv` object provides `file`, `dependency`, `devDependency`, `execute`.

#### Typed dynamic options

```ts
import { defineAddon, defineAddonOptions } from 'sv';
const addon = defineAddon<{ theme: string }>()({
	id: 'my-addon',
	options: defineAddonOptions().build(),
	setup: ({ addOption }) => {
		addOption('theme', { question: 'Which theme?', type: 'string', default: 'dark' });
	},
	run: ({ options }) => {
		options.theme; /* string */
	}
});
```

### `defineAddonOptions`

Builder pattern, chained `.add()`, finalized `.build()`:

```js
import { defineAddonOptions } from 'sv';
const options = defineAddonOptions()
	.add('database', {
		question: 'Which database?',
		type: 'select',
		default: 'postgresql',
		options: [{ value: 'postgresql' }, { value: 'mysql' }, { value: 'sqlite' }]
	})
	.add('docker', {
		question: 'Add a docker-compose file?',
		type: 'boolean',
		default: false,
		condition: (opts) => opts.database !== 'sqlite'
	})
	.build();
```

Options asked in order; `condition` callback receives answers so far — `false` skips (value becomes `undefined`).

### `create`

```js
import { create } from 'sv';
create({ cwd: './my-app', name: 'my-app', template: 'minimal', types: 'typescript' });
```

### `add`

```js
import { add, officialAddons } from 'sv';
await add({
	cwd: './my-app',
	addons: { prettier: officialAddons.prettier },
	options: { prettier: {} },
	packageManager: 'npm'
});
```

## `@sveltejs/sv-utils`

Experimental utility package for parsing/transforming/generating code.

```sh
npm install -D @sveltejs/sv-utils
```

### `transforms`

Parser-aware functions for AST-based file edits; return value feeds directly into `sv.file()`. Parser choice is baked into the transform type (no accidental cross-parsing).

- **`transforms.script`** — JS/TS file; callback gets `{ ast, comments, content, js }`.
- **`transforms.svelte`** — Svelte component; callback gets `{ ast, content, svelte, js }`.
- **`transforms.svelteScript`** — Svelte component with guaranteed `<script>` (`ast.instance` non-null); pass `{ language }` first.
- **`transforms.css`** — callback gets `{ ast, content, css }`.
- **`transforms.json`** — mutate `data` directly; callback gets `{ data, content, json }`.
- **`transforms.yaml` / `transforms.toml`** — same pattern; callback gets `{ data, content }`.
- **`transforms.text`** — plain text (`.env`, `.gitignore`); no parser; callback gets `{ content, text }`.

**Aborting:** return `false` from any callback to leave content unchanged.

**Standalone/testing:** transforms are curried — call with the callback, then apply to content directly: `transform('export default {}')`.

**Composability:** use `sv.file(path, (content) => { ... })` with a content callback, invoking curried transforms manually and mixing in raw string edits. Add-ons can export reusable transform functions for reuse across files.

### Parsers (low-level)

```js
import { parse } from '@sveltejs/sv-utils';
const { ast, generateCode } = parse.script(content);
const { ast, generateCode } = parse.svelte(content);
const { ast, generateCode } = parse.css(content);
const { data, generateCode } = parse.json(content);
const { data, generateCode } = parse.yaml(content);
const { data, generateCode } = parse.toml(content);
const { ast, generateCode } = parse.html(content);
```

### Language tooling namespaces

- **`js.*`** — imports, exports, objects, arrays, variables, functions, Vite config helpers, SvelteKit helpers.
- **`css.*`** — rules, declarations, at-rules, imports.
- **`svelte.*`** — `ensureScript`, `addSlot`, `addFragment`.
- **`json.*`** — `arrayUpsert`, `packageScriptsUpsert`.
- **`html.*`** — attribute manipulation.
- **`text.*`** — upsert lines in flat files (`.env`, `.gitignore`).

### Svelte config helpers

Svelte/kit config can live in `vite.config.{js,ts}` (`sveltekit()` plugin argument) or a separate `svelte.config.{js,ts}` default export. `sv create` projects keep config in `vite.config.js` with no `svelte.config.js`. `svelteConfig` reads/edits it wherever it lives.

#### `svelteConfig.edit`

```js
import { svelteConfig } from '@sveltejs/sv-utils';
svelteConfig.edit({ sv, cwd }, ({ ast, property, override, js }) => {
	js.array.append(property('extensions', { fallback: js.array.create() }), '.svx');
	js.imports.addDefault(ast, { from: '@sveltejs/adapter-node', as: 'adapter' });
	override({
		adapter: js.functions.createCall({ name: 'adapter', args: [], useIdentifiers: true })
	});
});
```

Svelte-level options (`compilerOptions`, `preprocess`, `extensions`, `vitePlugin`) sit on the config object directly; everything else (`adapter`, `alias`, `files`, `typescript`, ...) is a kit option, auto-routed (flattened onto `sveltekit()` in a vite config, or nested under `kit` in a `svelte.config`).

- **`property(name, { fallback })`** — get-or-create a value to mutate in place.
- **`override(props, { dropLeadingComments })`** — set/replace options.

Writes through `sv.file`; creates `svelte.config.js` if neither config file exists.

#### `svelteConfig.find` / `svelteConfig.read`

Both read via an injected `read(path)` (never execute the config, for static detection).

- **`svelteConfig.find(read)`** — `{ path, kind: 'vite' | 'svelte' }` or `null` (`svelte.config` wins if both present).
- **`svelteConfig.read(read)`** — `{ location, config, kit }` (object expressions) or `null`.

### Package manager helpers

#### `pnpm.allowBuilds`

Transform for `pnpm-workspace.yaml`, adding packages to the pnpm "allow builds" config. pnpm ≥ 11 writes the unified `allowBuilds` map (migrating any legacy `onlyBuiltDependencies` list); pnpm < 11 writes the legacy `onlyBuiltDependencies` list (detected via `pnpm --version`).

```js
import { pnpm } from '@sveltejs/sv-utils';
if (packageManager === 'pnpm') {
	sv.file(file.findUp('pnpm-workspace.yaml'), pnpm.allowBuilds('my-native-dep'));
}
```

---

_End of compiled reference. Source: https://svelte.dev/docs (Svelte, SvelteKit, and CLI sections), retrieved 2026-08-11._
