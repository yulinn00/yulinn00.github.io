var fractional;
var bet_red_or_black;
var num_cards;
var num_red;
var bettor_money;

var game;
var game_state;
var card_colors;
var selected_card_id;
var selected_cards;
var deck = [];

const bettor_default = 'human';
const dealer_default = 'random';
var bettor = bettor_default; // 'human', 'equilibrium', 'expert', 'beginner'
var dealer = dealer_default; // 'human', 'shuffle', 'equilibrium, 'expert', 'beginner'

var recommend_equilibrium = false;
var show_equilibrium = true;
var undo_enabled = false;
var set_focus = true;

var max_display_cards = 10;

const card_w = 90;
const card_h = 130;
const card_t = 12;
const card_l = 3;

const RED_SUITS=['hearts','diamonds'];
const BLACK_SUITS=['spades','clubs'];
const RANK_NUMS = Array.from({ length: 9 }, (_, i) => i+2);
const RANK_HONORS = ['jack', 'queen', 'king'];

const RED_CARD_NAMES=[];
const BLACK_CARD_NAMES=[];
for (var r of RANK_NUMS) {
    for (var s of RED_SUITS) {
	RED_CARD_NAMES.push(r + '_of_' + s + '.png');
    }
    for (var s of BLACK_SUITS) {
	BLACK_CARD_NAMES.push(r + '_of_' + s + '.png');
    }
}
for (var s of RED_SUITS) {
    RED_CARD_NAMES.push('ace_of_' + s + '.png');
}
for (var s of BLACK_SUITS) {
    BLACK_CARD_NAMES.push('ace_of_' + s + '.png');
}
for (var r of RANK_HONORS) {
    for (var s of RED_SUITS) {
	RED_CARD_NAMES.push(r + '_of_' + s + '2.png');
    }
    for (var s of BLACK_SUITS) {
	BLACK_CARD_NAMES.push(r + '_of_' + s + '2.png');
    }
}

var listeners_configured = false;


function configure_game(config) {

    const width = document.getElementById("board").clientWidth
    const max_cards = Math.floor(width / (card_w + 2 * card_l));

    if (config.num_cards === NaN || config.num_cards <= 0 || config.num_cards > max_cards) {
	alert(`The number of cards must be a positive integer less than ${max_cards+1}`);
	return false;
    }
    if (config.num_red === NaN || config.num_red < 0 || config.num_red > config.num_cards) {
	alert('The number of red cards must be an integer between 0 and the number of cards, inclusive');
	return false;
    }

    if (config.bettor_money === NaN
	|| (!config.fractional && (config.bettor_money != Math.floor(config.bettor_money) ||  config.bettor_money <= 0))
	|| (config.fractional && !(new Rational(0)).lt(config.bettor_money))) {
	alert(`Bettor's starting units must be a positive ${fractional ? 'whole number, mixed number, or fraction' : 'integer'}`);
	return false;
    }

    fractional = config.fractional;
    bet_red_or_black = config.bet_red_or_black;
    num_cards = config.num_cards;
    num_red = config.num_red;
    bettor_money = config.bettor_money;
    max_display_cards = max_cards;

    game = bet_red_or_black
	? (fractional ? new RationalBettingOnRedOrBlackGame() : new IntegerBettingOnRedOrBlackGame())
	: (fractional ? new RationalBettingOnRedGame() : new IntegerBettingOnRedGame());

    if (!listeners_configured) {
	document.getElementById("wager").addEventListener('keyup', (event) => {
	    if (game_state == 'betting' && event.key === 'Enter') {
		console.log('onOK in wager handler');
		onOK();
	    }
	});
	listeners_configured = true;
    }

    return true;
}

function clear_cards() {
    for (var i = 0; i < game.num_rounds; i++) {
	const cd = document.getElementById('card' + i);
	if (cd == null)
	    continue;
	cd.removeEventListener('pointerenter', on_card_enter);
	cd.removeEventListener('pointerleave', on_card_leave);
	cd.removeEventListener('pointerdown', on_card_click);
	cd.removeEventListener('touchdown', on_touch);
    }
}

function configure_players(players_config)
{
    bettor = players_config.bettor;
    dealer = players_config.dealer;
}

