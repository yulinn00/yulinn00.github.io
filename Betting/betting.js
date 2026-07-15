
class Round {
    constructor(color_dict, money = 0) {
	this.colors = Object.fromEntries(Object.entries(color_dict));
	this.money = money;
	this.reset();
    }

    reset() {
	this.color_dealt = '';
	this.color_bet = '';
	this.wager = 0;
    }
}

binom = [[1]]
function comb(n, k) {
    const j = n - k;
    if (j < 0 || k < 0)
	return 0;
    if (binom.length > j) {
	if (binom[j].length <= k) {
	    for (var x = binom[j].length; x <= k; x++) {
		binom[j].push(comb(j + x - 1, x - 1) + comb(j + x - 1, x));
	    }
	}
    } else {
	for (var x = binom.length; x <= j; x++) {
	    binom.push([1]);
	    for (var y = binom[x].length; y <= k; y++) {
		binom[x].push(comb(x + y - 1, y - 1) + comb(x + y - 1, y));
	    }
	}
    }
    return binom[j][k];

}

class BettingOnColorGame {
    constructor() {
    }

    num_cards() {
	var c = 0;
	Object.entries(this.colors).forEach((v) => c += v[1]);
	return c
    }

    initialize_first_round(color_dict, bankroll) {
	this.colors = Object.fromEntries(Object.entries(color_dict));
	this.money = bankroll;

	this.round_history = [new Round(this.colors, this.money)];
	this.num_rounds = 0;
	Object.entries(this.colors).forEach((v) => this.num_rounds += v[1]);

	this.round = 1;
	this.state = 'betting';
    }

    bet(color_wager) {
	const color_bet = color_wager[0];
	const wager = color_wager[1];
	if (!(this.allowed_bet_colors.includes(color_bet) && 0 <= wager && wager <= this.money)) {
	    return false;
	}
	this.color_bet = color_bet.toLowerCase();
	this.wager = wager;
	this.state = 'dealing';
	return true;
    }

    deal(color_dealt) {
	this.color_dealt = color_dealt.toLowerCase();
	this.state = 'settling';
    }

    settle() {
	this.colors[this.color_dealt] -= 1;
	var winner;
	if (this.money_type == 'Rational'){
	    this.money = this.money.add(this.wager.multiply(this.color_bet == this.color_dealt ? new Rational(1) : new Rational(-1)));
	    winner = this.wager.eq(new Rational(0)) ? '' : (this.color_bet == this.color_dealt ? 'bettor' : 'dealer');
	} else {
	    this.money += this.wager * (this.color_bet == this.color_dealt ? 1 : -1);
	    winner = this.wager == 0 ? '' : (this.color_bet == this.color_dealt ? 'bettor' : 'dealer');
	}

	const ri = new Round(this.colors, this.money);
	ri.color_dealt = this.color_dealt;
	ri.color_bet = this. color_bet;
	ri.wager = this.wager;
	ri.winner = winner;

	this.round_history.push(ri);
	this.state = this.round < this.num_rounds ? 'settled' : 'done';
    }

    initialize_next_round() {
	if (this.state == 'done') {
	    return;
	}
	this.round += 1;
	this.state = 'betting';
    }

    undo() {
	if (this.round == 0 || (this.state == 'betting' && this.round == 1))
	    return;
	if (['betting', 'done', 'settled'].includes(this.state)) {
	    if (this.state == 'betting')
		this.round -= 1;
	    const ri = this.round_history.pop();
	    this.color_dealt = ri.color_dealt;
	    this.color_bet = ri.color_bet;
	    this.wager = ri.wager;
	    this.money = this.round_history[this.round - 1].money;
	}
	if (['betting', 'done', 'settled', 'settling'].includes(this.state))
	    this.colors[this.color_dealt] += 1;
	//if (!['betting', 'done', 'settled', 'settling', 'dealing'].includes(this.state))
	this.state = 'betting';
    }

    calculate_bet() {
	return this.calculate_eq_bet(this.num_cards(), this.colors['red'], this.money);
    }

    calculate_color_dealt() {
	return this.calculate_eq_color_dealt();
    }

    calculate_eq() {
        return this.calculate_eq_value(this.num_cards(), this.colors['red'], this.money);
    }
}



class BettingOnRedGame extends BettingOnColorGame {
    constructor() {
	super();
	this.allowed_bet_colors = ['red'];
    }
}

class RationalBettingOnRedGame extends BettingOnRedGame {
    constructor() {
	super();
	this.money_type = "Rational";
    }

    // N = number of cards, k = number of red cards, m = bankroll (Rational)
    // return tuple 0: color of bet, 
    calculate_eq_bet(N, k, m) {
	var b;
	if (k == 0)
	    b = new Rational(0);
	else if (k == N)
	    b = this.calculate_min_start(N - 1, k - 1).divide(new Rational(2));
	else
	    b = this.calculate_min_start(N - 1, k - 1).subtract(this.calculate_min_start(N - 1, k)).divide(new Rational(2));
	return ['red', m.multiply(b.divide(this.calculate_min_start(N, k)))];
    }

