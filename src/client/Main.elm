module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Regex
import String
import WebSocket


main : Program Flags Model Msg
main =
    Html.programWithFlags
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



-- INIT


type alias Flags =
    { wsUrl : String
    }


type State
    = Songs
    | Talks
    | Settings
    | Musics


type alias Model =
    { state : State
    , wsUrl : String
    , input : String
    , songTitles : List String
    , talks : List String
    , musics : List String
    , nxt_first_line : String
    , prev_first_line : String
    , name1: String
    , name2: String
    , pname1: String
    , pname2: String
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { state = Songs
      , wsUrl = flags.wsUrl
      , input = ""
      , songTitles = []
      , talks = []
      , musics =[]
      , nxt_first_line=""
      , prev_first_line=""
      , name1=""
      , name2=""
      , pname1=""
      , pname2=""
      }
    , Cmd.none
    )



-- VIEW

remove_tail: String->String
remove_tail str=
    str |> Regex.replace Regex.All (Regex.regex "[×][0-9]*") (\_ -> "")  
has_B:String->Bool
has_B str=str |> String.contains "ß"
songclassname:String->String
songclassname str= if (has_B str) then "songTitle_w" else "songTitle"
remove_B: String->String
remove_B str= str |> String.split "ß" |> \t-> ((Maybe.withDefault "Error" (List.head t))
    ++(Maybe.withDefault "" (List.head (List.drop 1 t))))
remove_comm: String->String
remove_comm str=
    str |>remove_tail|> String.split "#" |>List.head|>Maybe.withDefault "Error"
keep_comm: String->String
keep_comm str=
    str |>remove_tail|> String.split "#" |>List.drop 1|>List.head|>Maybe.withDefault ""

flatten : String -> String
flatten str =
    str
        |> String.toLower
        |> Regex.replace Regex.All (Regex.regex "[á]") (\_ -> "a")
        |> Regex.replace Regex.All (Regex.regex "[é]") (\_ -> "e")
        |> Regex.replace Regex.All (Regex.regex "[í]") (\_ -> "i")
        |> Regex.replace Regex.All (Regex.regex "[óöő]") (\_ -> "o")
        |> Regex.replace Regex.All (Regex.regex "[úüű]") (\_ -> "u")

--customThanksMaker: Html Msg
--customThanksMaker=
    
stateSelector : Html Msg
stateSelector =
    div [ id "stateSelectorContainer" ]
        [ button [ onClick (SwitchState Songs) ] [ text "Dalok" ]
        , button [ onClick (SwitchState Talks) ] [ text "Bevezetők" ]
        , button [ onClick (SwitchState Musics) ] [ text "Zenék" ]
        , button [ class "small", onClick (SwitchState Settings) ] [ text "⚙️" ]
        ]