function configure_info(info_config) {
    recommend_equilibrium = info_config.recommend_equilibrium;
    show_equilibrium = info_config.show_equilibrium;
}

function shuffle(cards) {
     for (var i = 0; i < cards.length; i++) {
	const j = Math.floor(Math.random()*(cards.length - i));
	const t = cards[i];
	cards.splice(i,1,cards[j]);
	cards.splice(j,1,t)
    }
}


function pause(ms) {
    return new Promise((resolve) => {
	setTimeout(() => {
	    resolve();
	}, ms);
    });
}


async function play() {
    set_state('initializing');
    game.initialize_first_round({ 'red': num_red, 'black': num_cards - num_red}, bettor_money);

    set_status('');
    set_action('');

    document.getElementById("ok").style.visibility = 'hidden';
    const u = document.getElementById("undo");
    if (u !== null)
	u.style.visibility = 'hidden';

    card_colors = Array.from({length: num_cards},(_,i) => i < num_red ? 'red' : 'black');

    shuffle(card_colors);

    reds = Array.from({ length: 26 }, (_, i) => i);
    blacks= Array.from({ length: 26 }, (_, i) => i);
    shuffle(reds);
    shuffle(blacks);

    selected_card_id = -1;
    selected_cards = [];

    clear_cards();
    const board = document.getElementById("board");
    board.innerHTML = '';

    // cards are 90 x 130
    for (var i = 0; i < game.num_rounds; i++) {
	const cd = document.createElement('div');
	cd.className = 'card';
	cd.id = 'card' + i;
	
	cd.style.backgroundImage = dealer == 'shuffle' ? `url('card-images/back.png')`
	    : `url('card-images/${card_colors[i] == 'red' ? RED_CARD_NAMES[reds[i]] : BLACK_CARD_NAMES[blacks[i]]}')`;
	board.appendChild(cd);
	cd.style.position = 'absolute';
	cd.style.top = `${card_t}px`;
	cd.style.left = `${card_l+(max_display_cards-num_cards)*(card_l+card_w/2) + i * (2*card_l+card_w)}px`;

	cd.addEventListener('pointerenter', on_card_enter, {passive: false});
	cd.addEventListener('pointerleave', on_card_leave, {passive: false});
	cd.addEventListener('pointerdown', on_card_click, {passive: false});
	cd.addEventListener('touchdown', on_touch, {passive: false});

	await pause(200);
    }

    set_state('betting');

    if (bettor != 'human') {
	// compute first bet
	onOK();
    }
}

function set_status(message) {
    document.getElementById("status").innerHTML = message;
}

function set_action(message) {
    document.getElementById("action").innerHTML = message;
}

function money_str(amount) {
    return fractional ? amount.toString(true) : amount.toString();
}

function is_zero(value) {
    return fractional ? value.numerator == 0 : value == 0;
}
	
