module Css exposing (main)


import Css exposing (..)
import Css.Global exposing (..)
import Html exposing (Html)


main : Program () () ()
main =
    Browser.element
        { init = always ( (), Cmd.none )
        , update = \_ model -> ( model, Cmd.none )
        , subscriptions = always Sub.none
        , view = always view
        }


view : Html Never
view =
    global
        [ body
            [ backgroundColor <| rgb 0 0 0
            ]
        ]