    calculate_eq_color_dealt() {
	if (this.colors['red'] == 0)
	    return ['black'];
	if (this.colors['black'] == 0)
	    return ['red'];
	const b_optimal = this.calculate_bet()[1];
	if (b_optimal.lt(this.wager))
	    return ['black'];
	if (this.wager.lt(b_optimal))
	    return ['red'];
	return ['red', 'black'];
    }

    calculate_min_start(n, k) {
	if (k == 0)
	    return new Rational(1);
	if (k == n)
	    return new Rational(1, 2 ** n);
	var s = new Rational(1);
	for (var i = 0; i < k; i++)
	    s = s.subtract(new Rational(comb(n, i), 2 ** n));
	return s;
    }

    compute_min_start(n,k) {
        if (k == 0)
            return new Rational(1);
        if (k == n)
            return new Rational(1, 2 ** n);
        return this.compute_min_start(n - 1, k - 1).add(this.compute_min_start(n - 1, k)).divide(new Rational(2));
    }

    calculate_eq_value(n, k, m) {
	return m.divide(this.calculate_min_start(n, k));
    }
}
    
class IntegerBettingOnRedGame extends RationalBettingOnRedGame {
    constructor() {
	super();
	this.money_type = "Integer";
    }

    calculate_eq_bet(n, k, m) {
        const optimal = super.calculate_eq_bet(n, k, new Rational(m));
        const optimal_b = optimal[1];
        if (optimal_b.denominator == 1)
            return ['red', optimal_b.numerator];

        const b_floor = optimal_b.floor();
        const b_ceil = optimal_b.ceil();

        var m_loss = m - b_ceil;
        var m_win = m + b_ceil;

        const eq_ceil = Math.min(this.calculate_eq_value(n - 1 ,k, m_loss),
				 this.calculate_eq_value(n - 1, k - 1, m_win));

        m_win = m + b_floor;
        m_loss = m - b_floor;

        const eq_floor = Math.min(this.calculate_eq_value(n - 1, k, m_loss),
				  this.calculate_eq_value(n - 1, k - 1, m_win));

        return [optimal[0], eq_ceil < eq_floor ? b_floor : b_ceil];
    }

    calculate_eq_color_dealt() {
	if (this.colors['red'] == 0)
	    return ['black'];
	if (this.colors['black'] == 0)
	    return ['red'];
        const optimal = super.calculate_eq_bet(this.num_cards(), this.colors['red'], new Rational(this.money));
	const wager = new Rational(this.wager);
	if (optimal[1].lt(wager))
	    return ['black'];
	if (wager.lt(optimal[1]))
	    return ['red'];
	return ['red', 'black'];
    }

    // returns a Number (integer) not a Rational
    // Assumes m in integer not Rational
    calculate_eq_value(n, k, m) {
        if (k == 0)
            return m;
        if (k == n)
            return m * 2 ** n;

        const optimal = super.calculate_eq_bet(n, k, new Rational(m));
        const optimal_b = optimal[1];
	
        if (optimal_b.denominator == 1)
            return Math.min(this.calculate_eq_value(n - 1, k - (optimal[0]=='black' ? 1 : 0), m - optimal_b.numerator),
			    this.calculate_eq_value(n - 1, k - (optimal[0]=='red' ? 1 : 0), m + optimal_b.numerator));
	
	const b_floor = optimal_b.floor();
	const b_ceil = optimal_b.ceil();

	var m_win = m + b_ceil;
        var m_loss = m - b_ceil;

	const eq_ceil = Math.min(this.calculate_eq_value(n - 1, k - (optimal[0]=='black' ? 1 : 0), m_loss),
				 this.calculate_eq_value(n - 1, k - (optimal[0]=='red' ? 1 : 0), m_win));

        m_win = m + b_floor;
        m_loss = m - b_floor;

        const eq_floor = Math.min(this.calculate_eq_value(n - 1, k - (optimal[0]=='black' ? 1 : 0), m_loss),
				  this.calculate_eq_value(n - 1, k - (optimal[0]=='red' ? 1 : 0), m_win));

        return Math.max(eq_floor, eq_ceil);
    }

}


class BettingOnRedOrBlackGame extends BettingOnColorGame {
    constructor() {
	super();
	this.allowed_bet_colors = ['red', 'black'];
    }
}

class RationalBettingOnRedOrBlackGame extends BettingOnRedOrBlackGame {
    constructor() {
	super();
	this.money_type = "Rational";
    }

