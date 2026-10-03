/**
 * @license countdown.js v2.6.1 http://countdownjs.org
 * Copyright (c)2006-2014 Stephen M. McKamey.
 * Licensed under The MIT License.
 *
 * TypeScript port.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Unit =
  | "millennia"
  | "centuries"
  | "decades"
  | "years"
  | "months"
  | "weeks"
  | "days"
  | "hours"
  | "minutes"
  | "seconds"
  | "milliseconds";

type UnitCounts = { [K in Unit]: number };

export type DateLike = Date | number | Timespan | null;

export type TimerId = ReturnType<typeof setInterval>;

export type CountdownCallback = (ts: Timespan, timerId: TimerId) => void;

export interface Format {
  singular?: string | string[];
  plural?: string | string[];
  last?: string;
  delim?: string;
  empty?: string;
  formatNumber?: (value: number) => string | number;
  formatter?: (value: number, unit: number) => string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MILLISECONDS = 0x001;
const SECONDS = 0x002;
const MINUTES = 0x004;
const HOURS = 0x008;
const DAYS = 0x010;
const WEEKS = 0x020;
const MONTHS = 0x040;
const YEARS = 0x080;
const DECADES = 0x100;
const CENTURIES = 0x200;
const MILLENNIA = 0x400;

const DEFAULTS = YEARS | MONTHS | DAYS | HOURS | MINUTES | SECONDS;

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_DAY =
  HOURS_PER_DAY *
  MINUTES_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND;
const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;
const YEARS_PER_DECADE = 10;
const DECADES_PER_CENTURY = 10;
const CENTURIES_PER_MILLENNIUM = 10;

const LABEL_MILLISECONDS = 0;
const LABEL_SECONDS = 1;
const LABEL_MINUTES = 2;
const LABEL_HOURS = 3;
const LABEL_DAYS = 4;
const LABEL_WEEKS = 5;
const LABEL_MONTHS = 6;
const LABEL_YEARS = 7;
const LABEL_DECADES = 8;
const LABEL_CENTURIES = 9;
const LABEL_MILLENNIA = 10;

const ceil = Math.ceil;
const floor = Math.floor;

// ---------------------------------------------------------------------------
// Mutable format state
// ---------------------------------------------------------------------------

let LABELS_SINGLUAR: string[];
let LABELS_PLURAL: string[];
let LABEL_LAST: string;
let LABEL_DELIM: string;
let LABEL_NOW: string;
let formatNumber: (value: number) => string | number;
let formatter: (value: number, unit: number) => string;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function borrowMonths(ref: Date, shift: number): number {
  const prevTime = ref.getTime();

  // increment month by shift
  ref.setMonth(ref.getMonth() + shift);

  // this is the trickiest since months vary in length
  return Math.round((ref.getTime() - prevTime) / MILLISECONDS_PER_DAY);
}

function daysPerMonth(ref: Date): number {
  const a = ref.getTime();

  // increment month by 1
  const b = new Date(a);
  b.setMonth(ref.getMonth() + 1);

  // this is the trickiest since months vary in length
  return Math.round((b.getTime() - a) / MILLISECONDS_PER_DAY);
}

function daysPerYear(ref: Date): number {
  const a = ref.getTime();

  // increment year by 1
  const b = new Date(a);
  b.setFullYear(ref.getFullYear() + 1);

  // this is the trickiest since years (periodically) vary in length
  return Math.round((b.getTime() - a) / MILLISECONDS_PER_DAY);
}

/**
 * Applies the Timespan to the given date.
 */
