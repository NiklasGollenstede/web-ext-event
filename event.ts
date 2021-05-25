/* eslint-disable */

export interface Listener<ArgsT extends any[]> {
	(...args: ArgsT): Promise<any>|any;
}

export interface ListenerOptions {
	/** If `true` the listener will be removed right before it is called the first time. */
	once?: boolean;
	/** A `Window` global object that "owns" this listener. The listener will be removed when the owners "unload" event fires. */
	owner?: Window;
}

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
	(listener: Listener<ArgsT>, options?: ListenerOptions): boolean|any;


	/** If called with a not-yet-added function on a living `Event`, adds that listener to the event and returns `true`, returns `false` otherwise. */
	addListener(listener: Listener<ArgsT>): void;
	/** Returns `true` if `fn` is added as listener, `false` otherwise. */
	hasListener(listener: Listener<ArgsT>): boolean;
	/** Returns `hasListener(fn)` and removes the listener `fn`. */
	removeListener(listener: Listener<ArgsT>): boolean;
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

export interface EventTriggerOptions<ArgsT extends any[]> {
	/** Whether to destroy the `Event` after firing. Defaults to `EventOptions.once`. */
	last?: boolean;
	/** Optional function(listener) that may filter the listeners to be called. */
	filter?: (listener: Listener<ArgsT>) => boolean;
}

/** Function to fire an `Event`. Errors thrown by the listeners are logged. */
export interface EventTrigger<ArgsT extends any[]> {
	/**
	 * @param  args        Iterable of arguments for the listeners. Skips firing if `null`.
	 * @return             The number of called listeners that did not throw (or reject).
	 */
	(args: ArgsT|null, options?: EventTriggerOptions<ArgsT>): Promise<number>;

	/** Getter that returns the current number of listeners. */
	size: number;
	/** Function that, if set, is called with every added listener ands its optional options. May return a truthy value to be returned from `Event`. */
	onadd?: (listener: Listener<ArgsT>, options?: ListenerOptions) => any;
	/** Function that, if set, is called with every removed listener. */
	onremove?: (listener: Listener<ArgsT>) => void;
}

/**
 * Defines an `Event` as a property on an object and returns a function to fire it.
 * @param  {{ [k: NameT]: Event}}     target      The object to define the `Event` on.
 * @param  {NameT}      name        Property name and function `.name` of the event.	 *
 */
export declare function setEvent<ArgsT extends any[], NameT extends string|symbol>(target: { [key in NameT]: Event<ArgsT>; }, name: NameT, options?: EventOptions<ArgsT>): EventTrigger<ArgsT>;
