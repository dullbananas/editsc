module Editsc exposing (main)

import Browser


main : Program () Model Never
main =
    Browser.document
        { init = init
        , view = always { title = "EditSC", body = [] }
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
