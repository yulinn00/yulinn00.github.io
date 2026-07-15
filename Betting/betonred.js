
function onApply() {
    const num_cards = parseInt(document.getElementById("numcards").value);
    const num_red = parseInt(document.getElementById("numred").value);
    const bet_red_or_black = document.getElementById("betredorblack").checked;
    bettor_money = Rational.fromString(document.getElementById("bankroll").value);

    if (!configure_game({fractional: true, bet_red_or_black: bet_red_or_black, num_cards: num_cards, num_red: num_red, bettor_money: bettor_money}))
	return;

    const bettor = document.getElementById("bettor").value;
    const dealer = document.getElementById("dealer").value;

    configure_players({bettor: bettor, dealer: dealer});

    configure_info({recommend_equilibrium: false, show_equilibrium: false});

    undo_enabled = false;

    play();
}