function set_state(new_state) {
    var line1;
    var line2;
    game_state = new_state;

    switch (new_state) {
    case 'initializing':
	set_status("Setting up...");
	set_action("");
	update_undo_button();

	document.getElementById("red").checked = true;
	document.getElementById("red").style.visibility = 'hidden';
	document.getElementById("betred").style.visibility = 'hidden';
	document.getElementById("black").style.visibility = 'hidden';
	document.getElementById("betblack").style.visibility = 'hidden';
	document.getElementById("wager").value = "0";
	document.getElementById("wager").style.visibility = 'hidden';
	document.getElementById("wagerlabel").style.visibility = 'hidden';

	var b = document.getElementById("ok");
	b.disabled = true;
	b.style.visibility = 'hidden';
	break;

    case 'betting':
	if (selected_card_id != -1) {
	    document.getElementById("card"+selected_card_id).style.visibility = 'hidden';
	    selected_card_id = -1;
	}

	set_status(`Round ${game.round}: Bettor has ${money_str(game.money)} units. Cards: ${game.colors['red']} red, ${game.colors['black']} black.`);
	if (recommend_equilibrium) {
	    bet = game.calculate_bet();
	    set_action(`Bettor, enter your bet (equilibrium: ${money_str(bet[1])} on ${bet[0]}).`);
	} else {
	    set_action('Bettor, enter your bet.');
	}
	update_undo_button();

	document.getElementById("red").disabled = !game.allowed_bet_colors.includes('red');
	document.getElementById("red").style.visibility = game.allowed_bet_colors.includes('red') ? 'visible' : 'hidden';
	document.getElementById("betred").style.visibility = game.allowed_bet_colors.includes('red') ? 'visible' : 'hidden';
	if (set_focus)
	    document.getElementById("red").focus();
	document.getElementById("black").disabled = !game.allowed_bet_colors.includes('black');
	document.getElementById("black").style.visibility = game.allowed_bet_colors.includes('black') ? 'visible' : 'hidden';
	document.getElementById("betblack").style.visibility = game.allowed_bet_colors.includes('black') ? 'visible' : 'hidden';
	document.getElementById("wager").disabled = false;
	document.getElementById("wager").style.visibility = 'visible';
	document.getElementById("wagerlabel").style.visibility = 'visible';

	b = document.getElementById("ok");
	b.textContent = 'Bet';
	b.disabled = false;
	b.style.visibility = 'visible';
	break;

    case 'dealing':
	var wager = game.wager;
	var bet = `betting ${money_str(wager)} on ${game.color_bet}`;
	bet = `${is_zero(wager) ? 'not betting' : bet}`;
	set_status(`Round ${game.round}: Bettor has ${money_str(game.money)} units and is ${bet}.`);
	if (recommend_equilibrium) {
	    const colors = game.calculate_color_dealt();
	    set_action(`Dealer, choose a card to play (equilibrium: ${colors.length == 1 ? colors[0] : colors.join(' or ')}).`);
	} else {
	    set_action('Dealer, choose a card to play.');
	}
	update_undo_button();

	document.getElementById("red").disabled = true;
	document.getElementById("black").disabled = true;
	document.getElementById("wager").disabled = true;

	b = document.getElementById("ok");
	b.disabled = true;
	b.style.visibility = 'hidden';
	break;

    case 'settled':
	card_colors[selected_card_id] = '';
	wager = game.round_history[game.round].wager;
	const placed_bet = fractional ? !wager.eq(new Rational(0)) : wager != 0;
	const outcome = game.round_history[game.round].color_dealt == game.round_history[game.round].color_bet ? 'wins' : 'loses';
	const bet_str = placed_bet ? `bet ${money_str(wager)} on ${game.round_history[game.round].color_bet}` : 'did not bet';
	line1 = `End of round ${game.round}: Bettor ${bet_str} and dealer played a ${game.round_history[game.round].color_dealt} card.`;
	line2 = `Bettor ${placed_bet ? outcome + ' and now' : 'still'} has ${money_str(game.money)} units.`;
	set_status(line1 + '<br>' + line2);

	if (game.round == game.num_rounds) {
	    set_action('Click Done to see game statistics');
	    
	} else {
	    set_action('Click Next Round to continue');
	}
	update_undo_button();

	b = document.getElementById("ok");
	b.textContent = game.round == game.num_rounds ? 'Done' : 'Next Round';
	b.disabled = false;
	b.style.visibility = 'visible';
	if (set_focus)
	    b.focus();
	break;

    case 'done':
	if (selected_card_id != -1) {
	    document.getElementById("card"+selected_card_id).style.visibility = 'hidden';
	    selected_card_id = -1;
	}

	const delta = fractional ? game.round_history[game.num_rounds].money.subtract(game.round_history[0].money) : game.round_history[game.num_rounds].money - game.round_history[0].money;
	const plussign = fractional ? (new Rational(0)).lt(delta) : delta > 0;

	const equilibrium = game.calculate_eq_value(num_cards, num_red, bettor_money);
	var wins = 0;
	var bets = 0;
	for (var i = 1; i <= game.num_rounds; i++) {
	    switch (game.round_history[i].winner) {
	    case 'bettor':
		wins++;
		// fall through
	    case 'dealer':
		bets++;
		break;
	    default:
		break;
	    }
	}
	line1 = `Game over: Bettor won ${wins} of ${bets} bets for ${plussign ? '+' : ''}${money_str(delta)} and finished with ${money_str(game.round_history[game.num_rounds].money)} units.`;
	const bettor_win = fractional ? equilibrium.lt(game.round_history[game.num_rounds].money) : equilibrium < game.round_history[game.num_rounds].money;
	const dealer_win = fractional ? game.round_history[game.num_rounds].money.lt(equilibrium) : game.round_history[game.num_rounds].money < equilibrium;
	if (bettor == 'human' && dealer == 'human') {
	    line2 = bettor_win ? 'Well done bettor!' : (dealer_win ? 'Well done dealer!' : 'Well done players!');
	} else if (bettor == 'human') {
	    line2 = !dealer_win ? 'Well done bettor!' : '';
	} else if (dealer == 'human') {
	    line2 = !bettor_win ? 'Well done dealer!' : '';
	} else {
	    line2 = '';
	}
	if (show_equilibrium) {
	    line2 += ` (equilibrium = ${money_str(equilibrium)})`;
	}
	
	set_status(line1 + '<br>' + line2);
	set_action('Click OK to play again.');
	update_undo_button();

	document.getElementById("red").style.visibility = 'hidden';
	document.getElementById("betred").style.visibility = 'hidden';
	document.getElementById("black").style.visibility = 'hidden';
	document.getElementById("betblack").style.visibility = 'hidden';
	document.getElementById("wager").style.visibility = 'hidden';
	document.getElementById("wagerlabel").style.visibility = 'hidden';

	b = document.getElementById("ok");
	b.textContent = 'OK';
	b.disabled = false;
	b.style.visibility = 'visible';
	if (set_focus)
	    b.focus();
	break;
    }

}

