module Ui exposing
    ( heading
    , bodyText
    , fileInput
    , button
    , icon
    , smallButton
    , panel

    , HeadingLevel(..)
    , SmallButton

    , light
    )

import Element exposing (..)
import Element.Region as Region
import Element.Font as Font
import Element.Border as Border
import Element.Events as Event
import Element.Background as Background
import Html.Attributes as HtmlAttr
import Html



-- Elements


heading : HeadingLevel -> String -> Element msg
heading level content =
    let
        ( size, levelInt ) =
            case level of
                H1 -> ( 32, 1 )

    in
        el
            [ Region.heading levelInt
            , Font.size size
            , Font.light
            , fontFamily
            ]
            ( text content )


type HeadingLevel
    = H1


bodyText : String -> Element msg
bodyText content =
    paragraph
        [ fontFamily
        , Font.size 16
        ]
        [ text content ]


fileInput : String -> Element msg
fileInput idName =
    el [] <| html <| Html.input
        [ HtmlAttr.type_ "file"
        , HtmlAttr.id idName
        ]
        []


button : String -> msg -> Element msg
button label clickMsg =
    el
        [ fontFamily
        , paddingXY 16 12
        , Font.size 16
        , Border.rounded 4
        , outset
        , Event.onClick clickMsg
        ]
        ( text label )


icon : String -> Element msg
icon iconName =
    el
        [ centerX
        , centerY
        ]

        <| html <| Html.i
            [ HtmlAttr.class "fas"
            , HtmlAttr.class <| "fa-" ++ iconName
            ]
            []


smallButton : SmallButton msg -> Element msg
smallButton { iconName, onClick, active } =
    el
        [ width <| px 48
        , height <| px 48
        , outset
        , Font.size 24
        , Font.color ( if active then blue else gray )
        , Border.rounded 24
        , Event.onClick onClick
        ]
        ( icon iconName )


type alias SmallButton msg =
    { iconName : String
    , onClick : msg
    , active : Bool
    }


panel : List ( Attribute msg ) -> List ( SmallButton msg ) -> List ( Element msg ) -> Element msg
panel attrs buttons content =
    column
        (
            [ fontFamily
            , Background.color light
            , Border.rounded 36
            ]
            ++ attrs
        )

        [ row [ paddingXY 12 12, spacing 12 ] <| List.map smallButton buttons
        , column [ paddingXY 16 16, spacing 16 ] <| content
        ]



-- Colors


light : Color
light =
    rgb255 230 236 242


white : Color
white =
    rgb255 242 249 255


dimmedLight : Color -- Slightly darker verison of light; used for shadows
dimmedLight =
    rgb255 184 200 217


blue : Color
blue =
    rgb255 0 115 230


gray : Color
gray =
    rgb255 96 112 128



-- Misc


outset : Attribute msg
outset =
    multiShadows
        [
            { offset = ( 2, 2 )
            , blur = 2
            , spread = 0
            , color = dimmedLight
            }
        ,
            { offset = ( -2, -2 )
            , blur = 2
            , spread = 0
            , color = white
            }
        ]


fontFamily : Attribute msg
fontFamily =
    Font.family
        [ Font.typeface "-apple-system"
        , Font.typeface "BlinkMacSystemFont"
        , Font.typeface "Helvetica"
        , Font.sansSerif
        ]


multiShadows : List CssShadow -> Attribute msg
multiShadows shadows =
    let
        colorStr : { red : Float, green : Float, blue : Float, alpha : Float } -> String
        colorStr c =
            let
                rgbStr : String
                rgbStr =
                    [ c.red, c.green, c.blue ]
                        |> List.map ( (*) 255  )
                        |> List.map String.fromFloat
                        |> String.join ","
            in
                "rgb(" ++ rgbStr ++ ")"

        positionStr : CssShadow -> String
        positionStr { offset, blur, spread } =
            case offset of
                ( x, y ) ->
                    [ x, y, blur, spread ]
                        |> List.map String.fromInt
                        |> List.map ( \s -> s ++ "px" )
                        |> String.join " "

        shadowStr : CssShadow -> String
        shadowStr shadow =
            ( positionStr shadow ) ++ " " ++ ( colorStr <| toRgb shadow.color )

        cssStr : String
        cssStr =
            shadows
                |> List.map shadowStr
                |> String.join ","
    in
        htmlAttribute <| HtmlAttr.style "box-shadow" cssStr


type alias CssShadow =
    { offset : ( Int, Int )
    , blur : Int
    , spread : Int
    , color : Color
    }
