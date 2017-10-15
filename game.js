(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],3:[function(require,module,exports){

/*
	Copyright © 2001 Robert Penner
	All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, 
	are permitted provided that the following conditions are met:

	Redistributions of source code must retain the above copyright notice, this list of 
	conditions and the following disclaimer.
	Redistributions in binary form must reproduce the above copyright notice, this list 
	of conditions and the following disclaimer in the documentation and/or other materials 
	provided with the distribution.

	Neither the name of the author nor the names of contributors may be used to endorse 
	or promote products derived from this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
	EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
	MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
	COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
	EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
	GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
	AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
	OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
  var penner, umd;

  umd = function(factory) {
    if (typeof exports === 'object') {
      return module.exports = factory;
    } else if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else {
      return this.penner = factory;
    }
  };

  penner = {
    linear: function(t, b, c, d) {
      return c * t / d + b;
    },
    easeInQuad: function(t, b, c, d) {
      return c * (t /= d) * t + b;
    },
    easeOutQuad: function(t, b, c, d) {
      return -c * (t /= d) * (t - 2) + b;
    },
    easeInOutQuad: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return c / 2 * t * t + b;
      } else {
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
      }
    },
    easeInCubic: function(t, b, c, d) {
      return c * (t /= d) * t * t + b;
    },
    easeOutCubic: function(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t + 1) + b;
    },
    easeInOutCubic: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return c / 2 * t * t * t + b;
      } else {
        return c / 2 * ((t -= 2) * t * t + 2) + b;
      }
    },
    easeInQuart: function(t, b, c, d) {
      return c * (t /= d) * t * t * t + b;
    },
    easeOutQuart: function(t, b, c, d) {
      return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },
    easeInOutQuart: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return c / 2 * t * t * t * t + b;
      } else {
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
      }
    },
    easeInQuint: function(t, b, c, d) {
      return c * (t /= d) * t * t * t * t + b;
    },
    easeOutQuint: function(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    },
    easeInOutQuint: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return c / 2 * t * t * t * t * t + b;
      } else {
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
      }
    },
    easeInSine: function(t, b, c, d) {
      return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOutSine: function(t, b, c, d) {
      return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOutSine: function(t, b, c, d) {
      return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },
    easeInExpo: function(t, b, c, d) {
      if (t === 0) {
        return b;
      } else {
        return c * Math.pow(2, 10 * (t / d - 1)) + b;
      }
    },
    easeOutExpo: function(t, b, c, d) {
      if (t === d) {
        return b + c;
      } else {
        return c * (-Math.pow(2, -10 * t / d) + 1) + b;
      }
    },
    easeInOutExpo: function(t, b, c, d) {
      if (t === 0) {
        b;
      }
      if (t === d) {
        b + c;
      }
      if ((t /= d / 2) < 1) {
        return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
      } else {
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
      }
    },
    easeInCirc: function(t, b, c, d) {
      return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    },
    easeOutCirc: function(t, b, c, d) {
      return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    },
    easeInOutCirc: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
      } else {
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
      }
    },
    easeInElastic: function(t, b, c, d) {
      var a, p, s;
      s = 1.70158;
      p = 0;
      a = c;
      if (t === 0) {
        b;
      } else if ((t /= d) === 1) {
        b + c;
      }
      if (!p) {
        p = d * .3;
      }
      if (a < Math.abs(c)) {
        a = c;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
      }
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    },
    easeOutElastic: function(t, b, c, d) {
      var a, p, s;
      s = 1.70158;
      p = 0;
      a = c;
      if (t === 0) {
        b;
      } else if ((t /= d) === 1) {
        b + c;
      }
      if (!p) {
        p = d * .3;
      }
      if (a < Math.abs(c)) {
        a = c;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
      }
      return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    },
    easeInOutElastic: function(t, b, c, d) {
      var a, p, s;
      s = 1.70158;
      p = 0;
      a = c;
      if (t === 0) {
        b;
      } else if ((t /= d / 2) === 2) {
        b + c;
      }
      if (!p) {
        p = d * (.3 * 1.5);
      }
      if (a < Math.abs(c)) {
        a = c;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
      }
      if (t < 1) {
        return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
      } else {
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
      }
    },
    easeInBack: function(t, b, c, d, s) {
      if (s === void 0) {
        s = 1.70158;
      }
      return c * (t /= d) * t * ((s + 1) * t - s) + b;
    },
    easeOutBack: function(t, b, c, d, s) {
      if (s === void 0) {
        s = 1.70158;
      }
      return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    },
    easeInOutBack: function(t, b, c, d, s) {
      if (s === void 0) {
        s = 1.70158;
      }
      if ((t /= d / 2) < 1) {
        return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
      } else {
        return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
      }
    },
    easeInBounce: function(t, b, c, d) {
      var v;
      v = penner.easeOutBounce(d - t, 0, c, d);
      return c - v + b;
    },
    easeOutBounce: function(t, b, c, d) {
      if ((t /= d) < 1 / 2.75) {
        return c * (7.5625 * t * t) + b;
      } else if (t < 2 / 2.75) {
        return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b;
      } else if (t < 2.5 / 2.75) {
        return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b;
      } else {
        return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b;
      }
    },
    easeInOutBounce: function(t, b, c, d) {
      var v;
      if (t < d / 2) {
        v = penner.easeInBounce(t * 2, 0, c, d);
        return v * .5 + b;
      } else {
        v = penner.easeOutBounce(t * 2 - d, 0, c, d);
        return v * .5 + c * .5 + b;
      }
    }
  };

  umd(penner);

}).call(this);

},{}],4:[function(require,module,exports){
const list = require('./src/list')

module.exports = {
    list,
    wait: require('./src/wait'),
    to: require('./src/to'),
    shake: require('./src/shake'),
    tint: require('./src/tint'),
    face: require('./src/face'),
    angle: require('./src/angle'),
    target: require('./src/target'),
    movie: require('./src/movie'),
    load: require('./src/load'),

    default: new list()
}
},{"./src/angle":5,"./src/face":6,"./src/list":7,"./src/load":8,"./src/movie":9,"./src/shake":10,"./src/target":11,"./src/tint":12,"./src/to":13,"./src/wait":14}],5:[function(require,module,exports){
const wait = require('./wait')

/** animate object's {x, y} using an angle */
module.exports = class angle extends wait
{
    /**
     * @param {object} object to animate
     * @param {number} angle in radians
     * @param {number} speed in pixels/millisecond
     * @param {number} [duration=0] in milliseconds; if 0, then continues forever
     * @param {object} [options] @see {@link Wait}
     */
    constructor(object, angle, speed, duration, options)
    {
        options = options || {}
        super(object, options)
        this.type = 'Angle'
        if (options.load)
        {
            this.load(options.load)
        }
        else
        {
            this.angle = angle
            this.speed = speed
            this.duration = duration || 0
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = super.save()
        save.angle = this.angle
        save.speed = this.speed
        return save
    }

    load(load)
    {
        super.load(load)
        this.angle = load.angle
        this.speed = load.speed
    }

    get angle()
    {
        return this._angle
    }
    set angle(value)
    {
        this._angle = value
        this.sin = Math.sin(this._angle)
        this.cos = Math.cos(this._angle)
    }

    calculate(elapsed)
    {
        this.object.x += this.cos * elapsed * this.speed
        this.object.y += this.sin * elapsed * this.speed
    }

    reverse()
    {
        this.angle += Math.PI
    }
}
},{"./wait":14}],6:[function(require,module,exports){
const Angle = require('yy-angle')
const wait = require('./wait')

/** Rotates an object to face the target */
module.exports = class face extends wait
{
    /**
     * @param {object} object
     * @param {Point} target
     * @param {number} speed in radians/millisecond
     * @param {object} [options] @see {@link Wait}
     * @param {boolean} [options.keepAlive] don't stop animation when complete
     */
    constructor(object, target, speed, options)
    {
        options = options || {}
        super(object, options)
        this.type = 'Face'
        this.target = target
        if (options.load)
        {
            this.load(options.load)
        }
        else
        {
            this.speed = speed
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = super.save()
        save.speed = this.speed
        save.keepAlive = this.options.keepAlive
        return save
    }

    load(load)
    {
        super.load(load)
        this.speed = load.speed
        this.options.keepAlive = load.keepAlive
    }

    calculate(elapsed)
    {
        var angle = Angle.angleTwoPoints(this.object.position, this.target)
        var difference = Angle.differenceAngles(angle, this.object.rotation)
        if (difference === 0)
        {
            this.emit('done', this.object)
            if (!this.options.keepAlive)
            {
                return true
            }
        }
        else
        {
            var sign = Angle.differenceAnglesSign(angle, this.object.rotation)
            var change = this.speed * elapsed
            var delta = (change > difference) ? difference : change
            this.object.rotation += delta * sign
        }
    }
}
},{"./wait":14,"yy-angle":34}],7:[function(require,module,exports){
const Events = require('eventemitter3')
const Angle = require('./angle')
const Face = require('./face')
const Load = require('./load')
const Movie = require('./movie')
const Shake = require('./shake')
const Target = require('./target')
const Tint = require('./tint')
const To = require('./to')
const Wait = require('./wait')

/** Helper list for multiple animations */
module.exports = class List extends Events
{
    /**
     * @param {object|object[]...} any animation class
     * @event List#done(List) final animation completed in the list
     * @event List#each(elapsed, List) each update
     */
    constructor()
    {
        super()
        this.list = []
        this.empty = true
        if (arguments.length)
        {
            this.add(...arguments)
        }
    }

    /**
     * Add animation(s) to animation list
     * @param {object|object[]...} any animation class
     */
    add()
    {
        for (let arg of arguments)
        {
            if (Array.isArray(arg))
            {
                for (let entry of arg)
                {
                    this.list.push(entry)
                }
            }
            else
            {
                this.list.push(arg)
            }
        }
        this.empty = false
        return arguments[0]
    }

    /**
     * get animation by index
     * @param {number} index
     * @return {object} animation class
     */
    get(index)
    {
        return this.list[index]
    }

    /**
     * remove animation(s)
     * @param {object|array} animate - the animation (or array of animations) to remove; can be null
     */
    remove(animate)
    {
        if (animate)
        {
            if (Array.isArray(animate))
            {
                while (animate.length)
                {
                    const pop = animate.pop()
                    if (pop && pop.options)
                    {
                        pop.options.cancel = true
                    }
                }
            }
            else
            {
                if (animate && animate.options)
                {
                    animate.options.cancel = true
                }
            }
        }
        return animate
    }

    /**
     * remove all animations from list
     */
    removeAll()
    {
        this.list = []
        this.empty = true
    }

    /**
     * @param {number} elapsed time since last tick
     * @returns {number} of active animations
     */
    update(elapsed)
    {
        for (let i = this.list.length - 1; i >= 0; i--)
        {
            const animate = this.list[i]
            if (animate.update(elapsed))
            {
                this.emit('remove', animate)
                this.list.splice(i, 1)
            }
        }
        this.emit('each', elapsed, this)
        if (this.list.length === 0 && !this.empty)
        {
            this.emit('done', this)
            this.empty = true
        }
    }

    /**
     * @return {number} number of active animations
     */
    count()
    {
        let count = 0
        for (let animate of this.list)
        {
            if (!animate.options.pause)
            {
                count++
            }
        }
        return count
    }

    /**
     * handler for requestAnimationFrame
     * @private
     */
    loop()
    {
        if (this.running)
        {
            const now = performance.now()
            const elapsed = now - this.now > this.max ? this.max : now - this.now
            this.update(elapsed)
            this.now = now
            requestAnimationFrame(this.loop.bind(this))
        }
    }

    /**
     * starts an automatic requestAnimationFrame() loop
     * alternatively, you can call update() manually
     * @param {number} [max=1000 / 60] maximum FPS--i.e., in update(elapsed) if elapsed > max, then use max instead of elapsed
     */
    start(max)
    {
        this.max = max || 1000 / 60
        this.running = true
        this.now = performance.now()
        requestAnimationFrame(this.loop.bind(this))
    }

    /**
     * stops the automatic requestAnimationFrame() loop
     */
    stop()
    {
        this.running = false
    }

    /** helper to add to the list a new Ease.to class; see Ease.to class below for parameters */
    to() { return this.add(new To(...arguments)) }

    /** helper to add to the list a new Ease.angle class; see Ease.to class below for parameters */
    angle() { return this.add(new Angle(...arguments)) }

    /** helper to add to the list a new Ease.face class; see Ease.to class below for parameters */
    face() { return this.add(new Face(...arguments)) }

    /** helper to add to the list a new Ease.load class; see Ease.to class below for parameters */
    load() { return this.add(new Load(...arguments)) }

    /** helper to add to the list a new Ease.movie class; see Ease.to class below for parameters */
    movie() { return this.add(new Movie(...arguments)) }

    /** helper to add to the list a new Ease.shake class; see Ease.to class below for parameters */
    shake() { return this.add(new Shake(...arguments)) }

    /** helper to add to the list a new Ease.target class; see Ease.to class below for parameters */
    target() { return this.add(new Target(...arguments)) }

    /** helper to add to the list a new Ease.angle tint; see Ease.to class below for parameters */
    tint() { return this.add(new Tint(...arguments)) }

    /** helper to add to the list a new Ease.wait class; see Ease.to class below for parameters */
    wait() { return this.add(new Wait(...arguments)) }
}

/* global requestAnimationFrame, performance */
},{"./angle":5,"./face":6,"./load":8,"./movie":9,"./shake":10,"./target":11,"./tint":12,"./to":13,"./wait":14,"eventemitter3":2}],8:[function(require,module,exports){
const wait = require('./wait')
const to = require('./to')
const tint = require('./tint')
const shake = require('./shake')
const angle = require('./angle')
const face = require('./face')
const target = require('./target')
const movie = require('./movie')

/**
 * restart an animation = requires a saved state
 * @param {object} object(s) to animate
 */
module.exports = function load(object, load)
{
    if (!load)
    {
        return null
    }
    const options = { load }
    switch (load.type)
    {
        case 'Wait':
            return new wait(object, options)
        case 'To':
            return new to(object, null, null, options)
        case 'Tint':
            return new tint(object, null, null, options)
        case 'Shake':
            return new shake(object, null, null, options)
        case 'Angle':
            return new angle(object, null, null, null, options)
        case 'Face':
            return new face(object[0], object[1], null, options)
        case 'Target':
            return new target(object[0], object[1], null, options)
        case 'Movie':
            return new movie(object, object[1], null, options)
    }
}
},{"./angle":5,"./face":6,"./movie":9,"./shake":10,"./target":11,"./tint":12,"./to":13,"./wait":14}],9:[function(require,module,exports){
const wait = require('./wait')

/**
 * animate a movie of textures
 */
module.exports = class movie extends wait
{
    /**
     * @param {object} object to animate
     * @param {PIXI.Texture[]} textures
     * @param {number} [duration=0] time to run (use 0 for infinite duration--should only be used with customized easing functions)
     * @param {object} [options]
     * @param {number} [options.wait=0] n milliseconds before starting animation (can also be used to pause animation for a length of time)
     * @param {boolean} [options.pause] start the animation paused
     * @param {(boolean|number)} [options.repeat] true: repeat animation forever n: repeat animation n times
     * @param {(boolean|number)} [options.reverse] true: reverse animation (if combined with repeat, then pulse) n: reverse animation n times
     * @param {(boolean|number)} [options.continue] true: continue animation with new starting values n: continue animation n times
     * @param {Function} [options.load] loads an animation using a .save() object note the * parameters below cannot be loaded and must be re-set
     * @param {Function} [options.ease] function from easing.js (see http://easings.net for examples)
     * @emits {done} animation expires
     * @emits {cancel} animation is cancelled
     * @emits {wait} each update during a wait
     * @emits {first} first update when animation starts
     * @emits {each} each update while animation is running
     * @emits {loop} when animation is repeated
     * @emits {reverse} when animation is reversed
     */
    constructor(object, textures, duration, options)
    {
        options = options || {}
        super(object, options)
        this.type = 'Movie'
        if (Array.isArray(object))
        {
            this.list = object
            this.object = this.list[0]
        }
        this.ease = options.ease || this.noEase
        if (options.load)
        {
            this.load(options.load)
        }
        else
        {
            this.textures = textures
            this.duration = duration
            this.current = 0
            this.length = textures.length
            this.interval = duration / this.length
            this.isReverse = false
            this.restart()
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = super.save()
        save.goto = this.goto
        save.current = this.current
        save.length = this.length
        save.interval = this.interval
        return save
    }

    load(load)
    {
        super.load(load)
        this.goto = load.goto
        this.current = load.current
        this.interval = load.current
    }

    restart()
    {
        this.current = 0
        this.time = 0
        this.isReverse = false
    }

    reverse()
    {
        this.isReverse = !this.isReverse
    }

    calculate()
    {
        let index = Math.round(this.ease(this.time, 0, this.length - 1, this.duration))
        if (this.isReverse)
        {
            index = this.length - 1 - index
        }
        if (this.list)
        {
            for (let i = 0; i < this.list.length; i++)
            {
                this.list[i].texture = this.textures[index]
            }
        }
        else
        {
            this.object.texture = this.textures[index]
        }
    }
}
},{"./wait":14}],10:[function(require,module,exports){
const wait = require('./wait')

/**
 * shakes an object or list of objects
 */
module.exports = class shake extends wait
{
    /**
     * @param {object|array} object or list of objects to shake
     * @param {number} amount to shake
     * @param {number} duration (in milliseconds) to shake
     * @param {object} options (see Animate.wait)
     */
    constructor(object, amount, duration, options)
    {
        options = options || {}
        super(object, options)
        this.type = 'Shake'
        if (Array.isArray(object))
        {
            this.array = true
            this.list = object
        }
        if (options.load)
        {
            this.load(options.load)
        }
        else
        {
            if (this.list)
            {
                this.start = []
                for (let i = 0; i < object.length; i++)
                {
                    const target = object[i]
                    this.start[i] = {x: target.x, y: target.y}
                }
            }
            else
            {
                this.start = {x: object.x, y: object.y}
            }
            this.amount = amount
            this.duration = duration
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = super.save()
        save.start = this.start
        save.amount = this.amount
        return save
    }

    load(load)
    {
        super.load(load)
        this.start = load.start
        this.amount = load.amount
    }

    calculate(/*elapsed*/)
    {
        const object = this.object
        const start = this.start
        const amount = this.amount
        if (this.array)
        {
            const list = this.list
            for (let i = 0; i < list.length; i++)
            {
                const object = list[i]
                const actual = start[i]
                object.x = actual.x + Math.floor(Math.random() * amount * 2) - amount
                object.y = actual.y + Math.floor(Math.random() * amount * 2) - amount
            }
        }
        object.x = start.x + Math.floor(Math.random() * amount * 2) - amount
        object.y = start.y + Math.floor(Math.random() * amount * 2) - amount
    }

    done()
    {
        const object = this.object
        const start = this.start
        if (this.array)
        {
            const list = this.list
            for (let i = 0; i < list.length; i++)
            {
                const object = list[i]
                const actual = start[i]
                object.x = actual.x
                object.y = actual.y
            }
        }
        else
        {
            object.x = start.x
            object.y = start.y
        }
    }
}
},{"./wait":14}],11:[function(require,module,exports){
const wait = require('./wait')

/** move an object to a target's location */
module.exports = class target extends wait
{
    /**
     * move to a target
     * @param {object} object - object to animate
     * @param {object} target - object needs to contain {x: x, y: y}
     * @param {number} speed - number of pixels to move per millisecond
     * @param {object} [options] @see {@link Wait}
     * @param {boolean} [options.keepAlive] don't cancel the animation when target is reached
     */
    constructor(object, target, speed, options)
    {
        options = options || {}
        super(object, options)
        this.type = 'Target'
        this.target = target
        if (options.load)
        {
            this.load(options.load)
        }
        else
        {
            this.speed = speed
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = super.save()
        save.speed = this.speed
        save.keepAlive = this.options.keepAlive
        return save
    }

    load(load)
    {
        super.load(load)
        this.speed = load.speed
        this.options.keepAlive = load.keepAlive
    }

    calculate(elapsed)
    {
        const deltaX = this.target.x - this.object.x
        const deltaY = this.target.y - this.object.y
        if (deltaX === 0 && deltaY === 0)
        {
            this.emit('done', this.object)
            if (!this.options.keepAlive)
            {
                return true
            }
        }
        else
        {
            const angle = Math.atan2(deltaY, deltaX)
            this.object.x += Math.cos(angle) * elapsed * this.speed
            this.object.y += Math.sin(angle) * elapsed * this.speed
            if ((deltaX >= 0) !== ((this.target.x - this.object.x) >= 0))
            {
                this.object.x = this.target.x
            }
            if ((deltaY >= 0) !== ((this.target.y - this.object.y) >= 0))
            {
                this.object.y = this.target.y
            }
        }
    }
}
},{"./wait":14}],12:[function(require,module,exports){
const Color = require('yy-color')
const wait = require('./wait')

/** changes the tint of an object */
module.exports = class tint extends wait
{
    /**
     * @param {PIXI.DisplayObject|PIXI.DisplayObject[]} object
     * @param {number|number[]} tint
     * @param {number} [duration] in milliseconds
     * @param {object} [options] @see {@link Wait}
     */
    constructor(object, tint, duration, options)
    {
        options = options || {}
        super(object, options)
        this.type = 'Tint'
        if (Array.isArray(object))
        {
            this.list = object
            this.object = this.list[0]
        }
        this.duration = duration
        this.ease = this.options.ease || this.noEase
        if (options.load)
        {
            this.load(options.load)
        }
        else if (Array.isArray(tint))
        {
            this.tints = [this.object.tint, ...tint]
        }
        else
        {
            this.start = this.object.tint
            this.to = tint
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = super.save()
        save.start = this.start
        save.to = this.to
        return save
    }

    load(load)
    {
        super.load(load)
        this.start = load.start
        this.to = load.to
    }

    calculate()
    {
        const percent = this.ease(this.time, 0, 1, this.duration)
        if (this.tints)
        {
            const each = 1 / (this.tints.length - 1)
            let per = each
            for (let i = 1; i < this.tints.length; i++)
            {
                if (percent <= per)
                {
                    const color = Color.blend(1 - (per - percent) / each, this.tints[i - 1], this.tints[i])
                    if (this.list)
                    {
                        for (let object of this.list)
                        {
                            object.tint = color
                        }
                    }
                    else
                    {
                        this.object.tint = color
                    }
                    break;
                }
                per += each
            }
        }
        else
        {
            const color = Color.blend(percent, this.start, this.to)
            if (this.list)
            {
                for (let object of this.list)
                {
                    object.tint = color
                }
            }
            else
            {
                this.object.tint = color
            }
        }
    }

    reverse()
    {
        if (this.tints)
        {
            const tints = []
            for (let i = this.tints.length - 1; i >= 0; i--)
            {
                tints.push(this.tints[i])
            }
            this.tints = tints
        }
        else
        {
            const swap = this.to
            this.to = this.start
            this.start = swap
        }
    }
}
},{"./wait":14,"yy-color":35}],13:[function(require,module,exports){
const wait = require('./wait')

/** animate any numeric parameter of an object or array of objects */
module.exports = class to extends wait
{
    /**
     * @param {object} object to animate
     * @param {object} goto - parameters to animate, e.g.: {alpha: 5, scale: {3, 5}, scale: 5, rotation: Math.PI}
     * @param {number} duration - time to run
     * @param {object} [options]
     * @param {number} [options.wait=0] n milliseconds before starting animation (can also be used to pause animation for a length of time)
     * @param {boolean} [options.pause] start the animation paused
     * @param {boolean|number} [options.repeat] true: repeat animation forever n: repeat animation n times
     * @param {boolean|number} [options.reverse] true: reverse animation (if combined with repeat, then pulse) n: reverse animation n times
     * @param {boolean|number} [options.continue] true: continue animation with new starting values n: continue animation n times
     * @param {Function} [options.load] loads an animation using an .save() object note the * parameters below cannot be loaded and must be re-set
     * @param {string|Function} [options.ease] name or function from easing.js (see http://easings.net for examples)
     * @emits to:done animation expires
     * @emits to:cancel animation is cancelled
     * @emits to:wait each update during a wait
     * @emits to:first first update when animation starts
     * @emits to:each each update while animation is running
     * @emits to:loop when animation is repeated
     * @emits to:reverse when animation is reversed
     */
    constructor(object, goto, duration, options)
    {
        options = options || {}
        super(object, options)
        this.type = 'To'
        if (Array.isArray(object))
        {
            this.list = object
            this.object = this.list[0]
        }
        this.ease = options.ease || this.noEase
        if (options.load)
        {
            this.load(options.load)
        }
        else
        {
            this.goto = goto
            this.fixScale()
            this.duration = duration
            this.restart()
        }
    }

    /**
     * converts scale from { scale: n } to { scale: { x: n, y: n }}
     * @private
     */
    fixScale()
    {
        if (typeof this.goto['scale'] !== 'undefined' && !Number.isNaN(this.goto['scale']))
        {
            this.goto['scale'] = {x: this.goto['scale'], y: this.goto['scale']}
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = super.save()
        save.goto = this.goto
        save.start = this.start
        save.delta = this.delta
        save.keys = this.keys
        return save
    }

    load(load)
    {
        super.load(load)
        this.goto = load.goto
        this.start = load.start
        this.delta = load.delta
        this.keys = load.keys
    }

    restart()
    {
        let i = 0
        const start = this.start = []
        const delta = this.delta = []
        const keys = this.keys = []
        const goto = this.goto
        const object = this.object

        // loops through all keys in goto object
        for (let key in goto)
        {

            // handles keys with one additional level e.g.: goto = {scale: {x: 5, y: 3}}
            if (isNaN(goto[key]))
            {
                keys[i] = {key: key, children: []}
                start[i] = []
                delta[i] = []
                let j = 0
                for (let key2 in goto[key])
                {
                    keys[i].children[j] = key2
                    start[i][j] = parseFloat(object[key][key2])
                    start[i][j] = this._correctDOM(key2, start[i][j])
                    start[i][j] = isNaN(this.start[i][j]) ? 0 : start[i][j]
                    delta[i][j] = goto[key][key2] - start[i][j]
                    j++
                }
            }
            else
            {
                start[i] = parseFloat(object[key])
                start[i] = this._correctDOM(key, start[i])
                start[i] = isNaN(this.start[i]) ? 0 : start[i]
                delta[i] = goto[key] - start[i]
                keys[i] = key
            }
            i++
        }
        this.time = 0
    }

    reverse()
    {
        const object = this.object
        const keys = this.keys
        const goto = this.goto
        const delta = this.delta
        const start = this.start

        for (let i = 0; i < keys.length; i++)
        {
            const key = keys[i]
            if (isNaN(goto[key]))
            {
                for (let j = 0; j < key.children.length; j++)
                {
                    delta[i][j] = -delta[i][j]
                    start[i][j] = parseFloat(object[key.key][key.children[j]])
                    start[i][j] = isNaN(start[i][j]) ? 0 : start[i][j]
                }
            }
            else
            {
                delta[i] = -delta[i]
                start[i] = parseFloat(object[key])
                start[i] = isNaN(start[i]) ? 0 : start[i]
            }
        }
    }

    continue()
    {
        const object = this.object
        const keys = this.keys
        const goto = this.goto
        const start = this.start

        for (let i = 0; i < keys.length; i++)
        {
            const key = keys[i]
            if (isNaN(goto[key]))
            {
                for (let j = 0; j < key.children.length; j++)
                {
                    this.start[i][j] = parseFloat(object[key.key][key.children[j]])
                    this.start[i][j] = isNaN(start[i][j]) ? 0 : start[i][j]
                }
            }
            else
            {
                start[i] = parseFloat(object[key])
                start[i] = isNaN(start[i]) ? 0 : start[i]
            }
        }
    }

    calculate(/*elapsed*/)
    {
        const object = this.object
        const list = this.list
        const keys = this.keys
        const goto = this.goto
        const time = this.time
        const start = this.start
        const delta = this.delta
        const duration = this.duration
        const ease = this.ease
        for (let i = 0; i < this.keys.length; i++)
        {
            const key = keys[i]
            if (isNaN(goto[key]))
            {
                const key1 = key.key
                for (let j = 0; j < key.children.length; j++)
                {
                    const key2 = key.children[j]
                    const others = object[key1][key2] = (time >= duration) ? start[i][j] + delta[i][j] : ease(time, start[i][j], delta[i][j], duration)
                    if (list)
                    {
                        for (let k = 1; k < list.length; k++)
                        {
                            list[k][key1][key2] = others
                        }
                    }
                }
            }
            else
            {
                const key = keys[i]
                const others = object[key] = (time >= duration) ? start[i] + delta[i] : ease(time, start[i], delta[i], duration)
                if (list)
                {
                    for (let j = 1; j < this.list.length; j++)
                    {
                        list[j][key] = others
                    }
                }
            }
        }
    }
}
},{"./wait":14}],14:[function(require,module,exports){
const Easing = require('penner')
const EventEmitter = require('eventemitter3')

module.exports = class wait extends EventEmitter
{
    /**
     * @param {object|object[]} object or list of objects to animate
     * @param {object} [options]
     * @param {number} [options.wait=0] n milliseconds before starting animation (can also be used to pause animation for a length of time)
     * @param {boolean} [options.pause] start the animation paused
     * @param {(boolean|number)} [options.repeat] true: repeat animation forever n: repeat animation n times
     * @param {(boolean|number)} [options.reverse] true: reverse animation (if combined with repeat, then pulse) n: reverse animation n times
     * @param {(boolean|number)} [options.continue] true: continue animation with new starting values n: continue animation n times
     * @param {number} [options.id] user-generated id (e.g., I use it to properly load animations when an object has multiple animations running)
     * @param {boolean} [options.orphan] delete animation if .parent of object (or first object in list) is null
     * @param {Function} [options.load] loads an animation using an .save() object note the * parameters below cannot be loaded and must be re-set
     * @param {Function|string} [options.ease] function (or penner function name) from easing.js (see http://easings.net for examples)*
     * @emits {done} animation expires
     * @emits {cancel} animation is cancelled
     * @emits {wait} each update during a wait
     * @emits {first} first update when animation starts
     * @emits {each} each update while animation is running
     * @emits {loop} when animation is repeated
     * @emits {reverse} when animation is reversed
     */
    constructor(object, options)
    {
        super()
        this.object = object
        this.options = options || {}
        this.type = 'Wait'
        if (this.options.load)
        {
            this.load(this.options.load)
        }
        else
        {
            this.time = 0
        }
        if (this.options.ease && typeof this.options.ease !== 'function')
        {
            this.options.ease = Easing[this.options.ease]
        }
        if (!this.options.ease)
        {
            this.options.ease = Easing['linear']
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = {type: this.type, time: this.time, duration: this.duration}
        const options = this.options
        if (options.wait)
        {
            save.wait = options.wait
        }
        if (typeof options.id !== 'undefined')
        {
            save.id = options.id
        }
        if (options.pause)
        {
            save.pause = options.pause
        }
        if (options.repeat)
        {
            save.repeat = options.repeat
        }
        if (options.reverse)
        {
            save.reverse = options.reverse
        }
        if (options.continue)
        {
            save.continue = options.continue
        }
        if (options.cancel)
        {
            save.cancel = options.cancel
        }
        return save
    }

    load(load)
    {
        this.options.wait = load.wait
        this.options.pause = load.pause
        this.options.repeat = load.repeat
        this.options.reverse = load.reverse
        this.options.continue = load.continue
        this.options.cancel = load.cancel
        this.options.id = load.id
        this.time = load.time
        this.duration = load.duration
    }

    pause()
    {
        this.options.pause = true
    }

    resume()
    {
        this.options.pause = false
    }

    cancel()
    {
        this.options.cancel = true
    }

    done()
    {
    }

    end(leftOver)
    {
        if (this.options.reverse)
        {
            this.reverse()
            this.time = leftOver
            if (!this.options.repeat)
            {
                if (this.options.reverse === true)
                {
                    this.options.reverse = false
                }
                else
                {
                    this.options.reverse--
                }
            }
            else
            {
                if (this.options.repeat !== true)
                {
                    this.options.repeat--
                }
            }
            this.emit('loop', this.list || this.object)
        }
        else if (this.options.repeat)
        {
            this.time = leftOver
            if (this.options.repeat !== true)
            {
                this.options.repeat--
            }
            this.emit('loop', this.list || this.object)
        }
        else if (this.options.continue)
        {
            this.continue()
            this.time = leftOver
            if (this.options.continue !== true)
            {
                this.options.continue--
            }
            this.emit('loop', this.list || this.object)
        }
        else
        {
            this.done()
            this.emit('done', this.list || this.object, leftOver)
            this.list = this.object = null
            return true
        }
    }

    update(elapsed)
    {
        if (!this.options)
        {
            return
        }
        if (this.options.cancel)
        {
            this.emit('cancel', this.list || this.object)
            return true
        }
        if (this.options.orphan)
        {
            if (this.list)
            {
                if (!this.list[0].parent)
                {
                    return true
                }
            }
            else if (!this.object.parent)
            {
                return true
            }
        }
        if (this.options.restart)
        {
            this.restart()
            this.options.pause = false
        }
        if (this.options.original)
        {
            this.time = 0
            this.options.pause = false
        }
        if (this.options.pause)
        {
            return
        }
        if (this.options.wait)
        {
            this.options.wait -= elapsed
            if (this.options.wait <= 0)
            {
                elapsed = -this.options.wait
                this.options.wait = false
            }
            else
            {
                this.emit('wait', elapsed, this.list || this.object)
                return
            }
        }
        if (!this.first)
        {
            this.first = true
            this.emit('first', this.list || this.object)
        }
        this.time += elapsed
        let leftOver = 0
        if (this.duration !== 0 && this.time > this.duration)
        {
            leftOver = this.time - this.duration
            this.time = this.duration
        }
        const allDone = this.calculate(elapsed)
        this.emit('each', elapsed, this.list || this.object, this)
        if (this.type === 'Wait' || (this.duration !== 0 && this.time === this.duration))
        {
            return this.end(leftOver)
        }
        if (allDone)
        {
            return true
        }
    }

    // correct certain DOM values
    _correctDOM(key, value)
    {
        switch (key)
        {
            case 'opacity':
                return (isNaN(value)) ? 1 : value
        }
        return value
    }

    calculate() {}
}
},{"eventemitter3":2,"penner":3}],15:[function(require,module,exports){
module.exports = require('./src/viewport')
},{"./src/viewport":25}],16:[function(require,module,exports){
const Ease = require('pixi-ease')

const Plugin = require('./plugin')

module.exports = class Bounce extends Plugin
{
    /**
     * bounce on borders
     * NOTE: screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
     * @param {Viewport} parent
     * @param {object} [options]
     * @param {number} [options.friction=0.5] friction to apply to decelerate if active
     * @param {number} [options.time=150] time in ms to finish bounce
     * @param {string|function} [ease='easeInOutSine'] ease function or name (see http://easings.net/ for supported names)
     */
    constructor(parent, options)
    {
        super(parent)
        options = options || {}
        this.time = options.time || 150
        this.ease = options.ease || 'easeInOutSine'
    }

    down()
    {
        this.toX = this.toY = null
    }

    up()
    {
        this.bounce()
    }

    update(elapsed)
    {
        this.bounce()
        if (this.toX)
        {
            if (this.toX.update(elapsed))
            {
                this.toX = null
            }
        }
        if (this.toY)
        {
            if (this.toY.update(elapsed))
            {
                this.toY = null
            }
        }
    }

    bounce()
    {
        let oob
        let decelerate = this.parent.plugin('decelerate')
        if (decelerate && (decelerate.x || decelerate.y))
        {
            if ((decelerate.x && decelerate.percentChangeX === decelerate.friction) || (decelerate.y && decelerate.percentChangeY === decelerate.friction))
            {
                oob = this.parent.OOB()
                if (oob.left || oob.right)
                {
                    decelerate.percentChangeX = this.friction
                }
                if (oob.top || oob.bottom)
                {
                    decelerate.percentChangeY = this.friction
                }
            }
        }
        const pointers = this.parent.input.pointers
        decelerate = decelerate || {}
        if (pointers.length === 0 && ((!this.toX || !this.toY) && (!decelerate.x || !decelerate.y)))
        {
            oob = oob || this.parent.OOB()
            const point = oob.cornerPoint
            if (!this.toX && !decelerate.x)
            {
                if (oob.left)
                {
                    this.toX = new Ease.to(this.parent.container, { x: 0 }, this.time, { ease: this.ease })
                }
                else if (oob.right)
                {
                    this.toX = new Ease.to(this.parent.container, { x: -point.x }, this.time, { ease: this.ease })
                }
            }
            if (!this.toY && !decelerate.y)
            {
                if (oob.top)
                {
                    this.toY = new Ease.to(this.parent.container, { y: 0 }, this.time, { ease: this.ease })
                }
                else if (oob.bottom)
                {
                    this.toY = new Ease.to(this.parent.container, { y: -point.y }, this.time, { ease: this.ease })
                }
            }
        }
    }

    reset()
    {
        this.toX = this.toY = null
    }
}
},{"./plugin":23,"pixi-ease":4}],17:[function(require,module,exports){
const Plugin = require('./plugin')

module.exports = class clamp extends Plugin
{
    /**
     * @param {string} [direction=all] (all, x, or y)
     */
    constructor(parent, direction)
    {
        super(parent)
        switch (direction)
        {
            case 'x':
                this.x = true
                break
            case 'y':
                this.y = true
                break
            default:
                this.x = this.y = true
                break
        }
        this.move()
    }

    move()
    {
        this.update()
    }

    update()
    {
        const oob = this.parent.OOB()
        const point = oob.cornerPoint
        const decelerate = this.parent.plugin('decelerate') || {}
        if (this.x)
        {
            if (oob.left)
            {
                this.parent.container.x = 0
                decelerate.x = 0
            }
            else if (oob.right)
            {
                this.parent.container.x = -point.x
                decelerate.x = 0
            }
        }
        if (this.y)
        {
            if (oob.top)
            {
                this.parent.container.y = 0
                decelerate.y = 0
            }
            else if (oob.bottom)
            {
                this.parent.container.y = -point.y
                decelerate.y = 0
            }
        }
    }
}
},{"./plugin":23}],18:[function(require,module,exports){
const Plugin = require('./plugin')

module.exports = class Decelerate extends Plugin
{
    /**
     * @param {Viewport} parent
     * @param {object} [options]
     * @param {number} [options.friction=0.95] percent to decelerate after movement
     * @param {number} [options.minSpeed=0.01] minimum velocity before stopping/reversing acceleration
     */
    constructor(parent, options)
    {
        super(parent)
        options = options || {}
        this.friction = options.friction || 0.95
        this.snap = options.snap || 0.8
        this.bounce = options.bounce || 0.5
        this.minSpeed = typeof options.minSpeed !== 'undefined' ? options.minSpeed : 0.01
        this.saved = []
    }

    down()
    {
        this.saved = []
        this.x = this.y = false
    }

    move(x, y, data)
    {
        const pointers = data.input.pointers
        if (pointers.length === 1 || (pointers.length > 1 && !this.parent.plugin('pinch')))
        {
            this.saved.push({ x: this.parent.container.x, y: this.parent.container.y, time: performance.now() })
            if (this.saved.length > 60)
            {
                this.saved.splice(0, 30)
            }
        }
    }

    up(x, y, data)
    {
        const pointers = data.input.pointers
        if (pointers.length === 0 && this.saved.length)
        {
            const now = performance.now()
            for (let save of this.saved)
            {
                if (save.time >= now - 100)
                {
                    const time = now - save.time
                    this.x = (this.parent.container.x - save.x) / time
                    this.y = (this.parent.container.y - save.y) / time
                    this.percentChangeX = this.percentChangeY = this.friction
                    break
                }
            }
        }
    }

    update(elapsed)
    {
        if (this.x)
        {
            this.parent.container.x += this.x * elapsed
            this.x *= this.percentChangeX
            if (Math.abs(this.x) < this.minSpeed)
            {
                this.x = 0
            }
        }
        if (this.y)
        {
            this.parent.container.y += this.y * elapsed
            this.y *= this.percentChangeY
            if (Math.abs(this.y) < this.minSpeed)
            {
                this.y = 0
            }
        }
    }

    reset()
    {
        this.x = this.y = null
    }
}
},{"./plugin":23}],19:[function(require,module,exports){
const Plugin = require('./plugin')

module.exports = class Drag extends Plugin
{
    constructor(parent)
    {
        super(parent)
    }

    down(x, y, data)
    {
        const pointers = data.input.pointers
        if (pointers.length === 1)
        {
            this.last = { x, y }
        }
    }

    move(x, y, data)
    {
        if (!this.last)
        {
            this.last = { x, y }
        }
        else
        {
            const pointers = data.input.pointers
            if (pointers.length === 1 || (pointers.length > 1 && !this.parent.plugin('pinch')))
            {
                const distX = x - this.last.x
                const distY = y - this.last.y
                if (this.parent.checkThreshold(distX) || this.parent.checkThreshold(distY))
                {
                    this.parent.container.x += distX
                    this.parent.container.y += distY
                    this.last = { x, y }
                    this.inMove = true
                }
            }
        }
    }

    up()
    {
        this.last = null
    }
}
},{"./plugin":23}],20:[function(require,module,exports){
const Plugin = require('./plugin')

module.exports = class Follow extends Plugin
{
    /**
     * @param {Viewport} parent
     * @param {PIXI.DisplayObject} target to follow (object must include {x: x-coordinate, y: y-coordinate})
     * @param {object} [options]
     * @param {number} [options.speed=0] to follow in pixels/frame
     * @param {number} [options.radius] radius (in world coordinates) of center circle where movement is allowed without moving the viewport
     */
    constructor(parent, target, options)
    {
        super(parent)
        options = options || {}
        this.speed = options.speed || 0
        this.target = target
        this.radius = options.radius
    }

    update()
    {
        if (this.radius)
        {
            const center = this.parent.center
            const distance = Math.sqrt(Math.pow(this.target.y - center.y, 2) + Math.pow(this.target.x - center.x, 2))
            if (distance > this.radius)
            {
                const angle = Math.atan2(this.target.y - center.y, this.target.x - center.x)
                this.parent.moveCenter(this.target.x - Math.cos(angle) * this.radius, this.target.y - Math.sin(angle) * this.radius)
            }
        }
        else if (this.speed)
        {
            const center = this.parent.center
            const deltaX = this.target.x - center.x
            const deltaY = this.target.y - center.y
            if (deltaX || deltaY)
            {
                const angle = Math.atan2(this.target.y - center.y, this.target.x - center.x)
                const changeX = Math.cos(angle) * this.speed
                const changeY = Math.sin(angle) * this.speed
                const x = Math.abs(changeX) > Math.abs(deltaX) ? this.target.x : center.x + changeX
                const y = Math.abs(changeY) > Math.abs(deltaY) ? this.target.y : center.y + changeY
                this.parent.moveCenter(x, y)
            }
        }
        else
        {
            this.parent.moveCenter(this.target.x, this.target.y)
        }
    }
}
},{"./plugin":23}],21:[function(require,module,exports){
const Plugin = require('./plugin')

module.exports = class HitArea extends Plugin
{
    constructor(parent, rect)
    {
        super(parent)
        this.rect = rect
        this.resize()
    }

    resize()
    {
        this.parent.container.hitArea = this.rect || this.parent.container.getBounds()
    }
}
},{"./plugin":23}],22:[function(require,module,exports){
const Plugin = require('./plugin')

module.exports = class Pinch extends Plugin
{
    /**
     * @param {Viewport} parent
     * @param {object} [options]
     * @param {boolean} [options.noDrag] disable two-finger dragging
     * @param {PIXI.Point} [options.center] place this point at center during zoom instead of center of two fingers
     * @param {number} [options.minWidth] clamp minimum width
     * @param {number} [options.minHeight] clamp minimum height
     * @param {number} [options.maxWidth] clamp maximum width
     * @param {number} [options.maxHeight] clamp maximum height
     */
    constructor(parent, options)
    {
        super(parent)
        options = options || {}
        this.noDrag = options.noDrag
        this.center = options.center
        this.minWidth = options.minWidth
        this.maxWidth = options.maxWidth
        this.minHeight = options.minHeight
        this.maxHeight = options.maxHeight
    }

    clamp()
    {
        let x = this.parent.container.scale.x, y = this.parent.container.scale.y
        if (this.minWidth && this.parent.worldScreenWidth < this.minWidth)
        {
            x = this.minWidth / this.parent.worldWidth
        }
        if (this.minHeight && this.parent.worldScreenHeight < this.minHeight)
        {
            y = this.minHeight / this.parent.worldHeight
        }
        if (this.maxWidth && this.parent.worldScreenWidth > this.maxWidth)
        {
            x = this.parent.screenWidth / this.parent.worldWidth
        }
        if (this.maxHeight && this.parent.worldScreenHeight > this.maxHeight)
        {
            y = this.parent.screenHeight / this.parent.worldHeight
        }
        this.parent.container.scale.set(x, y)
    }

    move(x, y, data)
    {
        const pointers = data.input.pointers
        if (pointers.length >= 2)
        {
            const first = pointers[0]
            const second = pointers[1]
            let last
            if (first.last && second.last)
            {
                last = Math.sqrt(Math.pow(second.last.x - first.last.x, 2) + Math.pow(second.last.y - first.last.y, 2))
            }
            if (first.identifier === data.id)
            {
                first.last = { x, y }
            }
            else if (second.identifier === data.id)
            {
                second.last = { x, y }
            }
            if (last)
            {
                let oldPoint
                const point = { x: first.last.x + (second.last.x - first.last.x) / 2, y: first.last.y + (second.last.y - first.last.y) / 2 }
                if (!this.center)
                {
                    oldPoint = this.parent.container.toLocal(point)
                }

                const dist = Math.sqrt(Math.pow(second.last.x - first.last.x, 2) + Math.pow(second.last.y - first.last.y, 2))
                const change = ((dist - last) / this.parent.screenWidth) * this.parent.container.scale.x
                this.parent.container.scale.x += change
                this.parent.container.scale.y += change
                this.clamp()

                if (this.center)
                {
                    this.parent.moveCenter(this.center)
                }
                else
                {
                    const newPoint = this.parent.container.toGlobal(oldPoint)
                    this.parent.container.x += point.x - newPoint.x
                    this.parent.container.y += point.y - newPoint.y
                }

                if (!this.noDrag && this.lastCenter)
                {
                    this.parent.container.x += point.x - this.lastCenter.x
                    this.parent.container.y += point.y - this.lastCenter.y
                }
                this.lastCenter = point
            }
        }
    }

    up(x, y, data)
    {
        const pointers = data.input.pointers
        if (pointers.length < 2)
        {
            this.lastCenter = null
        }
    }
}
},{"./plugin":23}],23:[function(require,module,exports){
module.exports = class Plugin
{
    constructor(parent)
    {
        this.parent = parent
    }

    down() { }
    move() { }
    up() { }
    update() { }
    resize() { }
}
},{}],24:[function(require,module,exports){
const Plugin = require('./plugin')
const Ease = require('pixi-ease')

module.exports = class Snap extends Plugin
{
    /**
     * @param {Viewport} parent
     * @param {number} x
     * @param {number} y
     * @param {object} [options]
     * @param {number} [options.friction=0.8] friction/frame to apply if decelerate is active
     * @param {number} [options.time=1000]
     * @param {number} [options.ease=EaseInOutSine]
     */
    constructor(parent, x, y, options)
    {
        super(parent)
        options = options || {}
        this.friction = options.friction || 0.8
        this.time = options.time || 1000
        this.ease = options.ease || 'easeInOutSine'
        this.x = x
        this.y = y
    }

    down()
    {
        this.moving = null
    }

    up()
    {
        const decelerate = this.parent.plugins['decelerate']
        if (decelerate && (decelerate.x || decelerate.y))
        {
            decelerate.percentChangeX = decelerate.percentChangeY = this.friction
        }
    }

    update(elapsed)
    {
        if (!this.moving)
        {
            const decelerate = this.parent.plugins['decelerate']
            if (this.parent.pointers.length === 0 && (!decelerate || (!decelerate.x && !decelerate.y)))
            {
                this.moving = new Ease.to(this.parent.container, { x: this.x, y: this.y }, this.time, { ease: this.ease })
            }
        }
        else
        {
            if (this.moving.update(elapsed))
            {
                this.moving = null
            }
        }
    }
}
},{"./plugin":23,"pixi-ease":4}],25:[function(require,module,exports){
const Loop = require('yy-loop')
const Input = require('yy-input')

const Drag = require('./drag')
const Pinch = require('./pinch')
const Clamp = require('./clamp')
const Decelerate = require('./decelerate')
const HitArea = require('./hit-area')
const Bounce = require('./bounce')
const Snap = require('./snap')
const Follow = require('./follow')

const PLUGIN_ORDER = ['hit-area', 'drag', 'pinch', 'follow', 'decelerate', 'bounce', 'snap', 'clamp']

module.exports = class Viewport extends Loop
{
    /**
     * @param {PIXI.Container} [container] to apply viewport
     * @param {number} [options]
     * @param {HTMLElement} [options.div=document.body] use this div to create the mouse/touch listeners
     * @param {number} [options.screenWidth] these values are needed for clamp, bounce, and pinch plugins
     * @param {number} [options.screenHeight]
     * @param {number} [options.worldWidth]
     * @param {number} [options.worldHeight]
     * @param {number} [options.threshold=5] threshold for click
     * @param {number} [options.maxFrameTime=1000 / 60] maximum frame time for animations
     * @param {number} [options.preventDefault] call preventDefault after listeners
     * @param {boolean} [options.pauseOnBlur] pause when app loses focus
     * @param {boolean} [options.noListeners] manually call touch/mouse callback down/move/up
     */
    constructor(container, options)
    {
        options = options || {}
        super({ pauseOnBlur: options.pauseOnBlur, maxFrameTime: options.maxFrameTime })
        this.container = container
        this.pointers = []
        this.plugins = []
        this.screenWidth = options.screenWidth
        this.screenHeight = options.screenHeight
        this.worldWidth = options.worldWidth
        this.worldHeight = options.worldHeight
        this.threshold = typeof options.threshold === 'undefined' ? 5 : options.threshold
        this.maxFrameTime = options.maxFrameTime || 1000 / 60
        if (!options.noListeners)
        {
            this.listeners(options.div || document.body, options.threshold, options.preventDefault)
        }
        this.add(this.loop.bind(this))
    }

    /**
     * start requestAnimationFrame() loop to handle animations; alternatively, call update() manually on each frame
     * @inherited from yy-loop
     */
    // start()

    /**
     * update loop -- may be called manually or use start/stop() for Viewport to handle updates
     * @param {number} elapsed time in ms
     */
    loop(elapsed)
    {
        for (let plugin of PLUGIN_ORDER)
        {
            if (this.plugins[plugin])
            {
                this.plugins[plugin].update(elapsed)
            }
        }
    }

    /**
     * stop loop
     * @inherited from yy-loop
     */
    // stop()

    /**
     * use this to set screen and world sizes--needed for most plugins
     * @param {number} screenWidth
     * @param {number} screenHeight
     * @param {number} worldWidth
     * @param {number} worldHeight
     */
    resize(screenWidth, screenHeight, worldWidth, worldHeight)
    {
        this.screenWidth = screenWidth
        this.screenHeight = screenHeight
        this.worldWidth = worldWidth
        this.worldHeight = worldHeight
        for (let plugin of this.plugins)
        {
            if (plugin)
            {
                plugin.resize()
            }
        }
    }

    /**
     * add or remove mouse/touch listeners
     * @private
     */
    listeners(div, threshold, preventDefault)
    {
        this.input = new Input(div, { threshold, preventDefault })
        this.input.on('down', this.down, this)
        this.input.on('move', this.move, this)
        this.input.on('up', this.up, this)
        this.input.on('click', this.click, this)
    }

    /**
     * handle down events
     * @private
     */
    down()
    {
        for (let type of PLUGIN_ORDER)
        {
            if (this.plugins[type])
            {
                this.plugins[type].down(...arguments)
            }
        }

    }

    checkThreshold(change)
    {
        if (Math.abs(change) >= this.threshold)
        {
            return true
        }
        return false
    }

    /**
     * handle move events
     * @private
     */
    move()
    {
        for (let type of PLUGIN_ORDER)
        {
            if (this.plugins[type])
            {
                this.plugins[type].move(...arguments)
            }
        }
    }

    /**
     * handle up events
     * @private
     */
    up()
    {
        for (let type of PLUGIN_ORDER)
        {
            if (this.plugins[type])
            {
                this.plugins[type].up(...arguments)
            }
        }
    }

    click(x, y)
    {
        const point = { x, y }
        this.emit('click', { screen: point, world: this.toWorld(point) })
    }

    /**
     * change coordinates from screen to world
     * @param {number|PIXI.Point} x
     * @param {number} [y]
     * @returns {PIXI.Point}
     */
    toWorld()
    {
        if (arguments.length === 2)
        {
            const x = arguments[0]
            const y = arguments[1]
            return this.container.toLocal({ x, y })
        }
        else
        {
            return this.container.toLocal(arguments[0])
        }
    }

    /**
     * change coordinates from world to screen
     * @param {number|PIXI.Point} x
     * @param {number} [y]
     * @returns {PIXI.Point}
     */
    toScreen()
    {
        if (arguments.length === 2)
        {
            const x = arguments[0]
            const y = arguments[1]
            return this.container.toGlobal({ x, y })
        }
        else
        {
            const point = arguments[0]
            return this.container.toGlobal(point)
        }
    }

    /**
     * @type {number} screen width in world coordinates
     */
    get worldScreenWidth()
    {
        return this.screenWidth / this.container.scale.x
    }

    /**
     * @type {number} screen width in world coordinates
     */
    get worldScreenHeight()
    {
        return this.screenHeight / this.container.scale.y
    }

    /**
     * get center of screen in world coordinates
     * @type {{x: number, y: number}}
     */
    get center()
    {
        return { x: this.worldScreenWidth / 2 - this.container.x / this.container.scale.x, y: this.worldScreenHeight / 2 - this.container.y / this.container.scale.y }
    }

    /**
     * move center of viewport to point
     * @param {number|PIXI.Point} x|point
     * @param {number} [y]
     */
    moveCenter(/*x, y | PIXI.Point*/)
    {
        let x, y
        if (!isNaN(arguments[0]))
        {
            x = arguments[0]
            y = arguments[1]
        }
        else
        {
            x = arguments[0].x
            y = arguments[0].y
        }
        this.container.position.set((this.worldScreenWidth / 2 - x) * this.container.scale.x, (this.worldScreenHeight / 2 - y) * this.container.scale.y)
    }

    /**
     * top-left corner
     * @type {{x: number, y: number}
     */
    get corner()
    {
        return { x: -this.container.x / this.container.scale.x, y: -this.container.y / this.container.scale.y }
    }

    /**
     * move viewport's top-left corner; also clamps and resets decelerate and bounce (as needed)
     * @param {number|PIXI.Point} x|point
     * @param {number} y
     */
    moveCorner(/*x, y | point*/)
    {
        if (arguments.length === 1)
        {
            this.container.position.set(arguments[0].x, arguments[0].y)
        }
        else
        {
            this.container.position.set(arguments[0], arguments[1])
        }
        this._reset()
    }

    /**
     * change zoom so the width fits in the viewport
     * @param {number} [width=container.width] in world coordinates; uses container.width if not provided
    * @param {boolean} [center] maintain the same center
     */
    fitWidth(width, center)
    {
        let save
        if (center)
        {
            save = this.center
        }
        width = width || this.container.width
        this.container.scale.x = this.screenWidth / width
        this.container.scale.y = this.container.scale.x
        if (center)
        {
            this.moveCenter(save)
        }
    }

    /**
     * change zoom so the height fits in the viewport
     * @param {number} [width=container.height] in world coordinates; uses container.width if not provided
    * @param {boolean} [center] maintain the same center of the screen after zoom
     */
    fitHeight(height, center)
    {
        let save
        if (center)
        {
            save = this.center
        }
        height = height || this.container.height
        this.container.scale.y = this.screenHeight / height
        this.container.scale.x = this.container.scale.y
        if (center)
        {
            this.moveCenter(save)
        }
    }

    /**
     * change zoom so it fits the entire world in the viewport
     * @param {boolean} [center] maintain the same center of the screen after zoom
     */
    fit(center)
    {
        let save
        if (center)
        {
            save = this.center
        }
        this.container.scale.x = this.screenWidth / this.container.width
        this.container.scale.y = this.screenHeight / this.container.height
        if (this.container.scale.x < this.container.scale.y)
        {
            this.container.scale.y = this.container.scale.x
        }
        else
        {
            this.container.scale.x = this.container.scale.y
        }
        if (center)
        {
            this.moveCenter(save)
        }
    }


    /**
     * is container out of world bounds
     * @return { left:boolean, right: boolean, top: boolean, bottom: boolean }
     */
    OOB()
    {
        const result = {}
        result.left = this.left < 0
        result.right = this.right > this.worldWidth
        result.top = this.top < 0
        result.bottom = this.bottom > this.worldHeight
        result.cornerPoint = { x: this.worldWidth - this.worldScreenWidth, y: this.worldHeight - this.worldScreenHeight }
        return result
    }

    /**
     * world coordinates of the right edge of the screen
     * @type {number}
     */
    get right()
    {
        return -this.container.x / this.container.scale.x + this.worldScreenWidth
    }

    /**
     * world coordinates of the right edge of the screen
     * @type {number}
     */
    get left()
    {
        return -this.container.x / this.container.scale.x
    }

    /**
     * world coordinates of the top edge of the screen
     * @type {number}
     */
    get top()
    {
        return -this.container.y / this.container.scale.y
    }

    /**
     * world coordinates of the bottom edge of the screen
     * @type {number}
     */
    get bottom()
    {
        return -this.container.y / this.container.scale.y + this.worldScreenHeight
    }

    /**
     * clamps and resets bounce and decelerate (as needed) after manually moving viewport
     * @private
     */
    _reset()
    {
        if (this.plugins['bounce'])
        {
            this.plugins['bounce'].reset()
            this.plugins['bounce'].bounce()
        }
        if (this.plugins['decelerate'])
        {
            this.plugins['decelerate'].reset()
        }
        if (this.plugins['clamp'])
        {
            this.plugins['clamp'].update()
        }
    }

    // PLUGINS

    /**
     * removes installed plugin
     * @param {string} type of plugin (e.g., 'drag', 'pinch')
     */
    removePlugin(type)
    {
        this.plugins[type] = null
    }

    /**
     * checks whether plugin is installed
     * @param {string} type of plugin (e.g., 'drag', 'pinch')
     */
    plugin(type)
    {
        return this.plugins[type]
    }

    /**
     * enable one-finger touch to drag
     * @return {Viewport} this
     */
    drag()
    {
        this.plugins['drag'] = new Drag(this)
        return this
    }

    /**
     * enable clamp to boundaries of world
     * NOTE: screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
     * @param {string} [direction=all] (all, x, or y)
     * @return {Viewport} this
     */
    clamp(direction)
    {
        this.plugins['clamp'] = new Clamp(this, direction)
        return this
    }

    /**
     * decelerate after a move
     * @param {object} [options]
     * @param {number} [options.friction=0.95] percent to decelerate after movement
     * @param {number} [options.bounce=0.8] percent to decelerate when past boundaries (only applicable when viewport.bounce() is active)
     * @param {number} [options.minSpeed=0.01] minimum velocity before stopping/reversing acceleration
     * @return {Viewport} this
     */
    decelerate(options)
    {
        this.plugins['decelerate'] = new Decelerate(this, options)
        return this
    }

    /**
     * bounce on borders
     * NOTE: screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
     * @param {object} [options]
     * @param {number} [time] time to finish bounce
     * @param {string|function} [ease] ease function or name (see http://easings.net/ for supported names)
     * @return {Viewport} this
     */
    bounce(options)
    {
        this.plugins['bounce'] = new Bounce(this, options)
        return this
    }

    /**
     * enable pinch to zoom and two-finger touch to drag
     * NOTE: screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
     * @param {boolean} [options.noDrag] disable two-finger dragging
     * @param {PIXI.Point} [options.center] place this point at center during zoom instead of center of two fingers
     * @param {number} [options.minWidth] clamp minimum width
     * @param {number} [options.minHeight] clamp minimum height
     * @param {number} [options.maxWidth] clamp maximum width
     * @param {number} [options.maxHeight] clamp maximum height
     * @return {Viewport} this
     */
    pinch(options)
    {
        this.plugins['pinch'] = new Pinch(this, options)
        return this
    }

    /**
     * add a hitArea to the container -- useful when your container contains empty spaces that you'd like to drag or pinch
     * @param {PIXI.Rectangle} [rect] if no rect is provided, it will use the value of container.getBounds()
     */
    hitArea(rect)
    {
        this.plugins['hit-area'] = new HitArea(this, rect)
        return this
    }

    /**
     * snap to a point
     * @param {number} x
     * @param {number} y
     * @param {object} [options]
     * @param {number} [options.speed=1] speed (in world pixels/ms) to snap to location
     */
    snap(x, y, options)
    {
        this.plugins['snap'] = new Snap(this, x, y, options)
        return this
    }

    /**
     * follow a target
     * @param {PIXI.DisplayObject} target to follow (object must include {x: x-coordinate, y: y-coordinate})
     * @param {object} [options]
     * @param {number} [options.speed=0] to follow in pixels/frame
     * @param {number} [options.radius] radius (in world coordinates) of center circle where movement is allowed without moving the viewport
     */
    follow(target, options)
    {
        this.plugins['follow'] = new Follow(this, target, options)
        return this
    }
}
},{"./bounce":16,"./clamp":17,"./decelerate":18,"./drag":19,"./follow":20,"./hit-area":21,"./pinch":22,"./snap":24,"yy-input":36,"yy-loop":37}],26:[function(require,module,exports){
// A library of seedable RNGs implemented in Javascript.
//
// Usage:
//
// var seedrandom = require('seedrandom');
// var random = seedrandom(1); // or any seed.
// var x = random();       // 0 <= x < 1.  Every bit is random.
// var x = random.quick(); // 0 <= x < 1.  32 bits of randomness.

// alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
// Period: ~2^116
// Reported to pass all BigCrush tests.
var alea = require('./lib/alea');

// xor128, a pure xor-shift generator by George Marsaglia.
// Period: 2^128-1.
// Reported to fail: MatrixRank and LinearComp.
var xor128 = require('./lib/xor128');

// xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
// Period: 2^192-2^32
// Reported to fail: CollisionOver, SimpPoker, and LinearComp.
var xorwow = require('./lib/xorwow');

// xorshift7, by François Panneton and Pierre L'ecuyer, takes
// a different approach: it adds robustness by allowing more shifts
// than Marsaglia's original three.  It is a 7-shift generator
// with 256 bits, that passes BigCrush with no systmatic failures.
// Period 2^256-1.
// No systematic BigCrush failures reported.
var xorshift7 = require('./lib/xorshift7');

// xor4096, by Richard Brent, is a 4096-bit xor-shift with a
// very long period that also adds a Weyl generator. It also passes
// BigCrush with no systematic failures.  Its long period may
// be useful if you have many generators and need to avoid
// collisions.
// Period: 2^4128-2^32.
// No systematic BigCrush failures reported.
var xor4096 = require('./lib/xor4096');

// Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
// number generator derived from ChaCha, a modern stream cipher.
// https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
// Period: ~2^127
// No systematic BigCrush failures reported.
var tychei = require('./lib/tychei');

// The original ARC4-based prng included in this library.
// Period: ~2^1600
var sr = require('./seedrandom');

sr.alea = alea;
sr.xor128 = xor128;
sr.xorwow = xorwow;
sr.xorshift7 = xorshift7;
sr.xor4096 = xor4096;
sr.tychei = tychei;

module.exports = sr;

},{"./lib/alea":27,"./lib/tychei":28,"./lib/xor128":29,"./lib/xor4096":30,"./lib/xorshift7":31,"./lib/xorwow":32,"./seedrandom":33}],27:[function(require,module,exports){
// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license -

// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.



(function(global, module, define) {

function Alea(seed) {
  var me = this, mash = Mash();

  me.next = function() {
    var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
    me.s0 = me.s1;
    me.s1 = me.s2;
    return me.s2 = t - (me.c = t | 0);
  };

  // Apply the seeding algorithm from Baagoe.
  me.c = 1;
  me.s0 = mash(' ');
  me.s1 = mash(' ');
  me.s2 = mash(' ');
  me.s0 -= mash(seed);
  if (me.s0 < 0) { me.s0 += 1; }
  me.s1 -= mash(seed);
  if (me.s1 < 0) { me.s1 += 1; }
  me.s2 -= mash(seed);
  if (me.s2 < 0) { me.s2 += 1; }
  mash = null;
}

function copy(f, t) {
  t.c = f.c;
  t.s0 = f.s0;
  t.s1 = f.s1;
  t.s2 = f.s2;
  return t;
}

function impl(seed, opts) {
  var xg = new Alea(seed),
      state = opts && opts.state,
      prng = xg.next;
  prng.int32 = function() { return (xg.next() * 0x100000000) | 0; }
  prng.double = function() {
    return prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
  };
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

function Mash() {
  var n = 0xefc8249d;

  var mash = function(data) {
    data = data.toString();
    for (var i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  return mash;
}


if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.alea = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],28:[function(require,module,exports){
// A Javascript implementaion of the "Tyche-i" prng algorithm by
// Samuel Neves and Filipe Araujo.
// See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  // Set up generator function.
  me.next = function() {
    var b = me.b, c = me.c, d = me.d, a = me.a;
    b = (b << 25) ^ (b >>> 7) ^ c;
    c = (c - d) | 0;
    d = (d << 24) ^ (d >>> 8) ^ a;
    a = (a - b) | 0;
    me.b = b = (b << 20) ^ (b >>> 12) ^ c;
    me.c = c = (c - d) | 0;
    me.d = (d << 16) ^ (c >>> 16) ^ a;
    return me.a = (a - b) | 0;
  };

  /* The following is non-inverted tyche, which has better internal
   * bit diffusion, but which is about 25% slower than tyche-i in JS.
  me.next = function() {
    var a = me.a, b = me.b, c = me.c, d = me.d;
    a = (me.a + me.b | 0) >>> 0;
    d = me.d ^ a; d = d << 16 ^ d >>> 16;
    c = me.c + d | 0;
    b = me.b ^ c; b = b << 12 ^ d >>> 20;
    me.a = a = a + b | 0;
    d = d ^ a; me.d = d = d << 8 ^ d >>> 24;
    me.c = c = c + d | 0;
    b = b ^ c;
    return me.b = (b << 7 ^ b >>> 25);
  }
  */

  me.a = 0;
  me.b = 0;
  me.c = 2654435769 | 0;
  me.d = 1367130551;

  if (seed === Math.floor(seed)) {
    // Integer seed.
    me.a = (seed / 0x100000000) | 0;
    me.b = seed | 0;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 20; k++) {
    me.b ^= strseed.charCodeAt(k) | 0;
    me.next();
  }
}

function copy(f, t) {
  t.a = f.a;
  t.b = f.b;
  t.c = f.c;
  t.d = f.d;
  return t;
};

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.tychei = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],29:[function(require,module,exports){
// A Javascript implementaion of the "xor128" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  me.x = 0;
  me.y = 0;
  me.z = 0;
  me.w = 0;

  // Set up generator function.
  me.next = function() {
    var t = me.x ^ (me.x << 11);
    me.x = me.y;
    me.y = me.z;
    me.z = me.w;
    return me.w ^= (me.w >>> 19) ^ t ^ (t >>> 8);
  };

  if (seed === (seed | 0)) {
    // Integer seed.
    me.x = seed;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 64; k++) {
    me.x ^= strseed.charCodeAt(k) | 0;
    me.next();
  }
}

function copy(f, t) {
  t.x = f.x;
  t.y = f.y;
  t.z = f.z;
  t.w = f.w;
  return t;
}

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xor128 = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],30:[function(require,module,exports){
// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
//
// This fast non-cryptographic random number generator is designed for
// use in Monte-Carlo algorithms. It combines a long-period xorshift
// generator with a Weyl generator, and it passes all common batteries
// of stasticial tests for randomness while consuming only a few nanoseconds
// for each prng generated.  For background on the generator, see Brent's
// paper: "Some long-period random number generators using shifts and xors."
// http://arxiv.org/pdf/1004.3115v1.pdf
//
// Usage:
//
// var xor4096 = require('xor4096');
// random = xor4096(1);                        // Seed with int32 or string.
// assert.equal(random(), 0.1520436450538547); // (0, 1) range, 53 bits.
// assert.equal(random.int32(), 1806534897);   // signed int32, 32 bits.
//
// For nonzero numeric keys, this impelementation provides a sequence
// identical to that by Brent's xorgens 3 implementaion in C.  This
// implementation also provides for initalizing the generator with
// string seeds, or for saving and restoring the state of the generator.
//
// On Chrome, this prng benchmarks about 2.1 times slower than
// Javascript's built-in Math.random().

(function(global, module, define) {

function XorGen(seed) {
  var me = this;

  // Set up generator function.
  me.next = function() {
    var w = me.w,
        X = me.X, i = me.i, t, v;
    // Update Weyl generator.
    me.w = w = (w + 0x61c88647) | 0;
    // Update xor generator.
    v = X[(i + 34) & 127];
    t = X[i = ((i + 1) & 127)];
    v ^= v << 13;
    t ^= t << 17;
    v ^= v >>> 15;
    t ^= t >>> 12;
    // Update Xor generator array state.
    v = X[i] = v ^ t;
    me.i = i;
    // Result is the combination.
    return (v + (w ^ (w >>> 16))) | 0;
  };

  function init(me, seed) {
    var t, v, i, j, w, X = [], limit = 128;
    if (seed === (seed | 0)) {
      // Numeric seeds initialize v, which is used to generates X.
      v = seed;
      seed = null;
    } else {
      // String seeds are mixed into v and X one character at a time.
      seed = seed + '\0';
      v = 0;
      limit = Math.max(limit, seed.length);
    }
    // Initialize circular array and weyl value.
    for (i = 0, j = -32; j < limit; ++j) {
      // Put the unicode characters into the array, and shuffle them.
      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
      // After 32 shuffles, take v as the starting w value.
      if (j === 0) w = v;
      v ^= v << 10;
      v ^= v >>> 15;
      v ^= v << 4;
      v ^= v >>> 13;
      if (j >= 0) {
        w = (w + 0x61c88647) | 0;     // Weyl.
        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
      }
    }
    // We have detected all zeroes; make the key nonzero.
    if (i >= 128) {
      X[(seed && seed.length || 0) & 127] = -1;
    }
    // Run the generator 512 times to further mix the state before using it.
    // Factoring this as a function slows the main generator, so it is just
    // unrolled here.  The weyl generator is not advanced while warming up.
    i = 127;
    for (j = 4 * 128; j > 0; --j) {
      v = X[(i + 34) & 127];
      t = X[i = ((i + 1) & 127)];
      v ^= v << 13;
      t ^= t << 17;
      v ^= v >>> 15;
      t ^= t >>> 12;
      X[i] = v ^ t;
    }
    // Storing state as object members is faster than using closure variables.
    me.w = w;
    me.X = X;
    me.i = i;
  }

  init(me, seed);
}

function copy(f, t) {
  t.i = f.i;
  t.w = f.w;
  t.X = f.X.slice();
  return t;
};

function impl(seed, opts) {
  if (seed == null) seed = +(new Date);
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (state.X) copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xor4096 = impl;
}

})(
  this,                                     // window object or global
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);

},{}],31:[function(require,module,exports){
// A Javascript implementaion of the "xorshift7" algorithm by
// François Panneton and Pierre L'ecuyer:
// "On the Xorgshift Random Number Generators"
// http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

(function(global, module, define) {

function XorGen(seed) {
  var me = this;

  // Set up generator function.
  me.next = function() {
    // Update xor generator.
    var X = me.x, i = me.i, t, v, w;
    t = X[i]; t ^= (t >>> 7); v = t ^ (t << 24);
    t = X[(i + 1) & 7]; v ^= t ^ (t >>> 10);
    t = X[(i + 3) & 7]; v ^= t ^ (t >>> 3);
    t = X[(i + 4) & 7]; v ^= t ^ (t << 7);
    t = X[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
    X[i] = v;
    me.i = (i + 1) & 7;
    return v;
  };

  function init(me, seed) {
    var j, w, X = [];

    if (seed === (seed | 0)) {
      // Seed state array using a 32-bit integer.
      w = X[0] = seed;
    } else {
      // Seed state using a string.
      seed = '' + seed;
      for (j = 0; j < seed.length; ++j) {
        X[j & 7] = (X[j & 7] << 15) ^
            (seed.charCodeAt(j) + X[(j + 1) & 7] << 13);
      }
    }
    // Enforce an array length of 8, not all zeroes.
    while (X.length < 8) X.push(0);
    for (j = 0; j < 8 && X[j] === 0; ++j);
    if (j == 8) w = X[7] = -1; else w = X[j];

    me.x = X;
    me.i = 0;

    // Discard an initial 256 values.
    for (j = 256; j > 0; --j) {
      me.next();
    }
  }

  init(me, seed);
}

function copy(f, t) {
  t.x = f.x.slice();
  t.i = f.i;
  return t;
}

function impl(seed, opts) {
  if (seed == null) seed = +(new Date);
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (state.x) copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xorshift7 = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);


},{}],32:[function(require,module,exports){
// A Javascript implementaion of the "xorwow" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  // Set up generator function.
  me.next = function() {
    var t = (me.x ^ (me.x >>> 2));
    me.x = me.y; me.y = me.z; me.z = me.w; me.w = me.v;
    return (me.d = (me.d + 362437 | 0)) +
       (me.v = (me.v ^ (me.v << 4)) ^ (t ^ (t << 1))) | 0;
  };

  me.x = 0;
  me.y = 0;
  me.z = 0;
  me.w = 0;
  me.v = 0;

  if (seed === (seed | 0)) {
    // Integer seed.
    me.x = seed;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 64; k++) {
    me.x ^= strseed.charCodeAt(k) | 0;
    if (k == strseed.length) {
      me.d = me.x << 10 ^ me.x >>> 4;
    }
    me.next();
  }
}

function copy(f, t) {
  t.x = f.x;
  t.y = f.y;
  t.z = f.z;
  t.w = f.w;
  t.v = f.v;
  t.d = f.d;
  return t;
}

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xorwow = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],33:[function(require,module,exports){
/*
Copyright 2014 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function (pool, math) {
//
// The following constants are related to IEEE 754 limits.
//
var global = this,
    width = 256,        // each RC4 output is 0 <= x < 256
    chunks = 6,         // at least six RC4 outputs for each double
    digits = 52,        // there are 52 significant digits in a double
    rngname = 'random', // rngname: name for Math.random and Math.seedrandom
    startdenom = math.pow(width, chunks),
    significance = math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1,
    nodecrypto;         // node.js crypto module, initialized at the bottom.

//
// seedrandom()
// This is the seedrandom function described above.
//
function seedrandom(seed, options, callback) {
  var key = [];
  options = (options == true) ? { entropy: true } : (options || {});

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    options.entropy ? [seed, tostring(pool)] :
    (seed == null) ? autoseed() : seed, 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.
  var prng = function() {
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  prng.int32 = function() { return arc4.g(4) | 0; }
  prng.quick = function() { return arc4.g(4) / 0x100000000; }
  prng.double = prng;

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Calling convention: what to return as a function of prng, seed, is_math.
  return (options.pass || callback ||
      function(prng, seed, is_math_call, state) {
        if (state) {
          // Load the arc4 state from the given state if it has an S array.
          if (state.S) { copy(state, arc4); }
          // Only provide the .state method if requested via options.state.
          prng.state = function() { return copy(arc4, {}); }
        }

        // If called as a method of Math (Math.seedrandom()), mutate
        // Math.random because that is how seedrandom.js has worked since v1.0.
        if (is_math_call) { math[rngname] = prng; return seed; }

        // Otherwise, it is a newer calling convention, so return the
        // prng directly.
        else return prng;
      })(
  prng,
  shortseed,
  'global' in options ? options.global : (this == math),
  options.state);
}
math['seed' + rngname] = seedrandom;

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability, the function call below automatically
    // discards an initial batch of values.  This is called RC4-drop[256].
    // See http://google.com/search?q=rsa+fluhrer+response&btnI
  })(width);
}

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
function copy(f, t) {
  t.i = f.i;
  t.j = f.j;
  t.S = f.S.slice();
  return t;
};

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj), prop;
  if (depth && typ == 'object') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
function autoseed() {
  try {
    var out;
    if (nodecrypto && (out = nodecrypto.randomBytes)) {
      // The use of 'out' to remember randomBytes makes tight minified code.
      out = out(width);
    } else {
      out = new Uint8Array(width);
      (global.crypto || global.msCrypto).getRandomValues(out);
    }
    return tostring(out);
  } catch (e) {
    var browser = global.navigator,
        plugins = browser && browser.plugins;
    return [+new Date, global, plugins, global.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//
if ((typeof module) == 'object' && module.exports) {
  module.exports = seedrandom;
  // When in node.js, try using crypto package for autoseeding.
  try {
    nodecrypto = require('crypto');
  } catch (ex) {}
} else if ((typeof define) == 'function' && define.amd) {
  define(function() { return seedrandom; });
}

// End anonymous scope, and pass initial values.
})(
  [],     // pool: entropy pool starts empty
  Math    // math: package containing random, pow, and seedrandom
);

},{"crypto":1}],34:[function(require,module,exports){
// angle.js <https://github.com/davidfig/anglejs>
// Released under MIT license <https://github.com/davidfig/angle/blob/master/LICENSE>
// Author: David Figatner
// Copyright (c) 2016-17 YOPEY YOPEY LLC

const _toDegreeConversion = 180 / Math.PI
const _toRadianConversion = Math.PI / 180


/** @constant {number} */
const UP = Math.PI / 2
const DOWN = 3 * Math.PI / 2
const LEFT = Math.PI
const RIGHT = 0

const NORTH = UP
const SOUTH = DOWN
const WEST = LEFT
const EAST = RIGHT

const PI_2 = Math.PI * 2
const PI_QUARTER = Math.PI / 4
const PI_HALF = Math.PI / 2

/**
 * converts from radians to degrees (all other functions expect radians)
 * @param {number} radians
 * @return {number} degrees
 */
function toDegrees(radians)
{
    return radians * _toDegreeConversion
}

/**
 * converts from degrees to radians (all other functions expect radians)
 * @param {number} degrees
 * @return {number} radians
 */
function toRadians(degrees)
{
    return degrees * _toRadianConversion
}

/**
 * returns whether the target angle is between angle1 and angle2 (in radians)
 * (based on: http://stackoverflow.com/questions/11406189/determine-if-angle-lies-between-2-other-angles)
 * @param {number} target angle
 * @param {number} angle1
 * @param {number} angle2
 * @return {boolean}
 */
function isAngleBetween(target, angle1, angle2)
{
    const rAngle = ((angle2 - angle1) % PI_2 + PI_2) % PI_2
    if (rAngle >= Math.PI)
    {
        const swap = angle1
        angle1 = angle2
        angle2 = swap
    }

    if (angle1 <= angle2)
    {
        return target >= angle1 && target <= angle2
    }
    else
    {
        return target >= angle1 || target <= angle2
    }
}

/**
 * returns +1 or -1 based on whether the difference between two angles is positive or negative (in radians)
 * @param {number} target angle
 * @param {number} source angle
 * @return {number} 1 or -1
 */
function differenceAnglesSign(target, source)
{
    function mod(a, n)
    {
        return (a % n + n) % n
    }

    const a = target - source
    return mod((a + Math.PI), PI_2) - Math.PI > 0 ? 1 : -1
}

/**
 * returns the normalized difference between two angles (in radians)
 * @param {number} a - first angle
 * @param {number} b - second angle
 * @return {number} normalized difference between a and b
 */
function differenceAngles(a, b)
{
    const c = Math.abs(a - b) % PI_2
    return c > Math.PI ? (PI_2 - c) : c
}

/**
 * returns a target angle that is the shortest way to rotate an object between start and to--may choose a negative angle
 * @param {number} start
 * @param {number} to
 * @return {number} shortest target angle
 */
function shortestAngle(start, to)
{
    const difference = differenceAngles(to, start)
    const sign = differenceAnglesSign(to, start)
    const delta = difference * sign
    return delta + start
}

/**
 * returns the normalized angle (0 - PI x 2)
 * @param {number} radians
 * @return {number} normalized angle in radians
 */
function normalize(radians)
{
    return radians - PI_2 * Math.floor(radians / PI_2)
}

/**
 * returns angle between two points (in radians)
 * @param {Point} [point1] {x: x, y: y}
 * @param {Point} [point2] {x: x, y: y}
 * @param {number} [x1]
 * @param {number} [y1]
 * @param {number} [x2]
 * @param {number} [y2]
 * @return {number} angle
 */
function angleTwoPoints(/* (point1, point2) OR (x1, y1, x2, y2) */)
{
    if (arguments.length === 4)
    {
        return Math.atan2(arguments[3] - arguments[1], arguments[2] - arguments[0])
    }
    else
    {
        return Math.atan2(arguments[1].y - arguments[0].y, arguments[1].x - arguments[0].x)
    }
}

/**
 * returns distance between two points
 * @param {Point} [point1] {x: x, y: y}
 * @param {Point} [point2] {x: x, y: y}
 * @param {number} [x1]
 * @param {number} [y1]
 * @param {number} [x2]
 * @param {number} [y2]
 * @return {number} distance
 */
function distanceTwoPoints(/* (point1, point2) OR (x1, y1, x2, y2) */)
{
    if (arguments.length === 2)
    {
        return Math.sqrt(Math.pow(arguments[1].x - arguments[0].x, 2) + Math.pow(arguments[1].y - arguments[0].y, 2))
    }
    else
    {
        return Math.sqrt(Math.pow(arguments[2] - arguments[0], 2) + Math.pow(arguments[3] - arguments[1], 2))
    }
}

/**
 * returns the squared distance between two points
 * @param {Point} [point1] {x: x, y: y}
 * @param {Point} [point2] {x: x, y: y}
 * @param {number} [x1]
 * @param {number} [y1]
 * @param {number} [x2]
 * @param {number} [y2]
 * @return {number} squared distance
 */
function distanceTwoPointsSquared(/* (point1, point2) OR (x1, y1, x2, y2) */)
{
    if (arguments.length === 2)
    {
        return Math.pow(arguments[1].x - arguments[0].x, 2) + Math.pow(arguments[1].y - arguments[0].y, 2)
    }
    else
    {
        return Math.pow(arguments[2] - arguments[0], 2) + Math.pow(arguments[3] - arguments[1], 2)
    }
}

/**
 * returns the closest cardinal (N, S, E, W) to the given angle (in radians)
 * @param {number} angle
 * @return {number} closest cardinal in radians
 */
function closestAngle(angle)
{
    const left = differenceAngles(angle, LEFT)
    const right = differenceAngles(angle, RIGHT)
    const up = differenceAngles(angle, UP)
    const down = differenceAngles(angle, DOWN)
    if (left <= right && left <= up && left <= down)
    {
        return LEFT
    }
    else if (right <= up && right <= down)
    {
        return RIGHT
    }
    else if (up <= down)
    {
        return UP
    }
    else
    {
        return DOWN
    }
}

/**
 * checks whether angles a1 and a2 are equal (after normalizing)
 * @param {number} a1
 * @param {number} a2
 * @param {number} [wiggle] return true if the difference between the angles is <= wiggle
 * @return {boolean} a1 === a2
 */
function equals(a1, a2, wiggle)
{
    if (wiggle)
    {
        return differenceAngles(a1, a2) < wiggle
    }
    else
    {
        return normalize(a1) === normalize(a2)
    }
}

/**
 * return a text representation of the cardinal direction
 * @param {number} angle
 * @returns {string} UP, DOWN, LEFT, RIGHT, or NOT CARDINAL
 */
function explain(angle)
{
    switch (angle)
    {
        case UP: return 'UP'
        case DOWN: return 'DOWN'
        case LEFT: return 'LEFT'
        case RIGHT: return 'RIGHT'
        default: return 'NOT CARDINAL'
    }
}

module.exports = {
    UP, DOWN, LEFT, RIGHT,
    NORTH, SOUTH, WEST, EAST,
    PI_2, PI_QUARTER, PI_HALF,

    toDegrees,
    toRadians,
    isAngleBetween,
    differenceAnglesSign,
    differenceAngles,
    shortestAngle,
    normalize,
    angleTwoPoints,
    distanceTwoPoints,
    distanceTwoPointsSquared,
    closestAngle,
    equals,
    explain
}
},{}],35:[function(require,module,exports){
/**
 * @file color.js
 * @author David Figatner
 * @license MIT
 * @copyright YOPEY YOPEY LLC 2016
 * {@link https://github.com/davidfig/color}
 */

const Random = require('yy-random');

/** @class */
class Color
{
    /**
     * converts a #FFFFFF to 0x123456
     * @param  {string} color
     * @return {string}
     */
    poundToHex(color)
    {
        return '0x' + parseInt(color.substr(1)).toString(16);
    }

    /**
     * converts a 0x123456 to #FFFFFF
     * @param  {string} color
     * @return {string}
     */
    hexToPound(color)
    {
        return '#' + color.substr(2);
    }

    /**
     * converts a number to #FFFFFF
     * @param  {number} color
     * @return {string}
     */
    valueToPound(color)
    {
        return '#' + color.toString(16);
    }

    /**
     * based on tinycolor
     * https://github.com/bgrins/TinyColor
     * BSD license: https://github.com/bgrins/TinyColor/blob/master/LICENSE
     * @param {string} color
     * @returns {object}
     */
    hexToHsl (color)
    {
        var rgb = this.hexToRgb(color),
            r = rgb.r,
            g = rgb.g,
            b = rgb.b;
        var max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max === min)
        {
            h = s = 0; // achromatic
        }
        else
        {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    /** based on tinycolor
    * https://github.com/bgrins/TinyColor
    * BSD license: https://github.com/bgrins/TinyColor/blob/master/LICENSE
    * @param {object|number} color {h, s, b} or h
    * @param {number} [s]
    * @param {number} [l]
    * @returns number
    */
    hslToHex(color)
    {
        var r, g, b, h, s, l;
        if (arguments.length === 1)
        {
            h = color.h,
            s = color.s,
            l = color.l;
        }
        else
        {
            h = arguments[0];
            s = arguments[1];
            l = arguments[2];
        }

        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        if (s === 0)
        {
            r = g = b = l; // achromatic
        }
        else
        {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return this.rgbToHex(r * 255, g * 255, b * 255);
    }

    /* darkens a color by the percentage
    * @param {object} color in hex (0xabcdef)
    * @param {number} amount
    * @return {number}
    */
    darken(color, amount)
    {
        return this.blend(amount, color, 0);
    }

    /** based on tinycolor
    * https://github.com/bgrins/TinyColor
    * BSD license: https://github.com/bgrins/TinyColor/blob/master/LICENSE
    * @param {object} color
    * @param {number} amount
    */
    saturate(color, amount)
    {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = this.hexToHsl(color);
        hsl.s += amount / 100;
        hsl.s = Math.min(1, Math.max(0, hsl.s));
        return this.hslToHex(hsl);
    }

    /** based on tinycolor
    * https://github.com/bgrins/TinyColor
    * BSD license: https://github.com/bgrins/TinyColor/blob/master/LICENSE
    * @param {object} color
    * @param {number} amount
    */
    desaturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = this.hexToHsl(color);
        hsl.s -= amount / 100;
        hsl.s = Math.min(1, Math.max(0, hsl.s));
        return this.hslToHex(hsl);
    }

    /**
     * blends two colors together
     * @param  {number} percent [0.0 - 1.0]
     * @param  {string} color1 first color in 0x123456 format
     * @param  {string} color2 second color in 0x123456 format
     * @return {number}
     */
    blend(percent, color1, color2)
    {
        if (percent === 0)
        {
            return color1;
        }
        if (percent === 1)
        {
            return color2;
        }
        var r1 = color1 >> 16;
        var g1 = color1 >> 8 & 0x0000ff;
        var b1 = color1 & 0x0000ff;
        var r2 = color2 >> 16;
        var g2 = color2 >> 8 & 0x0000ff;
        var b2 = color2 & 0x0000ff;
        var percent1 = 1 - percent;
        var r = percent1 * r1 + percent * r2;
        var g = percent1 * g1 + percent * g2;
        var b = percent1 * b1 + percent * b2;
        return r << 16 | g << 8 | b;
    }

    /**
     * returns a hex color into an rgb value
     * @param  {number} hex
     * @return {string}
     */
    hexToRgb(hex)
    {
        if (hex === 0)
        {
            hex = '0x000000';
        }
        else if (typeof hex !== 'string')
        {
            var s = '000000' + hex.toString(16);
            hex = '0x' + s.substr(s.length - 6);
        }
        var result = /^0x?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * rgb color to hex in the form of 0x123456
     * @param  {number|string} r first number or 'rgb(...)' string
     * @param  {number|null} g
     * @param  {number|null} b
     * @return {string}
     */
    rgbToHex(r, g, b)
    {
        if (arguments.length === 1) {
            if (Array.isArray(arguments[0])) {
                var number = arguments[0];
                r = number[0];
                g = number[1];
                b = number[2];
            } else {
                var parse = r.replace(/( *rgb *\( *)|( )|(\) *;?)/,'');
                var numbers = parse.split(',');
                r = numbers[0];
                g = numbers[1];
                b = numbers[2];
            }
        }
        return '0x' + ((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1);
    }

    /**
     * returns a random color with balanced r, g, b values (i.e., r, g, b either have the same value or are 0)
     * @param {number} min value for random number
     * @param {number} max value for random number
     * @return {number} color
     */
    random(min, max)
    {
        function random()
        {
            return Random.range(min, max);
        }

        var colors = [{r:1, g:1, b:1}, {r:1, g:1, b:0}, {r:1,g:0,b:1}, {r:0,g:1,b:1}, {r:1,g:0,b:0}, {r:0,g:1,b:0}, {r:0,g:0,b:1}];
        var color = Random.pick(colors);
        min = min || 0;
        max = max || 255;
        return this.rgbToHex(color.r ? random() : 0, color.g ? random() : 0, color.b ? random() : 0);
    }

    // h: 0-360, s: 0-1, l: 0-1
    /**
     * returns a random color based on hsl
     * @param {number} hMin [0, 360]
     * @param {number} hMax [hMin, 360]
     * @param {number} sMin [0, 1]
     * @param {number} sMax [sMin, 1]
     * @param {number} lMin [0, 1]
     * @param {number} lMax [lMin, 1]
     */
    randomHSL(hMin, hMax, sMin, sMax, lMin, lMax)
    {
        var color = {
            h: Random.range(hMin, hMax),
            s: Random.range(sMin, sMax, true),
            l: Random.range(lMin, lMax, true)
        };
        return this.hslToHex(color);
    }

    /**
     * returns random colors based on HSL with different hues
     * based on http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
     * @returns {number[]} colors in hex format (0x123456)
     */
    randomGoldenRatioHSL(count, saturation, luminosity)
    {
        const goldenRatio = 0.618033988749895;
        let h = Random.get(1, true);
        const colors = [];
        for (let i = 0; i < count; i++)
        {
            colors.push(this.hslToHex(h, saturation, luminosity));
            h = (h + goldenRatio) % 1;
        }
        return colors;
    }
};

module.exports = new Color();
},{"yy-random":40}],36:[function(require,module,exports){
/* Copyright (c) 2017 YOPEY YOPEY LLC */

const EventEmitter = require('eventemitter3')

module.exports = class Input extends EventEmitter
{
    /**
     * basic input support for touch, mouse, and keyboard
     *
     * @param {HTMLElement} object to attach listener to
     * @param {object} [options]
     * @param {boolean} [options.noPointer] turns off mouse/touch handlers
     * @param {boolean} [options.keys] turn on key listener
     * @param {boolean} [options.chromeDebug] ignore chrome debug keys, and force page reload with ctrl/cmd+r
     * @param {number} [options.threshold=5] maximum number of pixels to move while mouse/touch downbefore cancelling 'click'
     * @param {boolean} [options.preventDefault] call on handle, otherwise let client handle
     *
     * @event down(x, y, { input, event, id }) emits when touch or mouse is first down
     * @event up(x, y, { input, event, id }) emits when touch or mouse is up or cancelled
     * @event move(x, y, { input, event, id }) emits when touch or mouse moves (even if mouse is still up)
     * @event click(x, y, { input, event, id }) emits when "click" for touch or mouse
     *
     * @event keydown(keyCode:number, {shift:boolean, meta:boolean, ctrl: boolean}, { event, input }) emits when key is pressed
     * @event keyup(keyCode:number, {shift:boolean, meta:boolean, ctrl: boolean}, { event, input }) emits when key is released
     */
    constructor(div, options)
    {
        super()

        options = options || {}
        this.threshold = typeof options.threshold === 'undefined' ? 5 : options.threshold
        this.chromeDebug = options.chromeDebug
        this.preventDefault = options.preventDefault

        this.pointers = []
        this.keys = {}
        this.input = []

        if (!options.noPointer)
        {
            div.addEventListener('mousedown', this.mouseDown.bind(this))
            div.addEventListener('mousemove', this.mouseMove.bind(this))
            div.addEventListener('mouseup', this.mouseUp.bind(this))
            div.addEventListener('mouseout', this.mouseUp.bind(this))

            div.addEventListener('touchstart', this.touchStart.bind(this))
            div.addEventListener('touchmove', this.touchMove.bind(this))
            div.addEventListener('touchend', this.touchEnd.bind(this))
            div.addEventListener('touchcancel', this.touchEnd.bind(this))
        }

        if (options.keys)
        {
            this.keysListener()
        }
    }

    /**
     * helper function to find touch from list based on id
     * @private
     * @param  {number} id for saved touch
     * @return {object}
     */
    findTouch(id)
    {
        for (let i = 0; i < this.pointers.length; i++)
        {
            if (this.pointers[i].identifier === id)
            {
                return this.pointers[i]
            }
        }
        return null
    }

    /**
     * helper function to remove touch from touch list
     * @private
     * @param  {object} touch object
     */
    removeTouch(id)
    {
        for (let i = 0; i < this.pointers.length; i++)
        {
            if (this.pointers[i].identifier === id)
            {
                this.pointers.splice(i, 1)
                return
            }
        }
    }

    /**
     * Handle touch start
     * @private
     * @param  {object} e touch event
     */
    touchStart(e)
    {
        if (this.preventDefault)
        {
            e.preventDefault()
        }
        const touches = e.changedTouches
        for (let i = 0; i < touches.length; i++)
        {
            const touch = touches[i]
            const entry = {
                identifier: touch.identifier,
                x: touch.clientX,
                y: touch.clientY
            }
            this.pointers.push(entry)
            this.handleDown(touch.clientX, touch.clientY, e, touch.identifier)
        }
    }

    /**
     * Handle touch move
     * @private
     * @param  {object} e touch event
     */
    touchMove(e)
    {
        if (this.preventDefault)
        {
            e.preventDefault()
        }
        for (let i = 0; i < e.changedTouches.length; i++)
        {
            const touch = e.changedTouches[i]
            this.handleMove(touch.clientX, touch.clientY, e, touch.identifier)
        }
    }

    /**
     * Handle touch end
     * @private
     * @param  {object} e touch event
     */
    touchEnd(e)
    {
        if (this.preventDefault)
        {
            e.preventDefault()
        }
        for (let i = 0; i < e.changedTouches.length; i++)
        {
            const touch = e.changedTouches[i]
            const previous = this.findTouch(touch.identifier)
            if (previous !== null)
            {
                this.removeTouch(touch.identifier)
                this.handleUp(touch.clientX, touch.clientY, e, touch.identifier)
            }
        }
    }

    /**
     * Handle mouse down
     * @private
     * @param  {object} e touch event
     */
    mouseDown(e)
    {
        if (this.preventDefault)
        {
            e.preventDefault()
        }
        while (this.pointers.length)
        {
            this.pointers.pop()
        }
        this.pointers.push({id: 'mouse'})
        const x = window.navigator.msPointerEnabled ? e.offsetX : e.clientX
        const y = window.navigator.msPointerEnabled ? e.offsetY : e.clientY
        this.handleDown(x, y, e, 'mouse')
    }

    /**
     * Handle mouse move
     * @private
     * @param  {object} e touch event
     */
    mouseMove(e)
    {
        if (this.preventDefault)
        {
            e.preventDefault()
        }
        const x = window.navigator.msPointerEnabled ? e.offsetX : e.clientX
        const y = window.navigator.msPointerEnabled ? e.offsetY : e.clientY
        this.handleMove(x, y, e, 'mouse')
    }

    /**
     * Handle mouse up
     * @private
     * @param  {object} e touch event
     */
    mouseUp(e)
    {
        if (this.preventDefault)
        {
            e.preventDefault()
        }
        const x = window.navigator.msPointerEnabled ? e.offsetX : e.clientX
        const y = window.navigator.msPointerEnabled ? e.offsetY : e.clientY
        this.pointers.pop()
        this.handleUp(x, y, e, 'mouse')
    }

    handleDown(x, y, e, id)
    {
        this.emit('down', x, y, { event: e, input: this, id })
        if (!this.threshold || this.pointers > 1)
        {
            this.start = null
        }
        else
        {
            this.start = { x, y }
        }
    }

    handleUp(x, y, e, id)
    {
        if (this.start)
        {
            this.emit('click', x, y, { event: e, input: this, id })
        }
        this.emit('up', x, y, { event: e, input: this, id })
    }

    handleMove(x, y, e, id)
    {
        if (this.start)
        {
            if (Math.abs(this.start.x - x) > this.threshold || Math.abs(this.start.y - y) > this.threshold)
            {
                this.start = null
            }
        }
        this.emit('move', x, y, { event: e, input: this, id })
    }

    /**
     * Sets event listener for keyboard
     * @private
     */
    keysListener()
    {
        document.addEventListener('keydown', this.keydown.bind(this))
        document.addEventListener('keyup', this.keyup.bind(this))
    }

    /**
     * @private
     * @param  {object} e
     */
    keydown(e)
    {
        if (this.preventDefault)
        {
            e.preventDefault()
        }
        this.keys.shift = e.shiftKey
        this.keys.meta = e.metaKey
        this.keys.ctrl = e.ctrlKey
        const code = (typeof e.which === 'number') ? e.which : e.keyCode
        if (this.chromeDebug)
        {
            // allow chrome to open developer console
            if (this.keys.meta && code === 73)
            {
                return
            }

            // reload page with meta + r
            if (code === 82 && this.keys.meta)
            {
                window.location.reload()
                return
            }
        }
        this.emit('keydown', code, this.keys, { event: e, input: this })
    }

    /**
     * Handle key up
     * @private
     * @param  {object}
     */
    keyup(e)
    {
        if (this.preventDefault)
        {
            e.preventDefault()
        }
        this.keys.shift = e.shiftKey
        this.keys.meta = e.metaKey
        this.keys.ctrl = e.ctrlKey
        const code = (typeof e.which === 'number') ? e.which : e.keyCode
        this.emit('keyup', code, this.keys, { event: e, input: this })
    }
}
},{"eventemitter3":2}],37:[function(require,module,exports){
module.exports = require('./src/loop')
},{"./src/loop":39}],38:[function(require,module,exports){
const Events = require('eventemitter3')

/** Entry class for Loop */
class Entry extends Events
{
    /**
     * create an entry in the update loop
     * used by Loop
     * @param {function} callback
     * @param {number} [time=0] in milliseconds to call this update
     * @param {number} [count] number of times to run this update (undefined=infinite)
     */
    constructor(callback, time, count)
    {
        super()
        this.callback = callback
        this.time = time
        this.current = 0
        this.count = count
    }

    /**
     * run the callback if available
     * @private
     * @param {number} elapsed
     */
    _update(elapsed)
    {
        let result
        if (this.callback)
        {
            result = this.callback(elapsed, this)
        }
        this.emit('each', elapsed, this)
        if (result || (!isNaN(this.count) && !--this.count))
        {
            this.emit('done', this)
            return true
        }
    }

    /**
     * update checks time and runs the callback
     * @param {number} elapsed
     * @return {boolean} whether entry is complete and may be removed from list
     */
    update(elapsed)
    {
        if (!this._pause)
        {
            if (this.time)
            {
                this.current += elapsed
                if (this.current >= this.time)
                {
                    this.current -= this.time
                    return this._update(elapsed)
                }
            }
            else
            {
                return this._update(elapsed)
            }
        }
    }

    /**
     * @type {boolean} pause this entry
     */
    set pause(value)
    {
        this._pause = value
    }
    get pause()
    {
        return this._pause
    }
}

module.exports = Entry
},{"eventemitter3":2}],39:[function(require,module,exports){
/* Copyright (c) 2017 YOPEY YOPEY LLC */

const Events = require('eventemitter3')

class Loop extends Events
{
    /**
     * basic loop support
     * note: the default is to stop the loop when app loses focus
     * @param {object} [options]
     * @param {number} [options.maxFrameTime=1000 / 60] maximum time in milliseconds for a frame
     * @param {object} [options.pauseOnBlur] pause loop when app loses focus, start it when app regains focus
     *
     * @event each(elapsed, Loop)
     * @event start(Loop)
     * @event stop(Loop)
     */
    constructor(options)
    {
        super()
        options = options || {}
        this.maxFrameTime = options.maxFrameTime || 1000 / 60
        if (options.pauseOnBlur)
        {
            window.addEventListener('blur', this.stopBlur.bind(this))
            window.addEventListener('focus', this.startBlur.bind(this))
        }
        this.list = []
    }

    /**
     * start requestAnimationFrame() loop
     * @return {Loop} this
     */
    start()
    {
        if (!this.running)
        {
            this.running = performance.now()
            this.update()
            this.emit('start', this)
        }
        return this
    }

    /**
     * handler for focus event
     * @private
     */
    startBlur()
    {
        if (this.blurred)
        {
            this.start()
        }
    }

    /**
     * handler for blur event
     * @private
     */
    stopBlur()
    {
        if (this.running)
        {
            this.stop()
            this.blurred = true
        }
    }

    /**
     * stop loop
     * @return {Loop} this
     */
    stop()
    {
        this.running = false
        this.blurred = false
        this.emit('stop', this)
        return this
    }

    /**
     * loop through updates
     */
    update()
    {
        if (this.running)
        {
            const now = performance.now()
            let elapsed = now - this.running
            elapsed = elapsed > this.maxFrameTime ? this.maxFrameTime : elapsed
            for (let entry of this.list)
            {
                if (entry.update(elapsed))
                {
                    this.remove(entry)
                }
            }
            this.emit('each', elapsed, this)
            requestAnimationFrame(this.update.bind(this))
        }
    }

    /**
     * add a callback to the update loop
     * @param {function} callback
     * @param {number} [time=0] in milliseconds to call this update
     * @param {number} [count=0] number of times to run this update (0=infinite)
     * @return {object} entry - used to remove or change the parameters of the update
     */
    add(callback, time, count)
    {
        const entry = new Entry(callback, time, count)
        this.list.push(entry)
        return entry
    }

    /**
     * remove a callback from the loop
     * @param {object} entry - returned by add()
     */
    remove(entry)
    {
        const index = this.list.indexOf(entry)
        if (index !== -1)
        {
            this.list.splice(index, 1)
        }
    }

    /**
     * removes all callbacks from the loop
     */
    removeAll()
    {
        this.list = []
    }

    /**
     * @type {number} count of all animations
     */
    get count()
    {
        return this.list.length
    }

    /**
     * @type {number} count of running animations
     */
    get countRunning()
    {
        let count = 0
        for (let entry of this.list)
        {
            if (!entry.pause)
            {
                count++
            }
        }
        return count
    }
}

const Entry = require('./entry')

Loop.entry = Entry
module.exports = Loop
},{"./entry":38,"eventemitter3":2}],40:[function(require,module,exports){
// yy-random
// by David Figatner
// MIT license
// copyright YOPEY YOPEY LLC 2016-17
// https://github.com/davidfig/random

const seedrandom = require('seedrandom')

class Random
{
    constructor()
    {
        this.generator = Math.random
    }

    /**
     * generates a seeded number
     * @param {number} seed
     * @param {object} [options]
     * @param {string} [PRNG="alea"] - name of algorithm, see https://github.com/davidbau/seedrandom
     * @param {boolean} [save=true]
     */
    seed(seed, options)
    {
        options = options || {}
        this.generator = seedrandom[options.PRNG || 'alea'](seed, { state: options.state })
        this.options = options
    }

    /**
     * saves the state of the random generator
     * can only be used after Random.seed() is called
     * @returns {number} state
     */
    save()
    {
        if (this.generator !== Math.random)
        {
            return this.generator.state()
        }
    }

    /**
     * restores the state of the random generator
     * @param {number} state
     */
    restore(state)
    {
        this.generator = seedrandom[this.options.PRNG || 'alea']('', { state })
    }

    /**
     * changes the generator to use the old Math.sin-based random function
     * based on : http://stackoverflow.com/questions/521295/javascript-random-seeds
     * (deprecated) Use only for compatibility purposes
     * @param {number} seed
     */
    seedOld(seed)
    {
        this.generator = function()
        {
            const x = Math.sin(seed++) * 10000
            return x - Math.floor(x)
        }
    }

    /**
     * create a separate random generator using the seed
     * @param {number} seed
     * @return {object}
     */
    separateSeed(seed)
    {
        const random = new Random()
        random.seed(seed)
        return random
    }

    /**
     * resets the random number this.generator to Math.random()
     */
    reset()
    {
        this.generator = Math.random
    }

    /**
     * returns a random number using the this.generator between [0, ceiling - 1]
     * @param {number} ceiling
     * @param {boolean} [useFloat=false]
     * @return {number}
     */
    get(ceiling, useFloat)
    {
        const negative = ceiling < 0 ? -1 : 1
        ceiling *= negative
        let result
        if (useFloat)
        {
            result = this.generator() * ceiling
        }
        else
        {
            result = Math.floor(this.generator() * ceiling)
        }
        return result * negative
    }

    /**
     * returns a random integer between 0 - Number.MAX_SAFE_INTEGER
     * @return {number}
     */
    getHuge()
    {
        return this.get(Number.MAX_SAFE_INTEGER)
    }

    /**
     * random number [middle - range, middle + range]
     * @param {number} middle
     * @param {number} delta
     * @param {boolean} [useFloat=false]
     * @return {number}
     */
    middle(middle, delta, useFloat)
    {
        const half = delta / 2
        return this.range(middle - half, middle + half, useFloat)
    }

    /**
     * random number [start, end]
     * @param {number} start
     * @param {number} end
     * @param {boolean} [useFloat=false] if true, then range is (start, end)--i.e., not inclusive to start and end
     * @return {number}
     */
    range(start, end, useFloat)
    {
        // case where there is no range
        if (end === start)
        {
            return end
        }

        if (useFloat)
        {
            return this.get(end - start, true) + start
        }
        else
        {
            let range
            if (start < 0 && end > 0)
            {
                range = -start + end + 1
            }
            else if (start === 0 && end > 0)
            {
                range = end + 1
            }
            else if (start < 0 && end === 0)
            {
                range = start - 1
                start = 1
            }
            else if (start < 0 && end < 0)
            {
                range = end - start - 1
            }
            else
            {
                range = end - start + 1
            }
            return Math.floor(this.generator() * range) + start
        }
    }

    /**
     * an array of random numbers between [start, end]
     * @param {number} start
     * @param {number} end
     * @param {number} count
     * @param {boolean} [useFloat=false]
     * @return {number[]}
     */
    rangeMultiple(start, end, count, useFloat)
    {
        var array = []
        for (let i = 0; i < count; i++)
        {
            array.push(this.range(start, end, useFloat))
        }
        return array
    }

    /**
     * an array of random numbers between [middle - range, middle + range]
     * @param {number} middle
     * @param {number} range
     * @param {number} count
     * @param {boolean} [useFloat=false]
     * @return {number[]}
     */
    middleMultiple(middle, range, count, useFloat)
    {
        const array = []
        for (let i = 0; i < count; i++)
        {
            array.push(middle(middle, range, useFloat))
        }
        return array
    }

    /**
     * @param {number} [chance=0.5]
     * returns random sign (either +1 or -1)
     * @return {number}
     */
    sign(chance)
    {
        chance = chance || 0.5
        return this.generator() < chance ? 1 : -1
    }

    /**
     * tells you whether a random chance was achieved
     * @param {number} [percent=0.5]
     * @return {boolean}
     */
    chance(percent)
    {
        return this.generator() < (percent || 0.5)
    }

    /**
     * returns a random angle in radians [0 - 2 * Math.PI)
     */
    angle()
    {
        return this.get(Math.PI * 2, true)
    }

    /**
     * Shuffle array (either in place or copied)
     * from http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     * @param {Array} array
     * @param {boolean} [copy=false] whether to shuffle in place (default) or return a new shuffled array
     * @return {Array} a shuffled array
     */
    shuffle(array, copy)
    {
        if (copy)
        {
            array = array.slice()
        }
        if (array.length === 0)
        {
            return array
        }

        let currentIndex = array.length, temporaryValue, randomIndex

        // While there remain elements to shuffle...
        while (0 !== currentIndex)
        {
            // Pick a remaining element...
            randomIndex = this.get(currentIndex)
            currentIndex -= 1

            // And swap it with the current element.
            temporaryValue = array[currentIndex]
            array[currentIndex] = array[randomIndex]
            array[randomIndex] = temporaryValue
        }
        return array
    }

    /**
     * picks a random element from an array
     * @param {Array} array
     * @return {*}
     */
    pick(array, remove)
    {
        if (!remove)
        {
            return array[this.get(array.length)]
        }
        else
        {
            const pick = this.get(array.length)
            const temp = array[pick]
            array.splice(pick, 1)
            return temp
        }
    }

    /**
     * returns a random property from an object
     * from http://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
     * @param {object} obj
     * @return {*}
     */
    property(obj)
    {
        var result
        var count = 0
        for (var prop in obj)
        {
            if (this.chance(1 / ++count))
            {
                result = prop
            }
        }
        return result
    }

    /**
     * creates a random set where each entry is a value between [min, max]
     * @param {number} min
     * @param {number} max
     * @param {number} amount of numbers in set
     * @param {number[]}
     */
    set(min, max, amount)
    {
        var set = [], all = [], i
        for (i = min; i < max; i++)
        {
            all.push(i)
        }

        for (i = 0; i < amount; i++)
        {
            var found = this.get(all.length)
            set.push(all[found])
            all.splice(found, 1)
        }
        return set
    }


    /**
     * returns a set of numbers with a randomly even distribution (i.e., no overlapping and filling the space)
     * @param {number} start position
     * @param {number} end position
     * @param {number} count of non-start/end points
     * @param {boolean} [includeStart=false] includes start point (count++)
     * @param {boolean} [includeEnd=false] includes end point (count++)
     * @param {boolean} [useFloat=false]
     * @param {number[]}
     */
    distribution(start, end, count, includeStart, includeEnd, useFloat)
    {
        var interval = Math.floor((end - start) / count)
        var halfInterval = interval / 2
        var quarterInterval = interval / 4
        var set = []
        if (includeStart)
        {
            set.push(start)
        }
        for (var i = 0; i < count; i++)
        {
            set.push(start + i * interval + halfInterval + this.range(-quarterInterval, quarterInterval, useFloat))
        }
        if (includeEnd)
        {
            set.push(end)
        }
        return set
    }

    /**
     * returns a random number based on weighted probability between [min, max]
     * from http://stackoverflow.com/questions/22656126/javascript-random-number-with-weighted-probability
     * @param {number} min value
     * @param {number} max value
     * @param {number} target for average value
     * @param {number} stddev - standard deviation
     */
    weightedProbabilityInt(min, max, target, stddev)
    {
        function normRand()
        {
            let x1, x2, rad
            do
            {
                x1 = 2 * this.get(1, true) - 1
                x2 = 2 * this.get(1, true) - 1
                rad = x1 * x1 + x2 * x2
            } while (rad >= 1 || rad === 0)
            const c = Math.sqrt(-2 * Math.log(rad) / rad)
            return x1 * c
        }

        stddev = stddev || 1
        if (Math.random() < 0.81546)
        {
            while (true)
            {
                const sample = ((normRand() * stddev) + target)
                if (sample >= min && sample <= max)
                {
                    return sample
                }
            }
        }
        else
        {
            return this.range(min, max)
        }
    }

    /*
     * returns a random hex color (0 - 0xffffff)
     * @return {number}
     */
    color()
    {
        return this.get(0xffffff)
    }
}

module.exports = new Random()
},{"seedrandom":26}],41:[function(require,module,exports){
window.addEventListener('resize', function () {
    resize();
});

window.onorientationchange = resize;

alert(1);

var h = 600;
var w = 600;

var game = new PIXI.Application(w, h, {
    antialias: false,
    transparent: false,
    resolution: 1
});

game.view.style.position = "absolute";
game.view.style.display = "block";
document.body.appendChild(game.view);
game.renderer.autoResize = true;

const Viewport = require('pixi-viewport');

//const container = new PIXI.Container();

var options = {
    screenWidth: w * 2,
    screenHeight: h,
    worldWidth: w,
    worldHeight: h,
};

var viewport = new Viewport(game.stage, options);

viewport
    .drag()
    .hitArea()
    .decelerate()
    .start();

//var keyboard = require('pixi-keyboard');


PIXI.loader.add('bunny', 'bunny.png').load(function (loader, resources) {

    // This creates a texture from a 'bunny.png' image.
    var bunny = new PIXI.Sprite(resources.bunny.texture);

    // Setup the position of the bunny
    bunny.x = game.renderer.width / 2;
    bunny.y = game.renderer.height / 2;

    // Rotate around the center
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;

    // Add the bunny to the scene we are building.
    game.stage.addChild(bunny);

    // Listen for frame updates
    game.ticker.add(function () {
        // each frame we spin the bunny around a bit
        bunny.rotation += 0.01;
        bunny.x += 5
    });

    resize();

    viewport.follow(bunny);
});

function resize() {
    window.scrollTo(0, 0);

    var width = window.innerWidth;
    var height = window.innerHeight;
    var ratio = height / h;

    game.renderer.resize(width, height);
    /*game.view.style.width = width + "px";
    game.view.style.height = height + "px";
    game.renderer.view.width = width;
    game.renderer.view.height = height;*/

    game.stage.setTransform(0, 0, ratio, ratio, 0, 0, 0, 0, 0);

    viewport.screenWidth = width;
    viewport.screenHeight = height;

    console.log('v-width: ' + viewport.screenWidth +
        '\nv-height: ' + viewport.screenHeight +
        '\nw-width: ' + viewport.worldWidth +
        '\nw-height: ' + viewport.worldHeight);

    viewport.update();
}


game.renderer.backgroundColor = 0x00FFFF;


//

//var app = new PIXI.Application();

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container.
/*var app = new PIXI.Application();

// The application will create a canvas element for you that you
// can then insert into the DOM.
document.body.appendChild(app.view);

// load the texture we need
PIXI.loader.add('bunny', 'bunny.png').load(function(loader, resources) {

    // This creates a texture from a 'bunny.png' image.
    var bunny = new PIXI.Sprite(resources.bunny.texture);

    // Setup the position of the bunny
    bunny.x = app.renderer.width / 2;
    bunny.y = app.renderer.height / 2;

    // Rotate around the center
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;

    // Add the bunny to the scene we are building.
    app.stage.addChild(bunny);

    // Listen for frame updates
    app.ticker.add(function() {
        // each frame we spin the bunny around a bit
        bunny.rotation += 0.0003;
    });
});*/


/*
var rendererOptions = {
    antialiasing: false,
    transparent: false,
    resolution: window.devicePixelRatio,
    autoResize: true,
}

// Create the canvas in which the game will show, and a
// generic container for all the graphical objects
renderer = PIXI.autoDetectRenderer(800, 600,
    rendererOptions);

// Put the renderer on screen in the corner
renderer.view.style.position = "absolute";
renderer.view.style.top = "0px";
renderer.view.style.left = "0px";

// The stage is essentially a display list of all game objects
// for Pixi to render; it's used in resize(), so it must exist
stage = new PIXI.Container();

// Size the renderer to fill the screen
resize();

// Actually place the renderer onto the page for display
document.body.appendChild(renderer.view);

// Listen for and adapt to changes to the screen size, e.g.,
// user changing the window or rotating their device
window.addEventListener("resize", resize);


function resize() {

    // Determine which screen dimension is most constrained
    ratio = Math.min(window.innerWidth / 800,
        window.innerHeight / 600);

    // Scale the view appropriately to fill that dimension
    stage.scale.x = stage.scale.y = ratio;

    // Update the renderer dimensions
    renderer.resize(Math.ceil(800 * ratio),
        Math.ceil(600 * ratio));
}*/

},{"pixi-viewport":15}]},{},[41]);
