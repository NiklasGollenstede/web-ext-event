
/** @typedef {import('./index').Listener<any>} Listener */

/**@type{import('./index').setEvent}*/
export function setEvent(target, name, { init, async: _async = false, writable = false, once = false, } = { }) {
	/** @typedef {import('./index').ListenerOptions & { handleEvent(): void, }} Ctx */
	let all = /**@type{Map<Listener, (Ctx)|undefined>|null}*/(init ? new Map(typeof init === 'function' ? [ [ init, null, ], ] : Array.from(init, f => [ f, null, ])) : new Map);

	const event = /**@type{import('./index').Event<any>}*/((function(/**@type{Listener}*/it, /**@type{import('./index').ListenerOptions|undefined}*/options) {
		if (!all || typeof it !== 'function' || all.has(it)) { return false; }
		if (options) {
			const { owner = null, once = false, } = options, ctx = /**@type{Ctx}*/({ owner, once, });
			if (owner) {
				const handleEvent = ctx.handleEvent = () => event.removeListener(it);
				if (('addEventListener' in owner) && ('onunload' in owner)) { owner.addEventListener('unload', handleEvent); }
				else if (typeof owner.onDisconnect?.addListener === 'function') { owner.onDisconnect.addListener(handleEvent); }
			}
			all.set(it, ctx);
		} else { all.set(it, undefined); }
		return typeof fire.onadd === 'function' && fire.onadd(it, options) || true;
	}).bind(null));
	Object.defineProperty(event, 'name', { value: name, });
	Object.assign(event, {
		addListener(/**@type{Listener}*/it) { return event(it, undefined); },
		hasListener(/**@type{Listener}*/it) { return all && all.has(it); },
		removeListener(/**@type{Listener}*/it) {
			const ctx = all?.get(it); if (!ctx) { return false; }
			const { owner, handleEvent, } = ctx;
			if (owner) {
				if (('addEventListener' in owner) && ('onunload' in owner)) { owner.removeEventListener('unload', handleEvent); }
				else if (typeof owner.onDisconnect?.addListener === 'function') { owner.onDisconnect.removeListener(handleEvent); }
			}
			typeof fire.onremove === 'function' && fire.onremove(it);
			return all?.delete(it);
		},
	});
	Object.defineProperty(target, name, { value: event, writable, enumerable, configurable, });

	/**@type{import('./index').EventTrigger<any>}*/
	async function fire(/**@type{any[]|null}*/args, /**@type{import('./index').EventTriggerOptions<any>|null|undefined}*/options) {
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
}

// @ts-ignore
/**@type{import('./index').setEventGetters}*/ // @ts-ignore
export function setEventGetters(Class, /**@type{string[]}*/names, Self, { async: _async = false, once: once = false, } = ({ })) {
	if (Array.isArray(Class)) { return /**@type{any}*/(setEventGetters(null, .../**@type{[ any, any, any, ]}*/(/**@type{any}*/(arguments)))); }
	const ext = class WithEvents extends (Class || Object) { }; names.forEach(name => {
		name = name.replace(/^./, _=>_.toUpperCase()); const on = 'on'+ name, fire = 'fire'+ name;
		Object.defineProperty(ext.prototype, on, { get() {
			const self = Self.get(this); if (self[on]) { return self[on]; }
			self[fire] = setEvent(self, on, { async: _async, once, });
			return self[on];
		}, configurable, });
	});
	if (Class) {
		const props = Object.getOwnPropertyDescriptors(Class);
		delete props.prototype; Object.defineProperties(ext, props);
	} return /**@type{any}*/(ext);
}

export default { setEvent, setEventGetters, }; // for compatibility only
const enumerable = true, configurable = true;