function addToDate(
  ts: Timespan | null | undefined,
  date?: Date | number | null,
): Date {
  const result =
    date instanceof Date || (date !== null && isFinite(date as number))
      ? new Date(+(date as Date | number))
      : new Date();
  if (!ts) {
    return result;
  }

  // if there is a value field, use it directly
  let value = +(ts.value as number) || 0;
  if (value) {
    result.setTime(result.getTime() + value);
    return result;
  }

  value = +(ts.milliseconds as number) || 0;
  if (value) {
    result.setMilliseconds(result.getMilliseconds() + value);
  }

  value = +(ts.seconds as number) || 0;
  if (value) {
    result.setSeconds(result.getSeconds() + value);
  }

  value = +(ts.minutes as number) || 0;
  if (value) {
    result.setMinutes(result.getMinutes() + value);
  }

  value = +(ts.hours as number) || 0;
  if (value) {
    result.setHours(result.getHours() + value);
  }

  value = +(ts.weeks as number) || 0;
  if (value) {
    value *= DAYS_PER_WEEK;
  }

  value += +(ts.days as number) || 0;
  if (value) {
    result.setDate(result.getDate() + value);
  }

  value = +(ts.months as number) || 0;
  if (value) {
    result.setMonth(result.getMonth() + value);
  }

  value = +(ts.millennia as number) || 0;
  if (value) {
    value *= CENTURIES_PER_MILLENNIUM;
  }

  value += +(ts.centuries as number) || 0;
  if (value) {
    value *= DECADES_PER_CENTURY;
  }

  value += +(ts.decades as number) || 0;
  if (value) {
    value *= YEARS_PER_DECADE;
  }

  value += +(ts.years as number) || 0;
  if (value) {
    result.setFullYear(result.getFullYear() + value);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function plurality(value: number, unit: number): string {
  return (
    formatNumber(value) +
    (value === 1 ? LABELS_SINGLUAR[unit] : LABELS_PLURAL[unit])
  );
}

/**
 * Formats the entries as English labels
 */
function formatList(ts: Timespan): string[] {
  const list: string[] = [];

  let value = ts.millennia;
  if (value) {
    list.push(formatter(value, LABEL_MILLENNIA));
  }

  value = ts.centuries;
  if (value) {
    list.push(formatter(value, LABEL_CENTURIES));
  }

  value = ts.decades;
  if (value) {
    list.push(formatter(value, LABEL_DECADES));
  }

  value = ts.years;
  if (value) {
    list.push(formatter(value, LABEL_YEARS));
  }

  value = ts.months;
  if (value) {
    list.push(formatter(value, LABEL_MONTHS));
  }

  value = ts.weeks;
  if (value) {
    list.push(formatter(value, LABEL_WEEKS));
  }

  value = ts.days;
  if (value) {
    list.push(formatter(value, LABEL_DAYS));
  }

  value = ts.hours;
  if (value) {
    list.push(formatter(value, LABEL_HOURS));
  }

  value = ts.minutes;
  if (value) {
    list.push(formatter(value, LABEL_MINUTES));
  }

  value = ts.seconds;
  if (value) {
    list.push(formatter(value, LABEL_SECONDS));
  }

  value = ts.milliseconds;
  if (value) {
    list.push(formatter(value, LABEL_MILLISECONDS));
  }

  return list;
}

/**
 * Timespan representation of a duration of time
 */
export class Timespan {
  start?: Date;
  end?: Date;
  units?: number;
  value?: number;
  /** reference month for determining days in month (transient) */
  refMonth?: Date;

  millennia?: number;
  centuries?: number;
  decades?: number;
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;

  /**
   * Formats the Timespan as a sentence
   * @param emptyLabel the string to use when no values returned
   */
  toString(emptyLabel?: string): string {
    const label = formatList(this);

    const count = label.length;
    if (!count) {
      return emptyLabel ? "" + emptyLabel : LABEL_NOW;
    }
    if (count === 1) {
      return label[0];
    }

    const last = LABEL_LAST + label.pop();
    return label.join(LABEL_DELIM) + last;
  }

  /**
   * Formats the Timespan as a sentence in HTML
   * @param tag HTML tag name to wrap each value
   * @param emptyLabel the string to use when no values returned
   */
  toHTML(tag?: string, emptyLabel?: string): string {
    tag = tag || "span";
    const label = formatList(this);

    const count = label.length;
    if (!count) {
      emptyLabel = emptyLabel || LABEL_NOW;
      return emptyLabel
        ? "<" + tag + ">" + emptyLabel + "</" + tag + ">"
        : emptyLabel;
    }
    for (let i = 0; i < count; i++) {
      // wrap each unit in tag
      label[i] = "<" + tag + ">" + label[i] + "</" + tag + ">";
    }
    if (count === 1) {
      return label[0];
    }

    const last = LABEL_LAST + label.pop();
    return label.join(LABEL_DELIM) + last;
  }

  /**
   * Applies the Timespan to the given date
   * @param date the date to which the timespan is added.
   */
  addTo(date?: Date | number | null): Date {
    return addToDate(this, date);
  }
}

// ---------------------------------------------------------------------------
// Internal arithmetic
// ---------------------------------------------------------------------------

function removeUnit(ts: Timespan, unit: Unit): void {
  delete (ts as Partial<UnitCounts>)[unit];
}

/**
 * Borrow any underflow units, carry any overflow units
 */
function rippleRounded(timespan: Timespan, toUnit: Unit): void {
  const ts = timespan as Timespan & UnitCounts & { refMonth: Date };

  switch (toUnit) {
    case "seconds":
      if (ts.seconds !== SECONDS_PER_MINUTE || isNaN(ts.minutes)) {
        return;
      }
      // ripple seconds up to minutes
      ts.minutes++;
      ts.seconds = 0;

    /* falls through */
    case "minutes":
      if (ts.minutes !== MINUTES_PER_HOUR || isNaN(ts.hours)) {
        return;
      }
      // ripple minutes up to hours
      ts.hours++;
      ts.minutes = 0;

    /* falls through */
    case "hours":
      if (ts.hours !== HOURS_PER_DAY || isNaN(ts.days)) {
        return;
      }
      // ripple hours up to days
      ts.days++;
      ts.hours = 0;

    /* falls through */
    case "days":
      if (ts.days !== DAYS_PER_WEEK || isNaN(ts.weeks)) {
        return;
      }
      // ripple days up to weeks
      ts.weeks++;
      ts.days = 0;

    /* falls through */
    case "weeks":
      if (
        ts.weeks !== daysPerMonth(ts.refMonth) / DAYS_PER_WEEK ||
        isNaN(ts.months)
      ) {
        return;
      }
      // ripple weeks up to months
      ts.months++;
      ts.weeks = 0;

    /* falls through */
    case "months":
      if (ts.months !== MONTHS_PER_YEAR || isNaN(ts.years)) {
        return;
      }
      // ripple months up to years
      ts.years++;
      ts.months = 0;

    /* falls through */
    case "years":
      if (ts.years !== YEARS_PER_DECADE || isNaN(ts.decades)) {
        return;
      }
      // ripple years up to decades
      ts.decades++;
      ts.years = 0;

    /* falls through */
    case "decades":
      if (ts.decades !== DECADES_PER_CENTURY || isNaN(ts.centuries)) {
        return;
      }
      // ripple decades up to centuries
      ts.centuries++;
      ts.decades = 0;

    /* falls through */
    case "centuries":
      if (ts.centuries !== CENTURIES_PER_MILLENNIUM || isNaN(ts.millennia)) {
        return;
      }
      // ripple centuries up to millennia
      ts.millennia++;
      ts.centuries = 0;
    /* falls through */
  }
}

/**
 * Ripple up partial units one place
 *
 * @return new fractional value
 */
function fraction(
  ts: Timespan,
  frac: number,
  fromUnit: Unit,
  toUnit: Unit,
  conversion: number,
  digits: number,
): number {
  const from = ts[fromUnit];
  if (from !== undefined && from >= 0) {
    frac += from;
    removeUnit(ts, fromUnit);
  }

  frac /= conversion;
  if (frac + 1 <= 1) {
    // drop if below machine epsilon
    return 0;
  }

  const to = ts[toUnit];
  if (to !== undefined && to >= 0) {
    // ensure does not have more than specified number of digits
    ts[toUnit] = +(to + frac).toFixed(digits);
    rippleRounded(ts, toUnit);
    return 0;
  }

  return frac;
}

/**
 * Ripple up partial units to next existing
 */
function fractional(ts: Timespan, digits: number): void {
  const ref = ts.refMonth as Date;

  let frac = fraction(
    ts,
    0,
    "milliseconds",
    "seconds",
    MILLISECONDS_PER_SECOND,
    digits,
  );
  if (!frac) {
    return;
  }

  frac = fraction(ts, frac, "seconds", "minutes", SECONDS_PER_MINUTE, digits);
  if (!frac) {
    return;
  }

  frac = fraction(ts, frac, "minutes", "hours", MINUTES_PER_HOUR, digits);
  if (!frac) {
    return;
  }

  frac = fraction(ts, frac, "hours", "days", HOURS_PER_DAY, digits);
  if (!frac) {
    return;
  }

  frac = fraction(ts, frac, "days", "weeks", DAYS_PER_WEEK, digits);
  if (!frac) {
    return;
  }

  frac = fraction(
    ts,
    frac,
    "weeks",
    "months",
    daysPerMonth(ref) / DAYS_PER_WEEK,
    digits,
  );
  if (!frac) {
    return;
  }

  frac = fraction(
    ts,
    frac,
    "months",
    "years",
    daysPerYear(ref) / daysPerMonth(ref),
    digits,
  );
  if (!frac) {
    return;
  }

  frac = fraction(ts, frac, "years", "decades", YEARS_PER_DECADE, digits);
  if (!frac) {
    return;
  }

  frac = fraction(
    ts,
    frac,
    "decades",
    "centuries",
    DECADES_PER_CENTURY,
    digits,
  );
  if (!frac) {
    return;
  }

  frac = fraction(
    ts,
    frac,
    "centuries",
    "millennia",
    CENTURIES_PER_MILLENNIUM,
    digits,
  );

  // should never reach this with remaining fractional value
  if (frac) {
    throw new Error("Fractional unit overflow");
  }
}

/**
 * Borrow any underflow units, carry any overflow units
 */
function ripple(timespan: Timespan): void {
  const ts = timespan as Timespan & UnitCounts & { refMonth: Date };
  let x: number;

  if (ts.milliseconds < 0) {
    // ripple seconds down to milliseconds
    x = ceil(-ts.milliseconds / MILLISECONDS_PER_SECOND);
    ts.seconds -= x;
    ts.milliseconds += x * MILLISECONDS_PER_SECOND;
  } else if (ts.milliseconds >= MILLISECONDS_PER_SECOND) {
    // ripple milliseconds up to seconds
    ts.seconds += floor(ts.milliseconds / MILLISECONDS_PER_SECOND);
    ts.milliseconds %= MILLISECONDS_PER_SECOND;
  }

  if (ts.seconds < 0) {
    // ripple minutes down to seconds
    x = ceil(-ts.seconds / SECONDS_PER_MINUTE);
    ts.minutes -= x;
    ts.seconds += x * SECONDS_PER_MINUTE;
  } else if (ts.seconds >= SECONDS_PER_MINUTE) {
    // ripple seconds up to minutes
    ts.minutes += floor(ts.seconds / SECONDS_PER_MINUTE);
    ts.seconds %= SECONDS_PER_MINUTE;
  }

  if (ts.minutes < 0) {
    // ripple hours down to minutes
    x = ceil(-ts.minutes / MINUTES_PER_HOUR);
    ts.hours -= x;
    ts.minutes += x * MINUTES_PER_HOUR;
  } else if (ts.minutes >= MINUTES_PER_HOUR) {
    // ripple minutes up to hours
    ts.hours += floor(ts.minutes / MINUTES_PER_HOUR);
    ts.minutes %= MINUTES_PER_HOUR;
  }

  if (ts.hours < 0) {
    // ripple days down to hours
    x = ceil(-ts.hours / HOURS_PER_DAY);
    ts.days -= x;
    ts.hours += x * HOURS_PER_DAY;
  } else if (ts.hours >= HOURS_PER_DAY) {
    // ripple hours up to days
    ts.days += floor(ts.hours / HOURS_PER_DAY);
    ts.hours %= HOURS_PER_DAY;
  }

  while (ts.days < 0) {
    // NOTE: never actually seen this loop more than once

    // ripple months down to days
    ts.months--;
    ts.days += borrowMonths(ts.refMonth, 1);
  }

  // weeks is always zero here

  if (ts.days >= DAYS_PER_WEEK) {
    // ripple days up to weeks
    ts.weeks += floor(ts.days / DAYS_PER_WEEK);
    ts.days %= DAYS_PER_WEEK;
  }

  if (ts.months < 0) {
    // ripple years down to months
    x = ceil(-ts.months / MONTHS_PER_YEAR);
    ts.years -= x;
    ts.months += x * MONTHS_PER_YEAR;
  } else if (ts.months >= MONTHS_PER_YEAR) {
    // ripple months up to years
    ts.years += floor(ts.months / MONTHS_PER_YEAR);
    ts.months %= MONTHS_PER_YEAR;
  }

  // years is always non-negative here
  // decades, centuries and millennia are always zero here

  if (ts.years >= YEARS_PER_DECADE) {
    // ripple years up to decades
    ts.decades += floor(ts.years / YEARS_PER_DECADE);
    ts.years %= YEARS_PER_DECADE;

    if (ts.decades >= DECADES_PER_CENTURY) {
      // ripple decades up to centuries
      ts.centuries += floor(ts.decades / DECADES_PER_CENTURY);
      ts.decades %= DECADES_PER_CENTURY;

      if (ts.centuries >= CENTURIES_PER_MILLENNIUM) {
        // ripple centuries up to millennia
        ts.millennia += floor(ts.centuries / CENTURIES_PER_MILLENNIUM);
        ts.centuries %= CENTURIES_PER_MILLENNIUM;
      }
    }
  }
}

/**
 * Remove any units not requested
 *
 * @param units the units to populate
 * @param max number of labels to output
 * @param digits max number of decimal digits to output
 */
function pruneUnits(
  timespan: Timespan,
  units: number,
  max: number,
  digits: number,
): void {
  const ts = timespan as Timespan & UnitCounts & { refMonth: Date };
  let count = 0;

  // Calc from largest unit to smallest to prevent underflow
  if (!(units & MILLENNIA) || count >= max) {
    // ripple millennia down to centuries
    ts.centuries += ts.millennia * CENTURIES_PER_MILLENNIUM;
    removeUnit(ts, "millennia");
  } else if (ts.millennia) {
    count++;
  }

  if (!(units & CENTURIES) || count >= max) {
    // ripple centuries down to decades
    ts.decades += ts.centuries * DECADES_PER_CENTURY;
    removeUnit(ts, "centuries");
  } else if (ts.centuries) {
    count++;
  }

  if (!(units & DECADES) || count >= max) {
    // ripple decades down to years
    ts.years += ts.decades * YEARS_PER_DECADE;
    removeUnit(ts, "decades");
  } else if (ts.decades) {
    count++;
  }

  if (!(units & YEARS) || count >= max) {
    // ripple years down to months
    ts.months += ts.years * MONTHS_PER_YEAR;
    removeUnit(ts, "years");
  } else if (ts.years) {
    count++;
  }

  if (!(units & MONTHS) || count >= max) {
    // ripple months down to days
    if (ts.months) {
      ts.days += borrowMonths(ts.refMonth, ts.months);
    }
    removeUnit(ts, "months");

    if (ts.days >= DAYS_PER_WEEK) {
      // ripple day overflow back up to weeks
      ts.weeks += floor(ts.days / DAYS_PER_WEEK);
      ts.days %= DAYS_PER_WEEK;
    }
  } else if (ts.months) {
    count++;
  }

  if (!(units & WEEKS) || count >= max) {
    // ripple weeks down to days
    ts.days += ts.weeks * DAYS_PER_WEEK;
    removeUnit(ts, "weeks");
  } else if (ts.weeks) {
    count++;
  }

  if (!(units & DAYS) || count >= max) {
    // ripple days down to hours
    ts.hours += ts.days * HOURS_PER_DAY;
    removeUnit(ts, "days");
  } else if (ts.days) {
    count++;
  }

  if (!(units & HOURS) || count >= max) {
    // ripple hours down to minutes
    ts.minutes += ts.hours * MINUTES_PER_HOUR;
    removeUnit(ts, "hours");
  } else if (ts.hours) {
    count++;
  }

  if (!(units & MINUTES) || count >= max) {
    // ripple minutes down to seconds
    ts.seconds += ts.minutes * SECONDS_PER_MINUTE;
    removeUnit(ts, "minutes");
  } else if (ts.minutes) {
    count++;
  }

  if (!(units & SECONDS) || count >= max) {
    // ripple seconds down to milliseconds
    ts.milliseconds += ts.seconds * MILLISECONDS_PER_SECOND;
    removeUnit(ts, "seconds");
  } else if (ts.seconds) {
    count++;
  }

  // nothing to ripple milliseconds down to
  // so ripple back up to smallest existing unit as a fractional value
  if (!(units & MILLISECONDS) || count >= max) {
    fractional(ts, digits);
  }
}

/**
 * Populates the Timespan object
 */
function populate(
  ts: Timespan,
  startDate: Date | null,
  endDate: Date | null,
  units: number,
  max: number,
  digits: number,
): Timespan {
  const now = new Date();

  let start = startDate || now;
  let end = endDate || now;
  ts.start = start;
  ts.end = end;
  ts.units = units;

  ts.value = end.getTime() - start.getTime();
  if (ts.value < 0) {
    // swap if reversed
    const tmp = end;
    end = start;
    start = tmp;
  }

  // reference month for determining days in month
  ts.refMonth = new Date(start.getFullYear(), start.getMonth(), 15, 12, 0, 0);
  try {
    // reset to initial deltas
    ts.millennia = 0;
    ts.centuries = 0;
    ts.decades = 0;
    ts.years = end.getFullYear() - start.getFullYear();
    ts.months = end.getMonth() - start.getMonth();
    ts.weeks = 0;
    ts.days = end.getDate() - start.getDate();
    ts.hours = end.getHours() - start.getHours();
    ts.minutes = end.getMinutes() - start.getMinutes();
    ts.seconds = end.getSeconds() - start.getSeconds();
    ts.milliseconds = end.getMilliseconds() - start.getMilliseconds();

    ripple(ts);
    pruneUnits(ts, units, max, digits);
  } finally {
    delete ts.refMonth;
  }

  return ts;
}

/**
 * Determine an appropriate refresh rate based upon units
 *
 * @return milliseconds to delay
 */
function getDelay(units: number): number {
  if (units & MILLISECONDS) {
    // refresh very quickly
    return MILLISECONDS_PER_SECOND / 30; // 30Hz
  }

  if (units & SECONDS) {
    // refresh every second
    return MILLISECONDS_PER_SECOND; // 1Hz
  }

  if (units & MINUTES) {
    // refresh every minute
    return MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;
  }

  if (units & HOURS) {
    // refresh hourly
    return MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
  }

  if (units & DAYS) {
    // refresh daily
    return (
      MILLISECONDS_PER_SECOND *
      SECONDS_PER_MINUTE *
      MINUTES_PER_HOUR *
      HOURS_PER_DAY
    );
  }

  // refresh the rest weekly
  return (
    MILLISECONDS_PER_SECOND *
    SECONDS_PER_MINUTE *
    MINUTES_PER_HOUR *
    HOURS_PER_DAY *
    DAYS_PER_WEEK
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * API entry point
 *
 * @param start the starting date (or a callback, to start a timer)
 * @param end the ending date (or a callback, to start a timer)
 * @param units the units to populate
 * @param max number of labels to output
 * @param digits max number of decimal digits to output
 */
function countdownImpl(
  start: DateLike | CountdownCallback,
  end?: DateLike | CountdownCallback,
  units?: number,
  max?: number,
  digits?: number,
): Timespan | TimerId {
  let callback: CountdownCallback | undefined;

  // ensure some units or use defaults
  const unitMask = +(units as number) || DEFAULTS;
  // max must be positive
  const maxLabels = (max as number) > 0 ? (max as number) : NaN;
  // clamp digits to an integer between [0, 20]
  const maxDigits =
    (digits as number) > 0
      ? (digits as number) < 20
        ? Math.round(digits as number)
        : 20
      : 0;

  // ensure start date
  let startTS: Timespan | null = null;
  let startDate: Date | null;
  if (typeof start === "function") {
    callback = start;
    startDate = null;
  } else if (start instanceof Date) {
    startDate = start;
  } else if (start !== null && isFinite(start as number)) {
    startDate = new Date(+(start as number));
  } else {
    if (typeof start === "object") {
      startTS = start as Timespan | null;
    }
    startDate = null;
  }

  // ensure end date
  let endTS: Timespan | null = null;
  let endDate: Date | null;
  if (typeof end === "function") {
    callback = end;
    endDate = null;
  } else if (end instanceof Date) {
    endDate = end;
  } else if (end !== null && end !== undefined && isFinite(end as number)) {
    endDate = new Date(+(end as number));
  } else {
    if (typeof end === "object") {
      endTS = end as Timespan | null;
    }
    endDate = null;
  }

  // must wait to interpret timespans until after resolving dates
  if (startTS) {
    startDate = addToDate(startTS, endDate);
  }
  if (endTS) {
    endDate = addToDate(endTS, startDate);
  }

  if (!startDate && !endDate) {
    // used for unit testing
    return new Timespan();
  }

  if (!callback) {
    return populate(
      new Timespan(),
      startDate,
      endDate,
      unitMask,
      maxLabels,
      maxDigits,
    );
  }

  // base delay off units
  const cb = callback;
  const delay = getDelay(unitMask);
  let timerId: TimerId;
  const fn = (): void => {
    cb(
      populate(
        new Timespan(),
        startDate,
        endDate,
        unitMask,
        maxLabels,
        maxDigits,
      ),
      timerId,
    );
  };

  // `timerId` is assigned after the first synchronous call, as in the original
  fn();
  return (timerId = setInterval(fn, delay));
}

interface CountdownFn {
  (
    start: CountdownCallback,
    end?: DateLike,
    units?: number,
    max?: number,
    digits?: number,
  ): TimerId;
  (
    start: DateLike,
    end: CountdownCallback,
    units?: number,
    max?: number,
    digits?: number,
  ): TimerId;
  (
    start: DateLike,
    end?: DateLike,
    units?: number,
    max?: number,
    digits?: number,
  ): Timespan;
}

/**
 * Customize the format settings.
 */
function setFormat(format?: Format): void {
  if (!format) {
    return;
  }

  if ("singular" in format || "plural" in format) {
    let singular: string | string[] = format.singular || [];
    if (typeof singular === "string") {
      singular = singular.split("|");
    }
    let plural: string | string[] = format.plural || [];
    if (typeof plural === "string") {
      plural = plural.split("|");
    }

    for (let i = LABEL_MILLISECONDS; i <= LABEL_MILLENNIA; i++) {
      // override any specified units
      LABELS_SINGLUAR[i] = singular[i] || LABELS_SINGLUAR[i];
      LABELS_PLURAL[i] = plural[i] || LABELS_PLURAL[i];
    }
  }

  if (typeof format.last === "string") {
    LABEL_LAST = format.last;
  }
  if (typeof format.delim === "string") {
    LABEL_DELIM = format.delim;
  }
  if (typeof format.empty === "string") {
    LABEL_NOW = format.empty;
  }
  if (typeof format.formatNumber === "function") {
    formatNumber = format.formatNumber;
  }
  if (typeof format.formatter === "function") {
    formatter = format.formatter;
  }
}

/**
 * Revert to the default formatting.
 */
function resetFormat(): void {
  LABELS_SINGLUAR =
    " millisecond| second| minute| hour| day| week| month| year| decade| century| millennium".split(
      "|",
    );
  LABELS_PLURAL =
    " milliseconds| seconds| minutes| hours| days| weeks| months| years| decades| centuries| millennia".split(
      "|",
    );
  LABEL_LAST = " and ";
  LABEL_DELIM = ", ";
  LABEL_NOW = "";
  formatNumber = (value: number) => value;
  formatter = plurality;
}

/**
 * Override the unit labels.
 * @deprecated since version 2.6.0
 */
function setLabels(
  singular?: string | string[],
  plural?: string | string[],
  last?: string,
  delim?: string,
  empty?: string,
  formatNumber?: (value: number) => string | number,
  formatter?: (value: number, unit: number) => string,
): void {
  setFormat({
    singular,
    plural,
    last,
    delim,
    empty,
    formatNumber,
    formatter,
  });
}

resetFormat();

const countdown: CountdownFn & {
  MILLISECONDS: number;
  SECONDS: number;
  MINUTES: number;
  HOURS: number;
  DAYS: number;
  WEEKS: number;
  MONTHS: number;
  YEARS: number;
  DECADES: number;
  CENTURIES: number;
  MILLENNIA: number;
  DEFAULTS: number;
  ALL: number;
  setFormat: typeof setFormat;
  resetFormat: typeof resetFormat;
  /** @deprecated since version 2.6.0 */
  setLabels: typeof setLabels;
  /** @deprecated since version 2.6.0 */
  resetLabels: typeof resetFormat;
} = Object.assign(countdownImpl as CountdownFn, {
  MILLISECONDS,
  SECONDS,
  MINUTES,
  HOURS,
  DAYS,
  WEEKS,
  MONTHS,
  YEARS,
  DECADES,
  CENTURIES,
  MILLENNIA,
  DEFAULTS,
  ALL:
    MILLENNIA |
    CENTURIES |
    DECADES |
    YEARS |
    MONTHS |
    WEEKS |
    DAYS |
    HOURS |
    MINUTES |
    SECONDS |
    MILLISECONDS,
  setFormat,
  resetFormat,
  setLabels,
  resetLabels: resetFormat,
});

export default countdown;
