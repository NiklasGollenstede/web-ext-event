/* eslint-disable */

/*!
 * Some examples / manual tests for the static typing.
 */

import { Event, EventTrigger, setEventGetters, } from './index';

{ /*! Declare events on an existing base class */

	interface PrivateI {
		prop: string;
		onEventString?: Event<[ string, ]>;
		fireEventString?: EventTrigger<[ string, ]>;
		onEventNumber?: Event<[ number, boolean, ]>;
		fireEventNumber?: EventTrigger<[ number, boolean, ]>;
	}

	const Self = new WeakMap<BaseClassI, PrivateI>();

	class BaseClassI {
		b: boolean;
		constructor(a: string[], b: boolean) {
			Self.set(this, { prop: a[0], });
			this.b = b;
			return Object.freeze(this);
		}
		r42() { return 42; }
		get prop() { return Self.get(this)!.prop; }
	}
	BaseClassI.prototype.b;
	BaseClassI.prototype.r42;

	const ClassI = setEventGetters(BaseClassI, [ 'eventString', 'eventNumber', ], Self);

	const inst = new ClassI([ 'prop', ], false);
	inst.onEventString(s => { void s; });
	inst.onEventNumber((n, b) => { void n; void b; });

}

{ /*! Create a base class with events and extend it (better resulting class type) */

	interface PrivateI {
		prop: string;
		onEventString?: Event<[ string, ]>;
		fireEventString?: EventTrigger<[ string, ]>;
		onEventNumber?: Event<[ number, boolean, ]>;
		fireEventNumber?: EventTrigger<[ number, boolean, ]>;
	}

	const Self = new WeakMap<Object, PrivateI>();

	const BaseI = setEventGetters([ 'eventString', 'eventNumber', ], Self);

	const base = new BaseI();
	base.onEventString(s => { void s; });
	base.onEventNumber((n, b) => { void n; void b; });

	class ClassI extends BaseI {
		b: boolean;
		constructor(a: string[], b: boolean) { super();
			Self.set(this, { prop: a[0], });
			this.b = b;
			return Object.freeze(this);
		}
		r42() { return 42; }
		get prop() { return Self.get(this)!.prop; }
	}
	ClassI.prototype.b;
	ClassI.prototype.r42;


	const inst = new ClassI([ 'prop', ], false);
	inst.onEventString(s => { void s; });
	inst.onEventNumber((n, b) => { void n; void b; });

}