    // N = number of cards, k = number of red cards, m = bankroll (Rational)
    // return tuple 0: color of bet, 
    calculate_eq_bet(N, k, m) {
	var b;
	if (k == 0)
	    b = this.calculate_min_start(N - 1, 0).divide(new Rational(-2));
	else if (k == N)
	    b = this.calculate_min_start(N - 1, N - 1).divide(new Rational(2));
	else
	    b = this.calculate_min_start(N - 1, k - 1).subtract(this.calculate_min_start(N - 1, k)).divide(new Rational(2));
	return [b.numerator >= 0 ? 'red' : 'black', m.multiply(b.divide(this.calculate_min_start(N, k))).abs()];
    }

    calculate_eq_color_dealt() {
	if (this.colors['red'] == 0)
	    return ['black'];
	if (this.colors['black'] == 0)
	    return ['red'];
	const b = this.calculate_bet();
	const b_optimal = b[1];
	if (b_optimal.lt(this.wager))
	    return [b[0] == 'red' ?  'black' : 'red'];
	if (this.wager.lt(b_optimal))
	    return [b[0] == 'red' ? 'red' : 'black'];
	return ['red', 'black'];
    }

    calculate_min_start(n, k) {
	return new Rational(comb(n, k), 2 ** n);
    }

    compute_min_start(n, k) {
        if (k == 0)
            return new Rational(1, 2 ** n);
        if (k == n)
            return new Rational(1, 2 ** n);
        return this.compute_min_start(n - 1, k - 1).add(this.compute_min_start(n - 1, k)).divide(new Rational(2));
    }

    calculate_eq_value(n, k, m) {
	return m.divide(this.calculate_min_start(n, k));
    }
}
    
class IntegerBettingOnRedOrBlackGame extends RationalBettingOnRedOrBlackGame {
    constructor() {
	super();
	this.money_type = "Integer";
    }

    // N = number of cards, k = number of red cards, m = bankroll (Rational)
    // return tuple 0: color of bet, 
    calculate_eq_bet(n, k, m) {
        const optimal = super.calculate_eq_bet(n, k, new Rational(m));
        const optimal_b = optimal[1];
        if (optimal_b.denominator == 1)
            return [optimal[0], optimal_b.numerator];

        const b_floor = optimal_b.floor();
        const b_ceil = optimal_b.ceil();

        var m_loss = m - b_ceil;
        var m_win = m + b_ceil;

        const eq_ceil = Math.min(this.calculate_eq_value(n - 1 ,k - (optimal[0] == 'black' ? 1 : 0), m_loss),
				 this.calculate_eq_value(n - 1, k - (optimal[0] == 'red' ? 1 : 0), m_win));

        m_win = m + b_floor;
        m_loss = m - b_floor;

        const eq_floor = Math.min(this.calculate_eq_value(n - 1, k - (optimal[0] == 'black' ? 1 : 0), m_loss),
				  this.calculate_eq_value(n - 1, k - (optimal[0] == 'red' ? 1 : 0), m_win));

        return [optimal[0], eq_ceil < eq_floor ? b_floor : b_ceil]
    }

    calculate_eq_color_dealt() {
	if (this.colors['red'] == 0)
	    return ['black'];
	if (this.colors['black'] == 0)
	    return ['red'];
        const b = super.calculate_eq_bet(this.num_cards(), this.colors['red'], new Rational(this.money));
	const b_optimal = b[1];
	const wager = new Rational(this.wager);
	if (b_optimal.lt(wager))
	    return [b[0] == 'red' ?  'black' : 'red'];
	if (wager.lt(b_optimal))
	    return [b[0] == 'red' ? 'red' : 'black'];
	return ['red', 'black'];
    }

    // returns a Number (integer) not a Rational
    // Assumes m in integer not Rational
    calculate_eq_value(n, k, m) {
        if (k == 0 || k == n)
            return m * 2 ** n;

        const optimal = super.calculate_eq_bet(n, k, new Rational(m));
        const optimal_b = optimal[1];
	
        if (optimal_b.denominator == 1)
            return Math.min(this.calculate_eq_value(n - 1, k - (optimal[0] == 'black' ? 1 : 0), m - optimal_b.numerator),
			    this.calculate_eq_value(n - 1, k - (optimal[0] == 'red' ? 1 : 0), m + optimal_b.numerator));
	
	const b_floor = optimal_b.floor();
	const b_ceil = optimal_b.ceil();

	var m_win = m + b_ceil;
        var m_loss = m - b_ceil;

	const eq_ceil = Math.min(this.calculate_eq_value(n - 1, k - (optimal[0] == 'black' ? 1 : 0), m_loss),
				 this.calculate_eq_value(n - 1, k - (optimal[0] == 'red' ? 1 : 0), m_win));

        m_win = m + b_floor;
        m_loss = m - b_floor;

        const eq_floor = Math.min(this.calculate_eq_value(n - 1, k - (optimal[0] == 'black' ? 1 : 0), m_loss),
				  this.calculate_eq_value(n - 1, k - (optimal[0] == 'red' ? 1 : 0), m_win));

        return Math.max(eq_floor, eq_ceil);
    }

}

