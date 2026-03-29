import { GrammarSection } from '../../types';

export const SPANISH_GRAMMAR: GrammarSection[] = [
  {
    id: 'es_1',
    title: '1. Rzeczownik (El sustantivo)',
    subsections: [
      {
        id: 'es_1.1',
        title: '1.1 Rodzaj gramatyczny (Género)',
        levelInfo: {
          A1: ["Zakończenia -o (męski) i -a (żeński): chico/chica", "Wyjątki: el mapa, el día, la mano, la foto", "Rzeczowniki zakończone na spółgłoskę: el profesor / la profesora", "Rzeczowniki na -e: el estudiante / la estudiante"],
          A2: ["Zakończenia żeńskie: -ción, -sión, -dad, -tad, -tud, -umbre", "Zakończenia męskie: -ma, -pa, -ta (pochodzenia greckiego): el problema, el planeta", "Heteronimy: hombre/mujer, caballo/yegua"],
          B1: ["Rzeczowniki o wspólnym rodzaju (el/la artista, el/la paciente)", "Zmiana znaczenia w zależności od rodzaju: el capital / la capital, el cura / la cura", "Rzeczowniki zaczynające się na akcentowane a- / ha- (el agua, el águila)"],
          B2: ["Rzeczowniki dwurodzajowe (el mar / la mar, el azúcar / la azúcar)", "Tworzenie form żeńskich od zawodów i tytułów: la médica, la jueza"],
          C1: ["Rzeczowniki epicoeniczne (jedno określenie dla obu płci zwierząt): la pantera macho/hembra", "Subtelne różnice znaczeniowe: el leño / la leña, el huerto / la huerta"]
        }
      },
      {
        id: 'es_1.2',
        title: '1.2 Liczba mnoga (Número)',
        levelInfo: {
          A1: ["Dodawanie -s do samogłosek: casa -> casas", "Dodawanie -es do spółgłosek: ciudad -> ciudades", "Zmiana z -> c: lápiz -> lápices"],
          A2: ["Rzeczowniki zakończone na -í, -ú akcentowane: jabalí -> jabalíes/jabalís", "Rzeczowniki zakończone na -s lub -x nieakcentowane na ostatniej sylabie: el paraguas -> los paraguas"],
          B1: ["Rzeczowniki występujące tylko w liczbie pojedynczej (Singularia tantum): la sed, la salud", "Rzeczowniki występujące tylko w liczbie mnogiej (Pluralia tantum): las gafas, las tijeras, las afueras"],
          B2: ["Liczba mnoga zapożyczeń: el club -> los clubes/clubs, el test -> los test/tests", "Przesunięcie akcentu w liczbie mnogiej: el régimen -> los regímenes, el espécimen -> los especímenes"],
          C1: ["Liczba mnoga rzeczowników złożonych: el abrelatas -> los abrelatas, el coche cama -> los coches cama"]
        }
      },
      {
        id: 'es_1.3',
        title: '1.3 Zdrobnienia i zgrubienia (Diminutivos y aumentativos)',
        levelInfo: {
          A2: ["Zdrobnienia -ito/-ita: perrito, casita", "Zgrubienia -ón/-ona: casona, hombrón"],
          B1: ["Inne przyrostki zdrobniałe: -illo/-illa, -ico/-ica, -ín/-ina", "Przyrostki zgrubiałe i pejoratywne: -azo, -ote, -ucho"],
          B2: ["Zmiany ortograficzne i fonetyczne przy tworzeniu zdrobnień: pez -> pececito, flor -> florecita"],
          C1: ["Zdrobnienia od przysłówków i imiesłowów: despacito, callandito", "Regionalizmy w użyciu przyrostków"]
        }
      }
    ]
  },
  {
    id: 'es_2',
    title: '2. Rodzajnik (El artículo)',
    subsections: [
      {
        id: 'es_2.1',
        title: '2.1 Rodzajnik określony (Artículo determinado)',
        levelInfo: {
          A1: ["Formy: el, la, los, las", "Użycie z rzeczami znanymi i unikalnymi", "Ściągnięcia (Contracciones): a + el = al, de + el = del"],
          A2: ["Użycie z dniami tygodnia: el lunes, los martes", "Użycie z godzinami: a las tres", "Użycie z tytułami (el señor García) z wyjątkiem bezpośredniego zwrotu"],
          B1: ["Użycie z wiekiem: a los 20 años", "Użycie z nazwami rzek, mórz, gór", "Użycie z niektórymi nazwami państw i miast: la India, el Japón"],
          B2: ["Opuszczanie rodzajnika w wyliczeniach", "Rodzajnik z bezokolicznikiem w funkcji podmiotu: El fumar es malo"],
          C1: ["Wartość emfatyczna i uogólniająca rodzajnika"]
        }
      },
      {
        id: 'es_2.2',
        title: '2.2 Rodzajnik nieokreślony (Artículo indeterminado)',
        levelInfo: {
          A1: ["Formy: un, una, unos, unas", "Wprowadzanie nowej informacji", "Użycie do określania ilości (jeden z wielu)"],
          A2: ["Brak rodzajnika przed zawodami, narodowością, religią po czasowniku 'ser': Soy médico (ale: Soy un médico excelente)", "Znaczenie 'unos/unas' jako 'około': unos 20 euros"],
          B1: ["Brak rodzajnika po 'otro', 'medio', 'qué', 'tal'"],
          B2: ["Użycie emfatyczne: ¡Hace un frío!", "Różnica między 'unos' a 'algunos'"]
        }
      },
      {
        id: 'es_2.3',
        title: '2.3 Rodzajnik nijaki (Artículo neutro "lo")',
        levelInfo: {
          A2: ["Użycie z przymiotnikami w znaczeniu abstrakcyjnym: lo bueno, lo malo"],
          B1: ["Konstrukcja 'lo que' (to, co): Lo que me gusta es...", "Lo + przymiotnik/przysłówek + que (wartość wzmacniająca): No sabes lo difícil que es"],
          B2: ["Konstrukcja 'a lo' + przymiotnik (w stylu): a lo loco, a lo tonto"],
          C1: ["Różnica między 'lo' a 'el/la' w konstrukcjach z 'de': lo de ayer vs. el de ayer"]
        }
      }
    ]
  },
  {
    id: 'es_3',
    title: '3. Przymiotnik (El adjetivo)',
    subsections: [
      {
        id: 'es_3.1',
        title: '3.1 Uzgadnianie i pozycja (Concordancia y posición)',
        levelInfo: {
          A1: ["Uzgadnianie w rodzaju i liczbie z rzeczownikiem", "Standardowa pozycja po rzeczowniku: un coche rojo"],
          A2: ["Przymiotniki określające ilość przed rzeczownikiem: mucho, poco, bastante", "Przymiotniki skrócone przed rzeczownikiem: bueno -> buen, malo -> mal, grande -> gran"],
          B1: ["Zmiana znaczenia w zależności od pozycji: un hombre pobre (biedny) vs. un pobre hombre (nieszczęsny)", "Przymiotniki relacyjne (zawsze po rzeczowniku): crisis económica"],
          B2: ["Użycie kilku przymiotników z jednym rzeczownikiem", "Przymiotniki w funkcji orzecznika (Atributo i Predicativo)"]
        }
      },
      {
        id: 'es_3.2',
        title: '3.2 Stopniowanie (Grados del adjetivo)',
        levelInfo: {
          A1: ["Stopień wyższy (Comparativo): más ... que, menos ... que", "Stopień równy: tan ... como, igual de ... que", "Stopień najwyższy (Superlativo relativo): el/la más ... de"],
          A2: ["Formy nieregularne: bueno -> mejor, malo -> peor, grande -> mayor, pequeño -> menor"],
          B1: ["Stopień najwyższy bezwzględny (Superlativo absoluto): przyrostek -ísimo/a (guapísimo, carísimo)", "Bardzo + przymiotnik: muy guapo"],
          B2: ["Nieregularne formy na -ísimo: antiguo -> antiquísimo, fuerte -> fortísimo, amable -> amabilísimo", "Przedrostki wzmacniające: super-, extra-, ultra-, re-"],
          C1: ["Kultyzmy i formy na -érrimo: pobre -> paupérrimo, célebre -> celebérrimo", "Porównania z 'de lo que': Es más inteligente de lo que parece"]
        }
      }
    ]
  },
  {
    id: 'es_4',
    title: '4. Zaimki (Los pronombres)',
    subsections: [
      {
        id: 'es_4.1',
        title: '4.1 Zaimki osobowe w funkcji podmiotu (Pronombres personales sujeto)',
        levelInfo: {
          A1: ["Formy: yo, tú, él, ella, usted, nosotros/as, vosotros/as, ellos, ellas, ustedes", "Opuszczanie zaimka (podmiot domyślny)", "Użycie 'usted/ustedes' (formy grzecznościowe)"],
          A2: ["Użycie zaimków dla emfazy lub kontrastu: Yo soy de España, pero ella es de México"],
          B1: ["Użycie 'vos' (voseo) w Ameryce Łacińskiej"]
        }
      },
      {
        id: 'es_4.2',
        title: '4.2 Zaimki dopełnienia bliższego i dalszego (Objeto Directo e Indirecto)',
        levelInfo: {
          A1: ["Dopełnienie bliższe (OD): me, te, lo, la, nos, os, los, las", "Dopełnienie dalsze (OI): me, te, le, nos, os, les"],
          A2: ["Pozycja zaimków: przed czasownikiem odmienionym, doklejone do bezokolicznika i gerundio", "Zaimki podwójne (OI + OD): me lo, te la, se lo (zmiana 'le' na 'se')"],
          B1: ["Zaimki z trybem rozkazującym (Imperativo): dímelo, no me lo digas", "Zjawiska: Leísmo, Laísmo, Loísmo (rozpoznawanie i normy)"],
          B2: ["Redundancja zaimkowa (Duplicación del pronombre): A Juan le di el libro", "Zaimki w konstrukcjach z bezokolicznikiem i gerundio (przesuwanie zaimków: lo quiero comprar / quiero comprarlo)"]
        }
      },
      {
        id: 'es_4.3',
        title: '4.3 Zaimki przyimkowe (Pronombres con preposición)',
        levelInfo: {
          A1: ["Formy: mí, ti, él, ella, usted, nosotros, vosotros, ellos", "Wyjątki z 'con': conmigo, contigo"],
          A2: ["Użycie z czasownikami typu 'gustar': A mí me gusta...", "Wyjątki z przyimkami 'entre', 'según', 'hasta', 'incluso', 'menos', 'salvo': entre tú y yo (nie: entre ti y mí)"],
          B1: ["Forma 'consigo' (z samym sobą)"]
        }
      },
      {
        id: 'es_4.4',
        title: '4.4 Zaimki i przymiotniki dzierżawcze (Posesivos)',
        levelInfo: {
          A1: ["Formy nieakcentowane (przed rzeczownikiem): mi(s), tu(s), su(s), nuestro/a(s), vuestro/a(s), su(s)"],
          A2: ["Formy akcentowane (po rzeczowniku lub samodzielnie): mío/a(s), tuyo/a(s), suyo/a(s), nuestro/a(s), vuestro/a(s), suyo/a(s)", "Użycie z rodzajnikiem: el mío, la tuya"],
          B1: ["Zastępowanie dzierżawczych rodzajnikiem przy częściach ciała i ubraniach: Me lavo las manos (nie: mis manos)"]
        }
      },
      {
        id: 'es_4.5',
        title: '4.5 Zaimki i przymiotniki wskazujące (Demostrativos)',
        levelInfo: {
          A1: ["Odległość bliska: este, esta, estos, estas", "Odległość średnia: ese, esa, esos, esas", "Odległość daleka: aquel, aquella, aquellos, aquellas"],
          A2: ["Formy nijakie: esto, eso, aquello (tylko jako zaimki, nigdy z rzeczownikiem)", "Odnoszenie się do czasu: este año, ese día, aquella época"],
          B1: ["Użycie anaforyczne w tekście (odnoszenie się do wcześniej wspomnianych elementów)"]
        }
      },
      {
        id: 'es_4.6',
        title: '4.6 Zaimki względne i pytające (Relativos e Interrogativos)',
        levelInfo: {
          A1: ["Pytające (z akcentem): qué, quién, cómo, dónde, cuándo, cuánto, cuál", "Względne (bez akcentu): que, donde, cuando"],
          A2: ["Różnica między 'qué' a 'cuál'", "Zaimki względne: quien/quienes, el que / la que / los que / las que"],
          B1: ["Zaimki względne z przyimkami: en el que, con quien, al que", "Zaimek względny 'cuyo/cuya' (którego)"],
          B2: ["Zaimek względny 'lo que' i 'lo cual'", "Zaimki względne 'cuanto' i 'como'"],
          C1: ["Różnice w użyciu 'el cual' vs 'el que'", "Zdania przydawkowe ograniczające i opisujące (Especificativas y Explicativas)"]
        }
      },
      {
        id: 'es_4.7',
        title: '4.7 Zaimki nieokreślone (Indefinidos)',
        levelInfo: {
          A1: ["algo / nada", "alguien / nadie", "algún(o/a/os/as) / ningún(o/a)"],
          A2: ["todo/a/os/as, mucho, poco, bastante, demasiado", "otro/a/os/as, mismo/a/os/as"],
          B1: ["cualquiera (cualquier)", "cada, cada uno/a", "ambos/as", "demás (los/las demás)"],
          B2: ["Podwójne przeczenie: No veo a nadie / Nadie vino", "Różnica między 'algo' a 'un poco de'"]
        }
      }
    ]
  },
  {
    id: 'es_5',
    title: '5. Czasownik: Tryb Oznajmujący (Verbo: Indicativo)',
    subsections: [
      {
        id: 'es_5.1',
        title: '5.1 Czas teraźniejszy (Presente de Indicativo)',
        levelInfo: {
          A1: ["Koniugacje regularne: -ar, -er, -ir", "Czasowniki zwrotne (Verbos reflexivos): llamarse, levantarse", "Czasowniki z obocznościami (e>ie, o>ue, e>i): pensar, poder, pedir", "Nieregularności w 1. osobie liczby pojedynczej: hacer, poner, salir, traer, conocer, saber", "Całkowicie nieregularne: ser, estar, ir, tener, venir"],
          A2: ["Zastosowanie: teraźniejszość, rutyna, prawdy ogólne", "Presente z wartością przyszłą: Mañana voy al cine"],
          B1: ["Presente histórico (czas teraźniejszy historyczny)"],
          C1: ["Presente z wartością rozkazującą: Te sientas y te callas"]
        }
      },
      {
        id: 'es_5.2',
        title: '5.2 Czas przeszły dokonany złożony (Pretérito Perfecto Compuesto)',
        levelInfo: {
          A1: ["Budowa: haber (presente) + participio", "Imiesłowy bierne (Participios) regularne: -ado, -ido", "Imiesłowy nieregularne: abierto, dicho, escrito, hecho, muerto, puesto, roto, visto, vuelto"],
          A2: ["Zastosowanie: akcje przeszłe w niezakończonym okresie czasu (hoy, esta semana, este año)", "Doświadczenia życiowe (alguna vez, nunca, ya, todavía no)"],
          B1: ["Różnice w użyciu między Hiszpanią a Ameryką Łacińską"]
        }
      },
      {
        id: 'es_5.3',
        title: '5.3 Czas przeszły dokonany prosty (Pretérito Indefinido)',
        levelInfo: {
          A2: ["Koniugacje regularne: -ar, -er/-ir", "Zmiany ortograficzne w 1. os. l.poj.: -car (qu), -gar (gu), -zar (c)", "Oboczności samogłoskowe w 3. osobie (e>i, o>u): pedir -> pidió, dormir -> durmió", "Całkowicie nieregularne (silny rdzeń): tener (tuv-), estar (estuv-), hacer (hic-), poder (pud-), poner (pus-), querer (quis-), saber (sup-), venir (vin-), decir (dij-), traer (traj-)", "Nieregularne: ser, ir, dar, ver"],
          B1: ["Zastosowanie: akcje zakończone w zamkniętym okresie czasu (ayer, el año pasado, en 1990)", "Akcje punktowe, przerywające inną czynność, sekwencje zdarzeń w narracji"],
          B2: ["Różnica znaczeniowa czasowników w Indefinido: conocer (poznać), saber (dowiedzieć się), poder (zdołać), querer (spróbować)"]
        }
      },
      {
        id: 'es_5.4',
        title: '5.4 Czas przeszły niedokonany (Pretérito Imperfecto)',
        levelInfo: {
          A2: ["Koniugacje regularne: -aba, -ía", "Tylko 3 czasowniki nieregularne: ser (era), ir (iba), ver (veía)", "Zastosowanie: opisy w przeszłości (ludzie, miejsca, okoliczności)", "Zwyczaje i rutyna w przeszłości (antes, siempre, a menudo)"],
          B1: ["Tło wydarzeń dla Pretérito Indefinido: Estaba lloviendo cuando salí", "Imperfecto de cortesía (grzecznościowe): Quería un café"],
          B2: ["W mowie zależnej (Estilo indirecto) jako odpowiednik Presente", "W świecie wyobraźni i zabawy dziecięcej"]
        }
      },
      {
        id: 'es_5.5',
        title: '5.5 Kontrast czasów przeszłych (Contraste de pasados)',
        levelInfo: {
          A2: ["Perfecto vs. Indefinido (okres niezakończony vs. zakończony)"],
          B1: ["Indefinido vs. Imperfecto (akcja punktowa/sekwencja vs. opis/tło/rutyna)", "Współdziałanie trzech czasów przeszłych w opowiadaniu historii"],
          B2: ["Zmiana perspektywy czasowej i subtelne różnice znaczeniowe"]
        }
      },
      {
        id: 'es_5.6',
        title: '5.6 Czas zaprzeszły (Pretérito Pluscuamperfecto)',
        levelInfo: {
          B1: ["Budowa: haber (imperfecto) + participio", "Zastosowanie: akcja przeszła, która wydarzyła się przed inną akcją w przeszłości (Cuando llegué, el tren ya había salido)"],
          B2: ["Użycie w mowie zależnej jako odpowiednik Pretérito Perfecto i Indefinido"]
        }
      },
      {
        id: 'es_5.7',
        title: '5.7 Czasy przyszłe (Futuro Simple y Compuesto)',
        levelInfo: {
          A2: ["Futuro Simple - budowa: bezokolicznik + końcówki (-é, -ás, -á, -emos, -éis, -án)", "Czasowniki nieregularne: tener (tendr-), salir (saldr-), poner (pondr-), venir (vendr-), hacer (har-), decir (dir-), poder (podr-), saber (sabr-), querer (querr-), haber (habr-)", "Zastosowanie: przewidywania, obietnice, plany na daleką przyszłość"],
          B1: ["Wyrażanie prawdopodobieństwa i przypuszczeń w teraźniejszości: ¿Qué hora será? Serán las tres.", "Futuro Compuesto (Perfecto) - budowa: haber (futuro) + participio", "Zastosowanie Futuro Compuesto: akcja przyszła zakończona przed inną akcją w przyszłości"],
          B2: ["Futuro Compuesto do wyrażania przypuszczeń dotyczących niedawnej przeszłości: ¿Por qué no ha venido? Se habrá quedado dormido."]
        }
      },
      {
        id: 'es_5.8',
        title: '5.8 Tryb warunkowy (Condicional Simple y Compuesto)',
        levelInfo: {
          A2: ["Condicional Simple - budowa: bezokolicznik + końcówki (-ía, -ías, -ía, -íamos, -íais, -ían)", "Te same nieregularności co w Futuro Simple (tendr-, har-, dir-, itp.)", "Zastosowanie: prośby grzecznościowe (¿Podrías ayudarme?), udzielanie rad (Yo que tú, iría al médico)"],
          B1: ["Wyrażanie życzeń: Me gustaría viajar a Japón", "Wyrażanie prawdopodobieństwa w przeszłości (odpowiednik Imperfecto/Indefinido): ¿Qué hora era? Serían las tres."],
          B2: ["Condicional Compuesto - budowa: haber (condicional) + participio", "Zastosowanie: akcje, które mogły się wydarzyć w przeszłości, ale się nie wydarzyły (żale, wyrzuty): Habría ido a la fiesta, pero estaba enfermo.", "W zdaniach warunkowych III typu (Oraciones condicionales)"]
        }
      }
    ]
  },
  {
    id: 'es_6',
    title: '6. Czasownik: Tryb Łączący (Verbo: Subjuntivo)',
    subsections: [
      {
        id: 'es_6.1',
        title: '6.1 Czas teraźniejszy (Presente de Subjuntivo)',
        levelInfo: {
          B1: ["Budowa: odwrócenie samogłosek tematycznych (-ar -> -e, -er/-ir -> -a)", "Nieregularności oparte na 1. os. l.poj. Presente de Indicativo (tenga, haga, diga, conozca)", "Oboczności (piense, vuelva, pida)", "Całkowicie nieregularne: ser (sea), ir (vaya), saber (sepa), dar (dé), estar (esté), haber (haya)"],
          B2: ["Zmiany ortograficzne: busque, pague, empiece"]
        }
      },
      {
        id: 'es_6.2',
        title: '6.2 Zastosowanie Subjuntivo w zdaniach niezależnych',
        levelInfo: {
          B1: ["Wyrażanie życzeń z 'Ojalá (que)'", "Wyrażanie prawdopodobieństwa: quizá(s), tal vez, posiblemente, probablemente (zależnie od stopnia pewności)"],
          B2: ["Wyrażenia typu: ¡Que te mejores!, ¡Que aproveche!", "Z 'ni que' (oburzenie): ¡Ni que fueras el jefe! (z Imperfecto de Subjuntivo)"]
        }
      },
      {
        id: 'es_6.3',
        title: '6.3 Zastosowanie Subjuntivo w zdaniach podrzędnych rzeczownikowych',
        levelInfo: {
          B1: ["Czasowniki wyrażające wolę, chęć, rozkaz, zakaz (querer, desear, pedir, exigir, prohibir) + que + Subjuntivo (gdy są dwa różne podmioty)", "Czasowniki wyrażające uczucia i emocje (gustar, encantar, molestar, dar miedo, alegrarse de) + que + Subjuntivo", "Wyrażenia bezosobowe (es necesario, es importante, es lógico, es una pena) + que + Subjuntivo"],
          B2: ["Czasowniki wyrażające opinię, percepcję, komunikację (creer, pensar, ver, decir) - Indicativo w twierdzeniach, Subjuntivo w przeczeniach (No creo que sea verdad)"],
          C1: ["Subtelne różnice: decir que + Indicativo (informacja) vs. decir que + Subjuntivo (rozkaz)"]
        }
      },
      {
        id: 'es_6.4',
        title: '6.4 Zastosowanie Subjuntivo w zdaniach podrzędnych przymiotnikowych (względnych)',
        levelInfo: {
          B1: ["Gdy poprzednik jest nieznany, nieokreślony lub nie istnieje: Busco un piso que tenga balcón vs. Tengo un piso que tiene balcón", "W przeczeniach: No hay nadie que sepa la respuesta"],
          B2: ["Z zaimkami nieokreślonymi: cualquiera que sea, dondequiera que vayas"]
        }
      },
      {
        id: 'es_6.5',
        title: '6.5 Zastosowanie Subjuntivo w zdaniach podrzędnych okolicznikowych',
        levelInfo: {
          B1: ["Zdania czasowe (Temporales): 'cuando', 'en cuanto', 'hasta que' + Subjuntivo (gdy odnoszą się do przyszłości): Cuando llegue a casa, te llamaré.", "Zdania celowe (Finales): 'para que', 'a fin de que' + Subjuntivo (zawsze, gdy są dwa podmioty)"],
          B2: ["Zdania przyzwalające (Concesivas): 'aunque' + Indicativo (fakt) vs. 'aunque' + Subjuntivo (hipoteza, brak wiedzy, lub fakt nieistotny): Aunque llueva mañana, iré.", "Zdania warunkowe (Condicionales): 'siempre que', 'a condición de que', 'en caso de que' + Subjuntivo"],
          C1: ["Zdania sposobu (Modales): 'como', 'según' + Subjuntivo (gdy sposób jest nieznany lub odnosi się do przyszłości)", "Zdania skutkowe (Consecutivas): 'de ahí que' + Subjuntivo"]
        }
      },
      {
        id: 'es_6.6',
        title: '6.6 Czasy przeszłe w Subjuntivo (Imperfecto, Perfecto, Pluscuamperfecto)',
        levelInfo: {
          B2: ["Pretérito Imperfecto de Subjuntivo - budowa: od 3. os. l.mn. Indefinido + końcówki -ra/-ras/-ra lub -se/-ses/-se (tuviera/tuviese, hablara/hablase)", "Zastosowanie Imperfecto de Subjuntivo: następstwo czasów (gdy czasownik główny jest w czasie przeszłym lub warunkowym)", "Pretérito Perfecto de Subjuntivo (haya cantado) - akcje zakończone w przeszłości, ale powiązane z teraźniejszością", "Pretérito Pluscuamperfecto de Subjuntivo (hubiera/hubiese cantado) - akcje zaprzeszłe, nierealne warunki w przeszłości"],
          C1: ["Zgodność czasów (Correlación de tiempos) w trybie łączącym - zaawansowane przypadki"]
        }
      }
    ]
  },
  {
    id: 'es_7',
    title: '7. Tryb rozkazujący (El Imperativo)',
    subsections: [
      {
        id: 'es_7.1',
        title: '7.1 Imperativo Afirmativo (Twierdzący)',
        levelInfo: {
          A1: ["Formy regularne dla 'tú' i 'vosotros' (habla, hablad / come, comed)", "Formy grzecznościowe 'usted/ustedes' (zapożyczone z Presente de Subjuntivo: hable, hablen)", "Nieregularne dla 'tú': di, haz, ve, pon, sal, sé, ten, ven"],
          A2: ["Pozycja zaimków: zawsze doklejone na końcu słowa (dímelo, levántate)", "Konieczność dodania akcentu graficznego przy doklejaniu zaimków"],
          B1: ["Forma dla 'nosotros' (zróbmy coś): hablemos, comamos", "Utrata 'd' w 'vosotros' przy czasownikach zwrotnych: levantaos (nie: levantados), wyjątek: idos"]
        }
      },
      {
        id: 'es_7.2',
        title: '7.2 Imperativo Negativo (Przeczący)',
        levelInfo: {
          A2: ["Budowa: No + Presente de Subjuntivo dla wszystkich osób (no hables, no hable, no hablemos, no habléis, no hablen)", "Pozycja zaimków: zawsze przed czasownikiem (no me lo digas, no te levantes)"],
          B1: ["Kontrast między twierdzącym a przeczącym (hazlo vs. no lo hagas)"]
        }
      }
    ]
  },
  {
    id: 'es_8',
    title: '8. Formy bezosobowe i peryfrazy (Formas no personales y perífrasis)',
    subsections: [
      {
        id: 'es_8.1',
        title: '8.1 Bezokolicznik (Infinitivo)',
        levelInfo: {
          A1: ["Jako podmiot: Viajar es divertido", "Po przyimkach: antes de salir, para estudiar"],
          A2: ["Al + infinitivo (gdy, podczas gdy): Al salir de casa, vi a Juan"],
          B1: ["Infinitivo compuesto (haber + participio): Gracias por haber venido"]
        }
      },
      {
        id: 'es_8.2',
        title: '8.2 Imiesłów czynny / Gerundium (Gerundio)',
        levelInfo: {
          A1: ["Budowa: -ando, -iendo", "Nieregularne: leyendo, durmiendo, pidiendo, yendo"],
          A2: ["Zastosowanie: czynność w trakcie trwania (estar + gerundio)"],
          B1: ["Jako okolicznik sposobu: Salió corriendo", "Gerundio compuesto (habiendo + participio)"],
          B2: ["Błędy w użyciu gerundio (gerundio de posterioridad)"]
        }
      },
      {
        id: 'es_8.3',
        title: '8.3 Imiesłów bierny (Participio)',
        levelInfo: {
          A1: ["Budowa: -ado, -ido i nieregularne", "W czasach złożonych (z 'haber' - nieodmienny)"],
          A2: ["Jako przymiotnik (uzgadnia się w rodzaju i liczbie): la puerta está abierta"],
          B2: ["Konstrukcje absolutne z participio: Terminada la clase, los alumnos salieron"]
        }
      },
      {
        id: 'es_8.4',
        title: '8.4 Peryfrazy czasownikowe (Perífrasis verbales)',
        levelInfo: {
          A1: ["ir a + infinitivo (przyszłość, zamiar)", "tener que + infinitivo (obowiązek)", "estar + gerundio (czynność w toku)"],
          A2: ["hay que + infinitivo (obowiązek ogólny)", "empezar a / terminar de + infinitivo", "volver a + infinitivo (zrobić coś ponownie)", "poder / deber + infinitivo"],
          B1: ["llevar + gerundio (robić coś od jakiegoś czasu)", "seguir + gerundio (kontynuować robienie czegoś)", "dejar de + infinitivo (przestać coś robić)", "acabar de + infinitivo (właśnie coś zrobić)"],
          B2: ["ponerse a / echarse a / romper a + infinitivo (nagłe rozpoczęcie czynności)", "venir a + infinitivo (przybliżenie)", "llevar + participio (mieć zrobione do tej pory)"],
          C1: ["andar + gerundio (robić coś ciągle, z irytacją)", "darle a uno por + infinitivo (nagły, dziwny kaprys)"]
        }
      }
    ]
  },
  {
    id: 'es_9',
    title: '9. Przyimki (Las preposiciones)',
    subsections: [
      {
        id: 'es_9.1',
        title: '9.1 Użycie podstawowych przyimków',
        levelInfo: {
          A1: ["a (kierunek, czas, dopełnienie bliższe osobowe)", "de (pochodzenie, przynależność, materiał)", "en (miejsce, środek transportu, czas)", "con (towarzystwo, narzędzie)", "sin (brak)"],
          A2: ["desde, hasta (początek i koniec w czasie/przestrzeni)", "entre (pomiędzy)", "sobre, debajo de, delante de, detrás de (lokalizacja)"],
          B1: ["hacia (kierunek przybliżony), contra (przeciwko), según (według)"]
        }
      },
      {
        id: 'es_9.2',
        title: '9.2 Por vs. Para',
        levelInfo: {
          A2: ["Para: cel (żeby), przeznaczenie (dla), kierunek docelowy, termin (na kiedyś)", "Por: przyczyna (z powodu), miejsce przybliżone (przez, po), środek komunikacji/transportu, wymiana/cena"],
          B1: ["Para: opinia (para mí), porównanie (para ser extranjero, habla muy bien)", "Por: czas przybliżony (por la mañana, por Navidad), strona bierna (escrito por...), 'por favor', 'por fin'"],
          B2: ["Estar por + infinitivo (mieć zamiar coś zrobić, być do zrobienia) vs. Estar para + infinitivo (być gotowym do)"]
        }
      },
      {
        id: 'es_9.3',
        title: '9.3 Czasowniki z przyimkami (Régimen preposicional)',
        levelInfo: {
          B1: ["Czasowniki wymagające 'a': acostumbrarse a, atreverse a, negarse a", "Czasowniki wymagające 'de': acordarse de, alegrarse de, depender de, enamorarse de", "Czasowniki wymagające 'en': pensar en, fijarse en, confiar en", "Czasowniki wymagające 'con': soñar con, casarse con, contar con"],
          B2: ["Zmiana znaczenia w zależności od przyimka: pensar en (myśleć o) vs. pensar de (mieć opinię)"]
        }
      }
    ]
  },
  {
    id: 'es_10',
    title: '10. Składnia i inne (Sintaxis y otros)',
    subsections: [
      {
        id: 'es_10.1',
        title: '10.1 Zdania warunkowe (Oraciones condicionales)',
        levelInfo: {
          A2: ["Typ I (Rzeczywiste): Si + Presente Indicativo, Presente/Futuro/Imperativo (Si llueve, me quedo en casa)"],
          B2: ["Typ II (Nierealne w teraźniejszości/przyszłości): Si + Imperfecto Subjuntivo, Condicional Simple (Si tuviera dinero, viajaría)"],
          C1: ["Typ III (Nierealne w przeszłości): Si + Pluscuamperfecto Subjuntivo, Condicional Compuesto / Pluscuamperfecto Subjuntivo (Si hubiera estudiado, habría aprobado)", "Mieszane zdania warunkowe", "Inne spójniki warunkowe: a no ser que, siempre y cuando, como + subjuntivo"]
        }
      },
      {
        id: 'es_10.2',
        title: '10.2 Mowa zależna (Estilo indirecto)',
        levelInfo: {
          B1: ["Przekazywanie wypowiedzi, gdy czasownik wprowadzający jest w czasie teraźniejszym (Dice que...)", "Zmiana zaimków osobowych, dzierżawczych i określeń czasu/miejsca", "Przekazywanie pytań (Me pregunta si... / Me pregunta dónde...) i rozkazów (Me dice que estudie)"],
          B2: ["Przekazywanie wypowiedzi, gdy czasownik wprowadzający jest w czasie przeszłym (Dijo que...)", "Zasady następstwa czasów (Presente -> Imperfecto, Indefinido/Perfecto -> Pluscuamperfecto, Futuro -> Condicional)"]
        }
      },
      {
        id: 'es_10.3',
        title: '10.3 Strona bierna (La voz pasiva)',
        levelInfo: {
          B1: ["Pasiva refleja (se + czasownik w 3. os.): Se venden pisos, Se habla español", "Pasiva perifrástica (ser + participio + por): El libro fue escrito por Cervantes"],
          B2: ["Ograniczenia w użyciu pasiva perifrástica (preferencja dla pasiva refleja lub konstrukcji bezosobowych w języku mówionym)"]
        }
      },
      {
        id: 'es_10.4',
        title: '10.4 Przysłówki (Los adverbios)',
        levelInfo: {
          A1: ["Przysłówki miejsca, czasu, ilości, sposobu (bien, mal, muy, mucho)"],
          A2: ["Tworzenie przysłówków od przymiotników za pomocą przyrostka '-mente' (rápidamente, fácilmente)"],
          B1: ["Zasady akcentowania i łączenia przysłówków na '-mente' (clara y concisamente)"]
        }
      }
    ]
  }
];
