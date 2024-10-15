function get(id,is_lent){
    lent_version=[ `Hála Néked, Istenünk, hála Néked %name0%!
Hála Néked, Istenünk, mert ő fontos nekünk!

Áldd meg, Uram, áldd Uram, áldd meg, Uram, áldd Uram,
Áldd meg, Uram, áldd Uram, mert ő fontos nekünk!

Pam-parararam pam pam param-param-pam-pam.`,
  `Köszönjük Néked, Urunk, %name0%, köszönjük Néked örökké
Ó, Urunk, mi nem hagyjuk el őt, és Veled daloljuk:

Yep ye-e-e-ep ye-e-e-ep ye-e-e-ep oh oh oh!
Yep ye-e-e-ep ye-e-e yep oh yep oh yep yep yep!

Pam-parararam (pam pam) param-param-pam-pam.`,
  `Jó Atyánk, köszönjük Néked %name0%,
Szívünkbe zártuk, hála érte!
Áldj meg minket, Krisztusunk,
A Lelked legyen közöttünk míg együtt vagyunk!

Ó, Urunk, mi egyet akarunk,
Kik ebben a dalban együtt vagyunk:
Szereteted fénye, áldása érje %name1%!
Legyen a Lelked véle!

Hála értük!
`]
    default_version=[
`Hála Néked, Istenünk, hála Néked %name0%!
Hála Néked, Istenünk, mert ő fontos nekünk!

Alleluja, áldd, Uram, alleluja, áldd, Uram,
Alleluja, áldd, Uram, mert ő fontos nekünk!

Pam-parararam pam pam param-param-pam-pam.`,
  `Köszönjük Néked, Urunk, %name0%, köszönjük Néked örökké
Ó, Urunk, mi nem hagyjuk el őt, és Veled daloljuk:

Yep ye-e-e-ep ye-e-e-ep ye-e-e-ep oh oh oh!
Yep ye-e-e-ep ye-e-e yep oh yep oh yep yep yep!

Pam-parararam (pam pam) param-param-pam-pam.`,
  `Jó Atyánk, köszönjük Néked %name0%,
Szívünkbe zártuk, hála érte!
Áldj meg minket, Krisztusunk,
A Lelked legyen közöttünk míg együtt vagyunk!

Ó, Urunk, mi egyet akarunk,
Kik ebben a dalban együtt vagyunk:
Szereteted fénye, áldása érje %name1%!
Legyen a Lelked véle!

Alleluja!
`
    ]
    if (is_lent){
	return lent_version[id]
    }else{
	return default_version[id]
    }
}


module.exports = {get}
  /*  [
`Hála Néked, Istenünk, hála Néked %name0%!
Hála Néked, Istenünk, mert ő fontos nekünk!

Alleluja, áldd, Uram, alleluja, áldd, Uram,
Alleluja, áldd, Uram, mert ő fontos nekünk!

Pam-parararam pam pam param-param-pam-pam.`,
  `Köszönjük Néked, Urunk, %name0%, köszönjük Néked örökké
Ó, Urunk, mi nem hagyjuk el őt, és Veled daloljuk:

Yep ye-e-e-ep ye-e-e-ep ye-e-e-ep oh oh oh!
Yep ye-e-e-ep ye-e-e yep oh yep oh yep yep yep!

Pam-parararam (pam pam) param-param-pam-pam.`,
  `Jó Atyánk, köszönjük Néked %name0%,
Szívünkbe zártuk, hála érte!
Áldj meg minket, Krisztusunk,
A Lelked legyen közöttünk míg együtt vagyunk!

Ó, Urunk, mi egyet akarunk,
Kik ebben a dalban együtt vagyunk:
Szereteted fénye, áldása érje %name1%!
Legyen a Lelked véle!

Alleluja!
`
    ]


*/

