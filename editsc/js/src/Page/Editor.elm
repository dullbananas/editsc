module Page.Editor exposing
    ( Model
    , Msg
    , update
    , init
    , view
    , subscriptions
    )

import Port
import Ui exposing (..)
import World exposing (World)

import Element exposing (..)
import Element.Background as Background
import Element.Region as Region
import Element.Font as Font
import Html exposing (Html)



-- Model


type alias Model =
    { world : World
    , currentTab : Tab
    , theme : Theme
    , jsInfo : String
    }


type Tab
    = Collapsed
    | DebugView
    | Saver SaverModel


type alias SaverModel =
    { fileName : String
    }


initSaver : SaverModel
initSaver =
    { fileName = "name.scworld"
    }


-- Init


init : World -> Model
init world =
    { world = world
    , currentTab = Collapsed
    , theme = Light
    , jsInfo = "no info"
    }



-- Update


type Msg
    = SwitchTab Tab
    | ChangeSaveName String
    | SaveWorld String
    | GotJsInfo String


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        SwitchTab tab ->
            ( { model | currentTab = tab }, Cmd.none )

        ChangeSaveName fileName ->
            ( { model | currentTab = Saver { initSaver | fileName = fileName } }
            , Cmd.none
            )

        SaveWorld fileName ->
            ( model
            , Port.saveWorld
                { fileName = fileName
                , xml = World.toXmlString model.world
                }
            )

        GotJsInfo string ->
            ( { model | jsInfo = string }, Cmd.none )



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Port.jsInfo GotJsInfo
        ]



-- View


view : Model -> Html Msg
view model =
    layoutWith
        { options =
            [ focusStyle
                { borderColor = Nothing
                , backgroundColor = Nothing
                , shadow = Nothing
                }
            ]
        }
        [ height fill
        , width fill
        --, explain Debug.todo
        , id "ui"
        , clipY
        ]
        ( body model )


uiAttrs : Theme -> List (Attribute Msg)
uiAttrs theme =
    [ id "inspector"
    , alignRight
    ] ++ box theme


body : Model -> Element Msg
body model =
    column
        [ height fill
        , paddingXY 12 12
        , alignRight
        , alignTop
        , width <| maximum 384 fill
        , spacing 4
        , clipY
        ]

        [ case model.currentTab of
            Collapsed ->
                column
                    ( {-explain Debug.todo ::-} uiAttrs model.theme )

                    [ tabButtonRow <| inspectorButtons model ]

            _ ->
                column
                (
                    [ spacing 8
                    , width fill
                    , height <| maximum 384 fill
                    , clipY
                    ] ++ uiAttrs model.theme
                )

                [ tabButtonRow <| inspectorButtons model
                , column
                    [ spacing 16
                    --, height fill
                    , width fill
                    , scrollbarY
                    ]
                    ( viewInspector model )
                ]

        , el
            [ Font.color ( rgb 255 255 255 )
            , fontFamily
            , Font.size 14
            ]
            ( text model.jsInfo )
        ]


viewInspector : Model -> List ( Element Msg )
viewInspector model =
    case model.currentTab of
        Collapsed ->
            []

        DebugView ->
            [ heading H1 "Debug view"
            , bodyText <| Debug.toString model.world
            ]

        Saver { fileName } ->
            [ heading H1 "Save world"
            , textInput
                { txt | content = fileName, name = "Filename" }
                ChangeSaveName
            , button
                model.theme
                { btn | iconName = "file-download", label = "Save" }
                ( SaveWorld fileName )
            ]


inspectorButtons : Model -> List ( Element Msg )
inspectorButtons model =
    let
        currentIndex : Int
        currentIndex =
            case model.currentTab of
                Collapsed -> 0
                DebugView -> 1
                Saver _ -> 2

        tbtn : String -> Tab -> Int -> Element Msg
        tbtn =
            tabButton model.theme currentIndex
    in
        [ tbtn "caret-down" Collapsed 0
        , tbtn "project-diagram" DebugView 1
        , tbtn "file-download" ( Saver initSaver ) 2
        ]


tabButton : Theme -> Int -> String -> Tab -> Int -> Element Msg
tabButton theme currentIndex iconName initTab index =
    button
        theme
        { btn
        | iconName = iconName
        , active = ( index == currentIndex )
        }
        ( SwitchTab initTab )
