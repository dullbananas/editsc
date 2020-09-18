module Styles exposing (main)


import Css exposing (..)
import Css.Global exposing (..)
import Html.Styled exposing (toUnstyled)
import Html exposing (Html)
import Browser


main : Html Never
main =
    toUnstyled <| global
        [ each [ html, body ]
            [ margin zero
            , padding zero
            , overflow hidden
            --, backgroundColor (rgb 128 128 128)
            , backgroundColor (rgb 255 255 255)
            , width (vw 100)
            ]

        {-, id "ui"
            [ zIndex (int 4)
            , position absolute
            , top zero
            , left zero
            ]-}
        ]
