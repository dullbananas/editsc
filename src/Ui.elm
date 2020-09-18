module Ui exposing
    ( Ui(..)
    , TextEl(..)
    , document
    )

import Element as E
import Element.Lazy as L
import Element.Font as Font
import Element.Background as Background
import Html
import Html.Attributes
import Browser


type Ui msg
    = Col (List (Ui msg))
    | BodyText (List TextEl)


type TextEl
    = Text String
    | Url String


document : Ui msg -> Browser.Document msg
document ui =
    { title = "EditSC"
    , body =
        let
            options : List E.Option
            options =
                [ E.focusStyle
                    { borderColor = Nothing
                    , backgroundColor = Nothing
                    , shadow = Nothing
                    }
                ]

--          attrs : List (E.Attribute msg)
            attrs =
                [ E.height E.fill
                , E.width E.fill
                --, E.explain Debug.todo
                ]

--          rootEl : E.Element msg
            rootEl =
                ui
                    |> flatten
                    |> Col
                    |> toElement
                    |> wrapRootEl
        in
        [ E.layoutWith
            { options = options } attrs rootEl
        ]
    }


wrapRootEl : E.Element msg -> E.Element msg
wrapRootEl =
    E.el
        [ E.paddingXY 16 16
        , Background.color white
        , E.width <| E.maximum 300 E.fill
        , E.height E.shrink
        , E.alignTop
        , E.alignRight
        ]


white : E.Color
white =
    E.rgb255 255 255 255


flatten : Ui msg -> List (Ui msg)
flatten ui =
    case ui of
        Col items ->
            items
                |> List.map flatten
                |> List.concat

        _ ->
            [ ui ]


toElement : Ui msg -> E.Element msg
toElement ui =
    case ui of
        Col items ->
            E.column
                [ E.spacing 12
                , E.width E.fill
                ]
                ( List.map (L.lazy toElement) items )

        BodyText textEls ->
            textEls
                |> List.intersperse (Text " ")
                |> Debug.log "uh"
                |> List.map (L.lazy bodyTextEl)
                |> E.paragraph bodyTextAttrs


bodyTextEl : TextEl -> E.Element msg
bodyTextEl textEl =
    case textEl of
        Text str ->
            E.text str

        Url url ->
            E.newTabLink linkAttrs
                { url = url
                , label = E.text url
                }


bodyTextAttrs : List (E.Attribute msg)
bodyTextAttrs =
    [ Font.family
        [ Font.typeface "-apple-system"
        , Font.typeface "BlinkMacSystemFont"
        , Font.typeface "Helvetiva"
        , Font.sansSerif
        ]
    , emSize 0.75
    ]


linkAttrs : List (E.Attribute msg)
linkAttrs =
    [ Font.color <| E.rgb255 0 119 255
    , Font.underline
    --, E.explain Debug.todo
    ]


emSize : Float -> E.Attribute msg
emSize size =
    css "font-size" <| String.fromFloat size ++ "em"


css : String -> String -> E.Attribute msg
css name value =
    Html.Attributes.style name value
        |> E.htmlAttribute
