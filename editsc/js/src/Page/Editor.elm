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
    , uiVisibility : Visibility
    , theme : Theme
    , menu : Menu
    --, jsInfo : String
    }


type Menu
    = MainMenu
    | SaveWorld { fileName : String }


type Visibility
    = Collapsed
    | Expanded


{-type Tab
    = Collapsed
    | DebugView
    | Saver SaverModel


type alias SaverModel =
    { fileName : String
    }


initSaver : SaverModel
initSaver =
    { fileName = "name.scworld"
    }-}


-- Init


init : World -> Model
init world =
    { world = world
    , uiVisibility = Collapsed
    , theme = Light
    , menu = MainMenu
    }



-- Update


type Msg
    = ToggleUi Visibility
    | UpdateMenu Menu
    | SaveWorldMsg String
    --= SwitchTab Tab
    --| ChangeSaveName String
    --| GotJsInfo String


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        ToggleUi visibility ->
            ( { model | uiVisibility = visibility }
            , Cmd.none
            )

        UpdateMenu menu ->
            ( { model | menu = menu }
            , Cmd.none
            )

        SaveWorldMsg fileName ->
            ( model
            , Port.saveWorld
                { fileName = fileName
                , xml = World.toXmlString model.world
                }
            )
        --SwitchTab tab ->
            --( { model | currentTab = tab }, Cmd.none )

        {-ChangeSaveName fileName ->
            ( { model | currentTab = Saver { initSaver | fileName = fileName } }
            , Cmd.none
            )


        --GotJsInfo string ->
            --( { model | jsInfo = string }, Cmd.none )-}



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [-- Port.jsInfo GotJsInfo
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
        , id "ui"
        , clipY
        ]
        ( body model )


uiAttrs : Theme -> List (Attribute Msg)
uiAttrs theme =
    [ alignRight
    ] ++ box theme


type alias InspectorView =
    { back : Maybe Menu
    , body : List (Element Msg)
    }


body : Model -> Element Msg
body model =
    column
        [ height fill
        , paddingXY 16 16
        , alignRight
        , alignTop
        , width <| maximum (512-128-64) fill
        , spacing 4
        ]

        [ case model.uiVisibility of
            Collapsed ->
                column
                    ( {-explain Debug.todo ::-} uiAttrs model.theme )

                    [ button
                        model.theme
                        { btn | iconName = "caret-down" }
                        ( ToggleUi Expanded )
                    ]

            Expanded ->
                let
                    inspectorView : InspectorView
                    inspectorView =
                        viewInspector model

                    back : List (Element Msg)
                    back =
                        case inspectorView.back of
                            Nothing ->
                                []

                            Just parent ->
                                List.singleton <| backButton
                                    ( menuTitle parent )
                                    ( UpdateMenu parent )

                in

                column
                (
                    [ spacing 8
                    , width fill
                    , height <| maximum 384 fill
                    , scrollbarY
                    ] ++ uiAttrs model.theme
                ) <|

                [ row
                    [ width fill
                    ]

                    [ heading H1 <| menuTitle model.menu
                    , el [ alignRight, alignTop ]
                        ( button
                            model.theme
                            { btn | iconName = "caret-up" }
                            ( ToggleUi Collapsed )
                        )
                    ]

                ] ++ back ++
                [ column
                    [ spacing 16
                    , width fill
                    ]

                    ( inspectorView.body )
                ]
        ]


menuTitle : Menu -> String
menuTitle menu =
    case menu of
        MainMenu ->
            "Main Menu"

        SaveWorld _ ->
            "Save World"


viewInspector : Model -> InspectorView
viewInspector model =
    case model.menu of
        MainMenu ->
            { back = Nothing
            , body =
                [ button
                    model.theme
                    { btn | iconName = "file-download", label = "Save world..." }
                    ( UpdateMenu <| SaveWorld
                        { fileName = model.world.config.worldName ++ ".scworld" }
                    )
                ]
            }

        SaveWorld { fileName } ->
            { back = Just MainMenu
            , body =
                [ textInput
                    { txt | content = fileName, name = "Filename" }
                    ( \newName ->
                        UpdateMenu <| SaveWorld { fileName = newName }
                    )
                , button
                    model.theme
                    { btn | iconName = "file-download", label = "Save" }
                    ( SaveWorldMsg fileName )
                ]
            }
    {-case model.currentTab of
        Collapsed ->
            []

        DebugView ->
            [ heading H1 "Debug view"
            , bodyText <| Debug.toString model.world
            ]

        Saver { fileName } ->
            [ heading H1 "Save world"
            , button
                model.theme
                { btn | iconName = "file-download", label = "Save" }
                ( SaveWorld fileName )
            ]-}


{-inspectorButtons : Model -> List ( Element Msg )
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
        ( SwitchTab initTab )-}
