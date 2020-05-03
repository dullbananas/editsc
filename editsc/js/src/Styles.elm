module Styles exposing (main)


import Css exposing (..)
import Css.Global exposing (..)
import Html.Styled exposing (toUnstyled)
import Html exposing (Html)
import Browser


main : Program () () Never
main =
    Browser.element
        { init = always ( (), Cmd.none )
        , update = \_ model -> ( model, Cmd.none )
        , subscriptions = always Sub.none
        , view = always view
        }


view : Html Never
view =
    toUnstyled <| global
        [ each [ html, body ]
            [ margin zero
            , padding zero
            , overflow hidden
            ]

        , each [ id "world-canvas", id "ui-wrapper", html, body ]
            [ width (vw 100)
            , height (vh 100)
            ]

        , id "world-canvas"
            [ zIndex (int -4)
            , backgroundColor (rgb 255 0 255)
            ]

        , id "ui-wrapper"
            [ zIndex (int 4)
            , position absolute
            , top zero
            , left zero
            ]
        ]