view : Model -> Html Msg
view model =
    case model.state of
        Songs ->
            div [ id "songContainer" ]
                [ button [ onClick Prev ] 
                  [ text "<" 
                  , div [class "line"][text (model.prev_first_line)] 
                  ]
                , button [ onClick Next ] 
                  [ text ">" 
                  , div [class "line"][text (model.nxt_first_line)] 
                  ]
                , input [ onInput Input, onClick (Input ""), value model.input ] []
                , div [ id "songTitleContainer" ]
                    ((model.songTitles
                        |> List.filter
                            (\t ->
                                String.contains
                                    (flatten model.input)
                                    (flatten t)
                            )
                        |> List.map
                            (\t -> 
                                div [ class (songclassname t), onClick (SendSong (remove_B t)) ] [div [class "comment"][text (keep_comm (remove_B t))], text (remove_comm (remove_B t)) ]
                            ))
                        ++
                        --customThanksMaker
                        [div [id "customThanksMaker"][
                            div[id "Thanks1div", class "Thanksdiv"] [
                                button [onClick (NamedThanks1), class "ThanksButton"] [text "Köszönjük..."],
                                input [id "Thanks1inp", value model.name1, onInput NewName1][] 
                            ],
                            div[id "Thanks2div", class "Thanksdiv"] [
                                button [onClick (NamedThanks2), class "ThanksButton"] [text "Hála néked..."],
                                input [id "Thanks2inp", value model.name2, onInput NewName2][] 
                            ],
                            div[id "ThanksPairDiv", class "Thanksdiv"] [
                                button [onClick (NamedThanksPair), class "ThanksButton"] [text "Páros köszönjük"],
                                input [id "ThanksPinp1", value model.pname1, onInput NewNameP1][] ,
                                input [id "ThanksPinp2", value model.pname2, onInput NewNameP2][] 
                            ]
                        ]]
                    )
                , stateSelector
                ]

        Talks ->
            div [ id "talkContainer" ]
                [ button [ onClick Play ] [ text "Zene" ] -- "Play music"
                , button [ class "smallText", onClick Thanks ] [ text "Köszöntés" ] -- "Show thanks"
                , input [ onInput Input, onClick (Input ""), value model.input ] []
                , div [ id "talkTitleContainer" ]
                    (model.talks
                        |> List.filter
                            (\t ->
                                String.contains
                                    (flatten model.input)
                                    (flatten t)
                            )
                        |> List.map
                            (\t ->
                                div [ class "talkTitle", onClick (SendTalk t) ] [ text t ]
                            )
                    )
                , stateSelector
                ]

        Musics ->
            div [ id "musicContainer" ]
                [ 
                div [id "musicController"] 
                  [button  [ onClick PlayMusic ]  [ text "▶" ] -- "Play music"
                  , button [ onClick PauseMusic, class "middle"] [ text "⏸" ] -- "Pause music"
                  , button [ onClick StopMusic ]  [ text "⏹" ] -- "Stop music"
                  , button [ onClick PlayMusicAuto ]  [ text "▶⟳" ] 
                  , button [ onClick SoundDown , class "middle"]  [ text "🔉" ] 
                  , button [ onClick SoundUp ]    [ text "🔊" ] 
                  ]
                , input [ onInput Input, onClick (Input ""), value model.input ] []
                , div [ id "musicTitleContainer" ]
                    (model.musics
                        |> List.filter
                            (\t ->
                                String.contains
                                    (flatten model.input)
                                    (flatten t)
                            )
                        |> List.map
                            (\t ->
                                div [ class "musicTitle", onClick (SendMusic t) ] [ text t ]
                            )
                    )
                , stateSelector
                ]

        Settings ->
            div [ id "settingsContainer" ]
                [ button [ onClick Invert ] [ text "Invertálás" ] -- "Invert colors"
                , div [ id "marginControls" ]
                    [ button [ onClick <| Margin "l" "-" ] [ text "<" ]
                    , button [ onClick <| Margin "l" "+" ] [ text ">" ]
                    , div []
                        [ div []
                            [ button [ onClick <| Margin "t" "-" ] [ text "^" ]
                            , button [ onClick <| Margin "t" "+" ] [ text "v" ]
                            , button [ onClick <| Margin "x" "" ] [ text "x" ]
                            , button [ onClick <| Margin "b" "+" ] [ text "^" ]
                            , button [ onClick <| Margin "b" "-" ] [ text "v" ]
                            ]
                        ]
                    , button [ onClick <| Margin "r" "+" ] [ text "<" ]
                    , button [ onClick <| Margin "r" "-" ] [ text ">" ]
                    ]
                , div [ class "filler" ] []
                , stateSelector
                ]



-- Settings ->
--     div [ id "settingsContainer" ]
--         [ button [ onClick Invert ] [ text "Invertálás" ] -- "Invert colors"
--         , button [ onClick MarginUp ] [ text "Margó fel" ] -- "Margin up"
--         , button [ onClick MarginDown ] [ text "Margó le" ] -- "Margin down"
--         , div [ class "filler" ] []
--         , stateSelector
--         ]


viewMessage : String -> Html msg
viewMessage msg =
    div [] [ text msg ]



