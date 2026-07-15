class Rational {
    // 1. Constructor initializes and normalizes the fraction
    constructor(numerator, denominator = 1) {
	if (denominator === 0) {
	    throw new RangeError("Denominator cannot be zero.");
	}

	this.numerator = Math.round(numerator);
	this.denominator = Math.round(denominator);
	this.#normalize();
    }

    // Helper method to find the Greatest Common Divisor
    #gcd(a, b) {
	return b === 0 ? Math.abs(a) : this.#gcd(b, a % b);
    }

    // 2. Normalizes signs and reduces the fraction to lowest terms
    #normalize() {
	const divisor = this.#gcd(this.numerator, this.denominator);
	this.numerator /= divisor;
	this.denominator /= divisor;

	// Ensure the denominator stays positive for standard form
	if (this.denominator < 0) {
	    this.numerator = -this.numerator;
	    this.denominator = -this.denominator;
	}
    }

    // 3. Mathematical Operations
    add(other) {
	const num = this.numerator * other.denominator + other.numerator * this.denominator;
	const denom = this.denominator * other.denominator;
	return new Rational(num, denom);
    }

    subtract(other) {
	const num = this.numerator * other.denominator - other.numerator * this.denominator;
	const denom = this.denominator * other.denominator;
	return new Rational(num, denom);
    }

    multiply(other) {
	const num = this.numerator * other.numerator;
	const denom = this.denominator * other.denominator;
	return new Rational(num, denom);
    }

    divide(other) {
	if (other.numerator === 0) {
	    throw new RangeError("Cannot divide by a rational zero.");
	}
	const num = this.numerator * other.denominator;
	const denom = this.denominator * other.numerator;
	return new Rational(num, denom);
    }

	// 4. Utility and Conversion Methods
    toString(mixed = false) {
	if (this.denominator === 1)
	    return `${this.numerator}`;
	if (mixed && Math.abs(this.numerator) > this.denominator) {
	    const i = Math.trunc(this.numerator / this.denominator);
	    const f = Math.abs(this.numerator % this.denominator);
	    return `${i} ${f}/${this.denominator}`;
	}
	return `${this.numerator}/${this.denominator}`;
    }

    ceil() {
	return this.denominator == 1 ? this.numerator : Math.ceil(this.valueOf());
    }

    floor() {
	return this.denominator == 1 ? this.numerator : Math.floor(this.valueOf());
    }

    valueOf() {
	return this.numerator / this.denominator;
    }

    eq(other) {
	return this.numerator === other.numerator && this.denominator === other.denominator;
    }

    lt(other) {
	return this.numerator * other.denominator < other.numerator * this.denominator;
    }

    abs() {
	return new Rational(Math.abs(this.numerator), this.denominator);
    }

    min(other) {
	return this.lt(other) ? this : other;
    }

    max(other) {
	return this.lt(other) ? other : this;
    }

    static fromString(str) {
	str = str.trim();
	const mixed_parts = str.match(/(?<sgn>-?)((?<w1>\d+)\s+(?<n1>\d+)[/](?<d1>\d+)|(?<n2>\d+)[/](?<d2>\d+)|(?<w3>\d+))/);
	const sgn = mixed_parts.groups.sgn == '-' ? -1 : 1;
	if (mixed_parts.groups.w1 !== undefined) {
	    return new Rational(sgn * parseInt(mixed_parts.groups.w1) * parseInt(mixed_parts.groups.d1) + parseInt(mixed_parts.groups.n1), parseInt(mixed_parts.groups.d1));
	}
	if (mixed_parts.groups.n2 !== undefined) {
	    return new Rational(sgn * parseInt(mixed_parts.groups.n2), parseInt(mixed_parts.groups.d2));
	}
	if (mixed_parts.groups.w3 !== undefined) {
	    return new Rational( sgn * parseInt(mixed_parts.groups.w3));
	}
	return NaN;
    }
}

