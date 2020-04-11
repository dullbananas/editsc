module Ui exposing
    ( heading
    , bodyText
    , fileInput
    , button
    , icon
    , panel
    , textInput

    , HeadingLevel(..)
    , Button
    , TextInput

    , btn
    , txt

    , light
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


fileInput : String -> Element msg
fileInput idName =
    el [] <| html <| Html.input
        [ HtmlAttr.type_ "file"
        , HtmlAttr.id idName
        ]
        []


button : Button -> msg -> Element msg
button { iconName, label, active } clickMsg =
    let
        attrs =
            [ fontFamily
            , height <| px 48
            , outset
            , Font.size 24
            , Border.rounded 24
            , Event.onClick clickMsg
            , Font.color <| if active then blue else gray
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


panel : List ( Attribute msg ) -> List ( Element msg ) -> List ( Element msg ) -> Element msg
panel attrs buttons content =
    column
        ( spacing 16 :: attrs ++ box )

        [ tabButtonRow buttons
        , column [ spacing 16 ] <| content
        ]


tabButtonRow : List ( Element msg ) -> Element msg
tabButtonRow =
    row [ spacing 8 ]


box : List ( Attribute msg )
box =
    [ fontFamily
    , Background.color light
    , Border.rounded 36
    , paddingXY 12 12
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



-- Colors


light : Color
light =
    rgb255 230 236 242


white : Color
white =
    rgb255 242 249 255


maxWhite : Color
maxWhite =
    rgb255 255 255 255


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
            , inset = False
            }
        ,
            { offset = ( -2, -2 )
            , blur = 2
            , spread = 0
            , color = white
            , inset = False
            }
        ]


inset : Attribute msg
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
