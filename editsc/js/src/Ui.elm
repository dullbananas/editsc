module Ui exposing
    ( heading
    , bodyText
    , bodyLink
    , fileInput
    , button
    , icon
    , panel
    , textInput
    , tabButtonRow
    , box

    , HeadingLevel(..)
    , Theme(..)
    , Button
    , TextInput

    , btn
    , txt

    , neuBackground

    , id
    )

import Element exposing (..)
import Element.Region as Region
import Element.Font as Font
import Element.Border as Border
import Element.Events as Event
import Element.Background as Background
import Element.Input as Input
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


bodyLink : String -> String -> Element msg
bodyLink label url =
    paragraph
        [ fontFamily
        , Font.size 16
        ]
        [ link [] { url = url, label = text label } ]


fileInput : String -> Element msg
fileInput idName =
    el [] <| html <| Html.input
        [ HtmlAttr.type_ "file"
        , HtmlAttr.id idName
        ]
        []


button : Theme -> Button -> msg -> Element msg
button theme { iconName, label, active } clickMsg =
    let
        attrs =
            [ fontFamily
            , height <| px 48
            , outset theme
            , Font.size 24
            , Border.rounded 24
            , Event.onClick clickMsg
            , Font.color <| if active then blue else gray
            , Background.color <| neuForeground theme
            ]
    in
        case label of
            "" ->
                el
                    ( attrs ++ [ width <| px 48 ] )
                    ( el [ centerX, centerY ] <| icon iconName )

            labelText ->
                row
                    (
                        attrs ++
                        [ paddingXY 16 0
                        , spacing 16
                        , Font.size 16
                        ]
                    )
                    [ icon iconName, text labelText ]

type alias Button =
    { iconName : String
    , label : String
    , active : Bool
    }

btn : Button
btn =
    { iconName = "arrow-right"
    , label = ""
    , active = False
    }


icon : String -> Element msg
icon iconName =
    el
        []

        <| html <| Html.i
            [ HtmlAttr.class "fas"
            , HtmlAttr.class <| "fa-" ++ iconName
            ]
            []


panel : Theme -> List ( Attribute msg ) -> List ( Element msg ) -> List ( Element msg ) -> Element msg
panel theme attrs buttons content =
    column
        ( spacing 16 :: attrs ++ box theme )

        [ tabButtonRow buttons
        , column [ spacing 16 ] <| content
        ]


tabButtonRow : List ( Element msg ) -> Element msg
tabButtonRow =
    row [ spacing 8 ]


box : Theme -> List ( Attribute msg )
box theme =
    [ fontFamily
    , Background.color <| neuBackground theme
    , Border.rounded 36
    , paddingXY 12 12
    , Border.shadow
        { offset = ( 0, 4 )
        , size = 0
        , blur = 8
        , color = rgba255 0 0 0 0.5
        }
    ]


textInput : TextInput -> ( String -> msg ) -> Element msg
textInput { content, name } onChange =
    Input.text
        [ fontFamily
        , Background.color maxWhite
        , Border.rounded 24
        , Border.width 0
        ]
        { onChange = onChange
        , text = content
        , placeholder = Just <|
            Input.placeholder
                [ alpha 0.5
                ]
                ( if content == "" then text name else none )
        , label = Input.labelHidden name
        }

type alias TextInput =
    { content : String
    , name : String
    }

txt : TextInput
txt =
    { content = ""
    , name = ""
    }



-- Theme


type Theme
    = Light



-- Neumorphism Colors


neuBackground : Theme -> Color
neuBackground theme =
    case theme of
        Light ->
            rgb255 235 235 235


neuForeground : Theme -> Color
neuForeground theme =
    case theme of
        Light ->
            rgb255 242 242 242


neuShadowLight : Theme -> Color
neuShadowLight theme =
    case theme of
        Light ->
            rgb255 255 255 255


neuShadowDark : Theme -> Color
neuShadowDark theme =
    case theme of
        Light ->
            rgb255 230 230 230



-- Foreground/misc colors


maxWhite : Color
maxWhite =
    rgb255 255 255 255


blue : Color
blue =
    rgb255 0 119 255


gray : Color
gray =
    rgb255 128 118 128



-- Misc


outset : Theme -> Attribute msg
outset theme =
    multiShadows
        [
            { offset = ( 4, 4 )
            , blur = 4
            , spread = 0
            , color = neuShadowDark theme
            , inset = False
            }
        ,
            { offset = ( -4, -4 )
            , blur = 4
            , spread = 0
            , color = neuShadowLight theme
            , inset = False
            }
        ]


{-inset : Attribute msg
inset =
    multiShadows
        [
            { offset = ( 2, 2 )
            , blur = 2
            , spread = 0
            , color = dimmedLight
            , inset = True
            }
        ,
            { offset = ( -2, -2 )
            , blur = 2
            , spread = 0
            , color = white
            , inset = True
            }
        ]-}


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
            ( if shadow.inset then "inset " else "" )
            ++ ( positionStr shadow ) ++ " "
            ++ ( colorStr <| toRgb shadow.color )

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
    , inset : Bool
    }


id : String -> Attribute msg
id name =
    htmlAttribute <| HtmlAttr.id name