-- UPDATE


type Msg
    = WSData String
    | Input String
      -- Songs
    | SendSong String
    | Prev
    | Next
      -- Talks
    | SendTalk String
    | Play
    | Thanks
      -- Settings
    | Invert
    | Margin String String
      -- State Switch
    | SwitchState State
      -- Musics
    | SendMusic String
    | PlayMusic
    | PlayMusicAuto
    | PauseMusic
    | StopMusic
    | SoundDown
    | SoundUp
      -- thanks
    | NamedThanks1 
    | NamedThanks2 
    | NamedThanksPair 
    | NewName1 String
    | NewName2 String
    | NewNameP1 String
    | NewNameP2 String




update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        WSData str ->
            if String.startsWith "SONGS:" str then
                { model | songTitles = str |> String.dropLeft 6 |> String.split ";" } ! []
            else if String.startsWith "TALKS:" str then
                { model | talks = str |> String.dropLeft 6 |> String.split ";" } ! []
            else if String.startsWith "MUSICS:" str then
                { model | musics = str |> String.dropLeft 7 |> String.split ";" } ! []
            else if String.startsWith "PRFL:" str then
                { model | prev_first_line = str |> String.dropLeft 5 } ! []
            else if String.startsWith "NXTFL:" str then
                { model | nxt_first_line = str |> String.dropLeft 6 } ! []
            else
                model ! []

        Input newInput ->
            { model | input = newInput } ! []

        NewName1 newInput ->
            { model | name1 = newInput } ! []
        NewName2 newInput ->
            { model | name2 = newInput } ! []
        NewNameP1 newInput ->
            { model | pname1 = newInput } ! []
        NewNameP2 newInput ->
            { model | pname2 = newInput } ! []

        SendSong title ->
            model ! [ WebSocket.send model.wsUrl ("SONG:" ++ title) ]

        Prev ->
            model ! [ WebSocket.send model.wsUrl "PREV:" ]

        Next ->
            model ! [ WebSocket.send model.wsUrl "NEXT:" ]

        SendTalk title ->
            model ! [ WebSocket.send model.wsUrl ("TALK:" ++ title) ]

        Play ->
            model ! [ WebSocket.send model.wsUrl "PLAY:" ]

        Thanks ->
            model ! [ WebSocket.send model.wsUrl "THANKS:" ]

        Invert ->
            model ! [ WebSocket.send model.wsUrl "INVERT:" ]

        Margin side direction ->
            model ! [ WebSocket.send model.wsUrl ("MARGIN:" ++ side ++ "|" ++ direction) ]

        SendMusic title ->
            model ! [ WebSocket.send model.wsUrl ("MUSIC:" ++ title) ]

        PlayMusic ->
            model ! [ WebSocket.send model.wsUrl "PLAYMUSIC:" ]

        PlayMusicAuto ->
            model ! [ WebSocket.send model.wsUrl "PLAYMUSICAUTO:" ]

        PauseMusic ->
            model ! [ WebSocket.send model.wsUrl "PAUSEMUSIC:" ]

        StopMusic ->
            model ! [ WebSocket.send model.wsUrl "STOPMUSIC:" ]

        SoundDown ->
            model ! [ WebSocket.send model.wsUrl "SOUNDDOWN:" ]

        SoundUp ->
            model ! [ WebSocket.send model.wsUrl "SOUNDUP:" ]

        SwitchState state ->
            { model | state = state, input = "" } ! []

        NamedThanks1->
            model ! [ WebSocket.send model.wsUrl ("CUSTOMTHANKS:"++"1"++model.name1) ]
        NamedThanks2->
            model ! [ WebSocket.send model.wsUrl ("CUSTOMTHANKS:"++"2"++model.name2) ]
        NamedThanksPair->
            model ! [ WebSocket.send model.wsUrl ("CUSTOMTHANKS:"++"P"++model.pname1++"|"++model.pname2) ]


-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    WebSocket.listen model.wsUrl WSData
