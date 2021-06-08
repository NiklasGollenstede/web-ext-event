/* eslint-disable */

/**
 * Interface `Event`:
 * "An [interface] which allows the addition and removal of listeners for an [...] event." -- MDN
 *
 * The methods on the `Event` function have almost the same interface as `browser.events.Event`.
 * In addition to the WebExtension `events.Event` interface, the `add` and `remove` functions
 * return a boolean whether any action was taken, and the `Event` is a function itself,
 * that adds a listener with additional options.
 */
export interface Event<ArgsT extends any[]> {

	/**
	 * @param  listener  Listener to add/test/remove. Adding an existing or removing a non-existing listener is a no-op.
	 * @param  options   Optional additional options on how to handle the listener
	 * @return          `false` if the listener is not a function or was already added, or if the event is dead.
	 *                  Otherwise a truthy value specific to the event type (see `EventTrigger.onadd`), or `true`.
	 */
	(listener: Listener<ArgsT>, options?: ListenerOptions|null|undefined): boolean|any;


	/** If called with a not-yet-added function on a living `Event`, adds that listener to the event and returns `true`, returns `false` otherwise. */
	addListener(listener: Listener<ArgsT>): void;
	/** Returns `true` if `fn` is added as listener, `false` otherwise. */
	hasListener(listener: Listener<ArgsT>): boolean;
	/** Returns `hasListener(fn)` and removes the listener `fn`. */
	removeListener(listener: Listener<ArgsT>): boolean;
}

export interface Listener<ArgsT extends any[]> {
	(...args: ArgsT): Promise<any>|any;
}

export interface ListenerOptions {
	/** If `true` the listener will be removed right before it is called the first time. */
	once?: boolean;
	/** A `Window` global object that "owns" this listener. The listener will be removed when the owners "unload" event fires. */
	owner?: Window | { onDisconnect: Event<[ ]>, } | null;
}

export interface EventOptions<ArgsT extends any[]> {
	/** Function or iterable of functions as initial listeners. */
	init?: Iterable<Listener<ArgsT>>|Listener<ArgsT>;
	/** Whether to fire the event asynchronously after the call to `fire`. Defaults to `false`. */
	async?: boolean;
	/** Whether to define the event as writable property. Defaults to `false`. */
	writable?: boolean;
	/** Whether the first call to `fire` is also the last. Defaults to `false`. */
	once?: boolean;
}

/** Function to fire an `Event`. Errors thrown by the listeners are logged. */
export interface EventTrigger<ArgsT extends any[]> {
	/**
	 * @param  args        Iterable of arguments for the listeners. Skips firing if `null`.
	 * @return             The number of called listeners that did not throw (or reject).
	 */
	(args: ArgsT|null, options?: EventTriggerOptions<ArgsT>|null|undefined): Promise<number>;

	/** Getter that returns the current number of listeners. */
	size: number;
	/** Function that, if set, is called with every added listener ands its optional options. May return a truthy value to be returned from `Event`. */
	onadd?: null | ((listener: Listener<ArgsT>, options?: ListenerOptions) => any);
	/** Function that, if set, is called with every removed listener. */
	onremove?: null | ((listener: Listener<ArgsT>) => void);
}

export interface EventTriggerOptions<ArgsT extends any[]> {
	/** Whether to destroy the `Event` after firing. Defaults to `EventOptions.once`. */
	last?: boolean;
	/** Optional function(listener) that may filter the listeners to be called. */
	filter?: (listener: Listener<ArgsT>) => boolean;
}

/**
 * Defines an `Event` as a property on an object and returns a function to fire it.
 * @param  {{ [k: NameT]: Event}}     target      The object to define the `Event` on.
 * @param  {NameT}      name        Property name and function `.name` of the event.	 *
 */
export declare function setEvent<ArgsT extends any[], NameT extends string|symbol>(target: { [key in NameT]: Event<ArgsT>; }, name: NameT, options?: EventOptions<ArgsT>): EventTrigger<ArgsT>;

/**
 * Given event names and an object (type) where the `EventTrigger`s are stored, infers the types of the corresponding events.
 */
export type WithEvents<
	KeyT extends string,
	PrivateT extends { [K in KeyT as `fire${Capitalize<string & K>}`]?: EventTrigger<any[]> },
> = {
	readonly [K in KeyT as `on${Capitalize<string & K>}`]: Event<Exclude<PrivateT[`fire${Capitalize<string & K>}`], undefined> extends EventTrigger<infer ArgsT> ? ArgsT : never>
};

/**
 * Extends an existing `class` with one that has `Event` getters set for `'on'+ names`.
 * For type inference and debugging, it generally works best if the last deriving class is a literal class, so prefer the other overload as a base class where possible.
 * The types (arguments) of the events are deduced from the return value of `Self.get`.
 * @param  Class    Base class to extend. Copies over all direct properties to the new constructor (`name`, `length`, ant `static` methods). If `null` is passed at runtime, calls the overload without this parameter.
 * @param  names    Names that will be capitalized and prefixed with `on`/`fire` to set the `Event` on the returned class and get (the type of) and set the `EventTrigger` on the internal object.
 * @param  Self     (`WeakMap`) getter object that for any instance of the returned class returns a private object where the `Event`(`Trigger`) gets stored on first access. The declared type ofthe `EventTrigger` on the returned objects is used to deduce the type of the `Event`s.
 * @param  options  Subset of `EventOptions` forwarded to `setEvent`.
 */
export declare function setEventGetters<
	CtorT extends new (...args: any[]) => any,
	KeyT extends string,
	PrivateT extends {
		[K in KeyT as `on${Capitalize<string & K>}`]?: Event<any>;
	} & {
		[K in KeyT as `fire${Capitalize<string & K>}`]?: EventTrigger<any>;
	},
>(
	Class: CtorT|null, names: KeyT[],
	Self: { get(key: InstanceType<CtorT>): PrivateT|undefined, },
	options?: Pick<EventOptions<any>, 'async'|'once'>,
): {
	new (...args: typeof Class extends null ? [ ] : ConstructorParameters<Exclude<typeof Class, null>>): InstanceType<CtorT> & WithEvents<KeyT, PrivateT>,
	prototype: InstanceType<CtorT> & WithEvents<KeyT, PrivateT>,
} & Omit<CtorT, 'prototype'>;

/**
 * Creates a new `class` (extending `Object`) which has `Event` getters set for `'on'+ names`.
 * The types (arguments) of the events are deduced from the return value of `Self.get`.
 * @param  names    Names that will be capitalized and prefixed with `on`/`fire` to set the `Event` on the returned class and get (the type of) and set the `EventTrigger` on the internal object.
 * @param  Self     (`WeakMap`) getter object that for any instance of the returned class returns a private object where the `Event`(`Trigger`) gets stored on first access. The declared type ofthe `EventTrigger` on the returned objects is used to deduce the type of the `Event`s.
 * @param  options  Subset of `EventOptions` forwarded to `setEvent`.
 */
export declare function setEventGetters<
	KeyT extends string,
	PrivateT extends {
		[K in KeyT as `on${Capitalize<string & K>}`]?: Event<any>;
	} & {
		[K in KeyT as `fire${Capitalize<string & K>}`]?: EventTrigger<any>;
	},
>(
	names: KeyT[],
	Self: { get(key: object): PrivateT|undefined, },
	options?: Pick<EventOptions<any>, 'async'|'once'>,
): {
	new (): WithEvents<KeyT, PrivateT>,
	prototype: WithEvents<KeyT, PrivateT>,
};