/**** sample

function onApply() {
    const fractional = !document.getElementById("integerunits").checked;
    const num_cards = parseInt(document.getElementById("numcards").value);
    const num_red = parseInt(document.getElementById("numred").value);
    const bet_red_or_black = document.getElementById("betredorblack").checked;
    var bettor_money;
    if (fractional)
	bettor_money = Rational.fromString(document.getElementById("bankroll").value);
    else
	bettor_money = parseInt(document.getElementById("bankroll").value);

    if (bettor_money === NaN || (!fractional && bettor_money != Math.floor(bettor_money)) ||  bettor_money < 0) {
	alert(`Bettor's starting units must be a positive ${fractional ? 'whole number, mixed number, or fraction' : 'integer'}`);
	return;
    }
    if ( parseInt(document.getElementById("numcards").value) < parseInt(document.getElementById("numred").value)) {
	alert('The number of red cards cannot exceed the number of cards');
	return;
    }

    configure_game({fractional: fractional, bet_red_or_black: bet_red_or_black, num_cards: num_cards, num_red: num_red, bettor_money: bettor_money});

    const bettor = document.getElementById("autobet").checked ? bettor_default : 'human';
    const dealer = document.getElementById("autodeal").checked ? dealer_default : 'human';

    configure_players({bettor: bettor, dealer: dealer});

    configure_info({recommend_equilibrium: true, show_equilibrium: true});

    play();
}
****/

function onOK() {
    while (true) {
	switch (game_state) {
	case 'betting':
	    var bet;
	    if (bettor != 'human') {
		bet = game.calculate_bet();
		bet = calculate_autobet(bet);
		document.querySelector(`input[name="betcolor"][value="${bet[0]}"]`).checked = true;
		document.getElementById("wager").value = money_str(bet[1]);
	    } else {
		bet = [document.querySelector('input[name="betcolor"]:checked').value,
		       get_wager()];
	    }
	    if (!game.bet(bet)) {
		alert(`Bet must be ${fractional ? 'a fraction or mixed number' : 'an integer'} between 0 and ${money_str(game.round_history[game.round - 1].money)}`);
		return;
	    }
	    set_state('dealing')
	    if (dealer != 'human')
		continue;
	    return;
	case 'dealing':
	    var color;
	    if (dealer != 'human') {
		var i;
		if (dealer == 'shuffle') {
		    i = game.round - 1;
		    color = card_colors[i];
		} else {
		    const colors = game.calculate_color_dealt();
		    color = calculate_autodeal(colors, game.calculate_bet());
		    i = Math.floor(Math.random() * card_colors.length);
		    while (card_colors[i] != color) {
			i = Math.floor(Math.random() * card_colors.length);
		    }
		}
		selected_card_id = i;
		select_card(document.getElementById("card"+selected_card_id));
		card_colors[selected_card_id] = '';
	    } else {
		if (selected_card_id == -1) {
		    alert("this shouldn't happen");
		    return;
		}
		color = card_colors[selected_card_id];
	    }
	    selected_cards.push(selected_card_id);
	    game.deal(color);
	    game.settle();
	    set_state('settled');
	    return;
	case 'settled':
	    if (game.round == game.num_rounds)
		set_state('done');
	    else {
		game.initialize_next_round();
		set_state('betting');
		if (bettor != 'human')
		    continue;
	    }
	    return;
	case 'done':
	    play();
	    return;
	default:
	    return;
	}
    }
}

