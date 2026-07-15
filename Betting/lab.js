

function onApply() {
    const fractional = !document.getElementById("integerunits").checked;
    const num_cards = parseInt(document.getElementById("numcards").value);
    const num_red = parseInt(document.getElementById("numred").value);
    const bet_red_or_black = document.getElementById("betredorblack").checked;
    if (fractional)
	bettor_money = Rational.fromString(document.getElementById("bankroll").value);
    else
	bettor_money = parseInt(document.getElementById("bankroll").value);

    if (!configure_game({fractional: fractional, bet_red_or_black: bet_red_or_black, num_cards: num_cards, num_red: num_red, bettor_money: bettor_money}))
	return;

    const bettor = document.getElementById("bettor").value;
    const dealer = document.getElementById("dealer").value;

    configure_players({bettor: bettor, dealer: dealer});

    configure_info({recommend_equilibrium: true, show_equilibrium: true});

    undo_enabled = true;

    play();
}

