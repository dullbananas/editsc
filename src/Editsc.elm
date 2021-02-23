module Editsc exposing (main)

import Browser
import Html


main : Program () Model Never
main =
    Browser.document
        { init = init
        , view = view
        , update = never
        , subscriptions = always Sub.none
        }


type Model
    = TextDisplay String


init : () -> (Model, Cmd Never)
init flags =
    ( TextDisplay ""
    , Cmd.none
    )


view : Model -> Browser.Document Never
view model =
    { title = "EditSC"
    , body =
        case model of
            TextDisplay content ->
                [ Html.pre []
                    [ Html.text content
                    ]
                ]
    }