function on_card_click(event) {
    event.preventDefault();
    if (game_state != 'dealing')
	return;
    const cd = event.target;
    selected_card_id = parseInt(cd.id.slice(4));
    select_card(cd);
    onOK();
}

function on_touch(event) {
    event.preventDefault();
}

function select_card(cd,select = true) {
    if (dealer == 'shuffle') {
	const id = parseInt(cd.id.slice(4));
	cd.style.backgroundImage = select ?`url('card-images/${card_colors[id] == 'red' ? RED_CARD_NAMES[reds[id]] : BLACK_CARD_NAMES[blacks[id]]}')`
	    : `url('card-images/back.png')`;
	cd.style.visibility = 'visible';
    } else {
	highlight_card(cd, false);
	cd.style.top = select ? `${card_t+18}px` : `${card_t}px`;
    }
}

function on_card_enter(event) {
    event.preventDefault();
    if (game_state != 'dealing')
	return;
    const cd = event.target;
    highlight_card(cd);
}

function highlight_card(cd, highlight = true) {
    const id = parseInt(cd.id.slice(4));
    if (highlight) {
	cd.style.border = '6px solid yellow'
	cd.style.top = `${card_t-6}px`;
	cd.style.left = `${card_l+(max_display_cards-num_cards)*(card_l+card_w/2)-6+id*(2*card_l+card_w)}px`;
    } else {
	cd.style.border = '0px';
	cd.style.top = `${card_t}px`;
	cd.style.left = `${card_l+(max_display_cards-num_cards)*(card_l+card_w/2)+id*(2*card_l+card_w)}px`;
    }
    cd.style.visibility = 'visible';
}

function on_card_leave(event) {
    event.preventDefault();
    if (game_state != 'dealing')
	return;
    const cd = event.target;
    highlight_card(cd, false);
}

function get_wager() {
    var wager = document.getElementById("wager").value;
    return  fractional ? Rational.fromString(wager) : parseInt(wager);
}

function onUndo(){
    if (!undo_enabled)
	return;
    var selected;
    var cd;
    if (game_state == 'settled') {
	selected = selected_cards.pop();
	cd = document.getElementById("card"+selected);
	select_card(cd, false);
	card_colors[selected] = game.round_history[game.round].color_dealt;
	selected_card_id = -1;
    }
    if (game_state == 'settled' || game_state == 'dealing') {
	document.getElementById(game.color_bet).checked = true;
	document.getElementById("wager").value = money_str(game.wager);
    }
    if (game_state == 'betting' ||
	(game_state == 'dealing' && bettor != 'human') ||
	(game_state == 'settled' && dealer != 'human' && bettor != 'human')) {
	selected = selected_cards.pop();
	cd = document.getElementById("card"+selected);
	select_card(cd, false);
	const round_info = game.round_history[game.round-1];
	card_colors[selected] = round_info.color_dealt;
	document.getElementById(round_info.color_bet).checked = true;
	document.getElementById("wager").value = money_str(round_info.wager);
    }
    game.undo();
    if (bettor != 'human' && (dealer != 'human' || game_state == 'dealing'))
	game.undo();
    set_state('betting');
    if (bettor == 'human')
	return;
    onOK();
}

function update_undo_button() {
    if (!undo_enabled)
	return;
    const undo = document.getElementById("undo");
    if (no_undo()) {
	undo.textContent = 'Undo';
	undo.style.visibility = 'hidden';
	return;
    }
    if (game_state == 'betting' ||
	(game_state == 'dealing' && bettor != 'human') ||
	(game_state == 'settled' && dealer != 'human' && bettor != 'human')) {
	undo.textContent = 'Undo last round';
	undo.style.visibility = 'visible';
	return;
    }
    if (game_state == 'dealing') {
	undo.textContent = 'Undo bet';
	undo.style.visibility = 'visible';
	return;
    }
    if (game_state == 'settled') {
	undo.textContent = 'Undo this round';
	undo.style.visibility = 'visible';
	return;
    }
    undo.textContent = 'Undo';
    undo.style.visibility = 'hidden';
}

