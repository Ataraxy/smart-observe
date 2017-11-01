import Dep from './dep'
import amendArray from './array'
import {
  defineValue,
  defineAccessor,
  isArray,
  isPlainObject,
  everyEntries,
} from './util'
import {OBSERVE_NAME} from './constants'

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 *
 * @class
 * @param {Array|Object} value
 */

class Observer {
  constructor (value) {
    this.value = value
    this.dep = new Dep()
    defineValue(value, OBSERVE_NAME, this)
    if (isArray(value)) {
      amendArray(value)
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   *
   * @param {Object} object
   */

  walk (object) {
    everyEntries(object, (key, value) => this.convert(key, value))
  }

  /**
   * Observe a list of Array items.
   *
   * @param {Array} items
   */

  observeArray (items) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }

  /**
   * Convert a property into getter/setter so we can emit
   * the events when the property is accessed/changed.
   *
   * @param {string} key
   * @param {*} value
   */

  convert (key, value) {
    defineReactive(this.value, key, value)
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 *
 * @param {*} value
 * @return {Observer|undefined}
 */

export function observe (value) {
  if (!value || typeof value !== 'object') return
  let observer
  if (
    Object.prototype.hasOwnProperty.call(value, OBSERVE_NAME)
    && value[OBSERVE_NAME] instanceof Observer
  ) {
    observer = value[OBSERVE_NAME]
  } else if (
    (isArray(value) || isPlainObject(value))
    && Object.isExtensible(value)
  ) {
    observer = new Observer(value)
  }
  return observer
}

/**
 * Define a reactive property on an Object.
 *
 * @param {Object} object
 * @param {string} key
 * @param {*} value
 */

export function defineReactive (object, key, value) {
  const dep = new Dep()

  const desc = Object.getOwnPropertyDescriptor(object, key)
  if (desc && desc.configurable === false) return

  // cater for pre-defined getter/setters
  const getter = desc && desc.get
  const setter = desc && desc.set

  let childOb = observe(value)

  function reactiveGetter () {
    const currentValue = getter ? getter.call(object) : value
    if (Dep.target) {
      dep.depend()
      if (childOb) {
        childOb.dep.depend()
      }
      if (isArray(currentValue)) {
        for (let i = 0, l = currentValue.length, e; i < l; i++) {
          e = currentValue[i]
          e && e[OBSERVE_NAME] && e[OBSERVE_NAME].dep.depend()
        }
      }
    }
    return currentValue
  }
  function reactiveSetter (newValue) {
    const oldValue = getter ? getter.call(object) : value
    if (newValue === oldValue) return
    if (setter) {
      setter.call(object, newValue)
    } else {
      value = newValue
    }
    childOb = observe(newValue)
    dep.notify()
  }
  defineAccessor(object, key, reactiveGetter, reactiveSetter)
}
