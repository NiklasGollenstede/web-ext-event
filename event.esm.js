
const setEvent = /**@type{import('./event').setEvent}*/(function setEvent(target, name, { init, async: _async = false, writable = false, once = false, } = { }) {
	let all = /**@type{Map<import('./event').Listener, (import('./event').ListenerOptions&{ handleEvent(): void, })|undefined>|null}*/(init ? new Map(typeof init === 'function' ? [ [ init, null, ], ] : Array.from(init, f => [ f, null, ])) : new Map);

	const event = (/**@type{import('./event').Event}*/(function(it, options) {
		if (!all || typeof it !== 'function' || all.has(it)) { return false; }
		if (options) {
			const { owner = null, once = false, } = options, ctx = { owner, once, handleEvent: null, };
			if (owner) { ctx.handleEvent = () => event.removeListener(it); owner.addEventListener('unload', ctx); }
			all.set(it, ctx);
		} else { all.set(it, undefined); }
		return typeof fire.onadd === 'function' && fire.onadd(it, options) || true;
	})).bind();
	Object.defineProperty(event, 'name', { value: name, });
	Object.assign(event, {
		addListener(it) { return event(it, null); },
		hasListener(it) { return all && all.has(it); },
		removeListener(it) {
			if (!all || !all.has(it)) { return false; }
			const ctx = all.get(it); ctx && ctx.owner && ctx.owner.removeEventListener('unload', ctx);
			typeof fire.onremove === 'function' && fire.onremove(it);
			return all.delete(it);
		},
	});
	Object.defineProperty(target, name, { value: event, writable, enumerable, configurable, });

	async function fire(/**@type{any[]|null}*/args, /**@type{import('./event').EventTriggerOptions}*/options) {
		if (!all) { return 0; } if (_async) { (await null); }
		const ready = args !== null && Promise.all(Array.from(
			all // must create a slice of the map before calling the handlers, otherwise any additional handlers added will catch this event
		).map(async ([ listener, ctx, ]) => {
			ctx && ctx.once && event.removeListener(listener);
			if (options && options.filter && !options.filter(listener)) { return false; }
			try { (await listener(...args)); return true; }
			catch (error) { console.error(`${name} listener threw`, error); return false; }
		}));
		if (options && options.last != null ? options.last : once) { all.clear(); all = null; }
		return !ready ? 0 : (await ready).reduce((c, b) => b ? c + 1 : c, 0);
	}

	Object.defineProperty(fire, 'size', { get() { return all ? all.size : 0; }, enumerable, configurable, });
	fire.onadd = fire.onremove = null;
	return fire;
});


/**
 * @deprecated
 * Defines an `Event` as a class prototype property. The event will be available as non-configurable getter
 * `on<name>` on the prototype (like getters defined in a class literal).
 * The backing `Event` instance will be created on first access and is stored on the mapped private object
 * as `on<name>` (see `Self`); the `fire` function is stored on the same object as `fire<name>`.
 * Usage example:
 *     const Self = new WeakMap;
 *     class Class {
 *         constructor() { Self.set(this, { }); }
 *         fire() { const self = Self.get(this); self.fireEvent && self.fireEvent([ ...arguments, ]); }
 *     }
 *     setEventGetter(Class, 'event', Self);
 *     const instance = new Class;
 *     instance.fire('nothing'); // no-op, self.fireEvent not defined yet
 *     instance.onEvent.addListener(thing => console.log('hello', thing));
 *     instance.fire('world'); // logs 'hello world'
 * @param  {function}  Class   Constructor function on whose prototype the event getter will be defined.
 * @param  {string}    name    Name of the event. The first letter will be capitalized and prefixed with 'on'/'fire'.
 * @param  {WeakMap}   Self    A WeakMap that maps valid instances of `Class` to private objects.
 *                             Invoking the getter on objects that are not keys in the map will throw.
 *                             (Specifically, a object with a `get()` method that takes instances and returns objects.)
 * @param  {object}    options
 * @param  {boolean}   options.async  Forwarded as `setEvent(..., { async, })`.
 * @param  {boolean}   options.once   Forwarded as `setEvent(..., { once, })`.
 */
function setEventGetter(Class, name, Self, { async: _async = false, once = false, } = /**@type{any}*/({ })) {
	name =  name.replace(/^./, _=>_.toUpperCase()); const on = 'on'+ name, fire = 'fire'+ name;
	return Object.defineProperty(Class.prototype, on, { get() {
		const self = Self.get(this); if (self[on]) { return self[on]; }
		self[fire] = setEvent(self, on, { async: _async, once, });
		return self[on];
	}, configurable, });
}

const enumerable = true, configurable = true;

export default {
	setEvent,
	setEventGetter,
};