function no_undo() {
    return undo_enabled &&
	(['initializing','done'].includes(game_state) ||
        (game.round==1 && (game_state == 'betting' ||
                           (game_state == 'dealing' && bettor != 'human') ||
                           (game_state == 'settled' &&  bettor != 'human' && dealer != 'human'))));

}

function calculate_autobet(bet) {
    var color;
    var amount;
    switch (bettor) {
    case 'equilibrium':
	return bet;
    case 'expert':
	color = bet[0];
	amount = bet[1];
	if (game.colors[color] == 0 || game.colors[color] == game.num_rounds - game.round)
	    break;
	var bmin;
	var bmax;
	if (fractional) {
	    bmin = amount.floor();
	    bmax = amount.ceil();
	} else {
	    bmin = amount;
	    bmax = amount;
	}
	const range = bmin == bmax ? [bmin] : [bmin, bmax];
	for (var i = 1; i  < 1 + bmin / 5; i++ ) {
	    range.push(bmin - i);
	    range.push(bmax + i);
	}
	amount = range[Math.floor(Math.random()*range.length)];
	if (amount < 0)
	{
	    color = color == 'red' ? 'black' : 'red';
	    amount = -amount;
	}
	if (fractional) {
	    amount = new Rational(amount);
	    if (game.round_history[game.round - 1].money.lt(amount)) {
		amount = game.round_history[game.round - 1].money;
	    }
	} else if (amount > game.round_history[game.round - 1].money) {
	    amount = game.round_history[game.round - 1].money;
	}
	break
    case 'beginner':
	color = bet[0];
	amount = bet[1];
	const mod_factor = game.num_rounds - game.round;;
	if (fractional) {
	    const delta = game.round_history[game.round - 1].money.
		  multiply(new Rational(mod_factor)).
		  divide(new Rational(game.num_rounds)).
		  divide(new Rational(5));
	    amount = amount.add(delta.multiply(new Rational(Math.random() < 0.5 ? -1 : 1)));
	    if (amount.lt(new Rational(0))) {
		if (bet_red_or_black) {
		    color = bet[0] == 'red' ? 'black' : 'red';
		    amount = amount.abs();
		} else {
		    amount = new Rational(0);
		}
	    }
	    if (game.round_history[game.round - 1].money.lt(amount)) {
		amount = game.round_history[game.round - 1].money;
	    }
	} else {
	    const delta = game.round_history[game.round - 1].money * mod_factor / game.num_rounds / 5;
	    amount += Math.random() < 0.5 ? -delta : delta;
	    amount = Math.round(amount);
	    if (amount < 0) {
		if (bet_red_or_black) {
		    color = bet[0] == 'red' ? 'black' : 'red';
		    amount = Math.abs(amount);
		} else {
		    amount = 0;
		}
	    }
	    if (amount > game.round_history[game.round - 1].money) {
		amount = game.round_history[game.round - 1].money;
	    }
	}
	break;
    }
    return [color, amount];
}

function calculate_autodeal(colors, bet) {
    var color;
    switch (dealer) {
    case 'equilibrium':
	color = colors.length == 1 ? colors[0] : colors[Math.random() < 0.5 ? 0 : 1];
	break;
    case 'expert':
	if ((fractional && game.wager.lt(bet[1])) || game.wager < bet[1]) {
	    color = b[0];
	} else {
	    color = bet[1] == 'red' ? 'black' : 'red';
	}
	break;       
    case 'beginner':
	if (colors.length == 2)
	    color = Math.random() < 0.5 ? colors[0] : colors[1];
	else {
	    const opposite = colors[0] == 'red' ? 'black' : 'red';
	    color = Math.random() < 0.7 + 0.25 * (game.round/game.num_rounds) ? colors[0] : opposite;
	}
	break;
    case 'shuffle':
	color = Math.random() < game.colors.red / (game.colors.black + game.colors.red) ? 'red' : 'black';
	break;
    }
    if (!card_colors.includes(color))
	color = color =='red' ? 'black' : 'red';
    return color;
}

