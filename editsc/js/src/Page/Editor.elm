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
    { world : String
    , uiVisibility : Visibility
    , theme : Theme
    , menu : Menu
    , chunksToRender : List Int
    , singleBlockActions : List Port.SingleBlockAction
    --, jsInfo : String
    }


type Menu
    = MainMenu
    | SaveWorld { fileName : String }
    | SelectSingleBlock


type Visibility
    = Collapsed
    | Expanded
    | Loading String



-- Init


init : String -> ( Model, Cmd Msg )
init world =
    Tuple.pair
        { world = world
        , uiVisibility = Loading "Loading"
        , theme = Light
        , menu = MainMenu
        , chunksToRender = []
        , singleBlockActions = []
        }
        ( Port.startRendering () )



-- Update


type Msg
    = ToggleUi Visibility
    | UpdateMenu Menu
    | SaveWorldMsg String
    | Progress Port.Progress
    | NewSingleBlockAction Port.SingleBlockAction
    | DoSingleBlockAction { url : String, id : Int }


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        ToggleUi visibility ->
            ( { model | uiVisibility = visibility }
            , Cmd.none
            )

        UpdateMenu menu ->
            ( { model | menu = menu }
            , Cmd.batch
                [ Port.selectionState <| case menu of
                    SelectSingleBlock -> 1
                    _ -> 0
                ]
            )

        SaveWorldMsg fileName ->
            ( model
            , Port.saveWorld
                { fileName = fileName
                --, xml = World.toXmlString model.world
                , xml = model.world
                }
            )

        Progress progress ->
            let
                done : Bool
                done =
                    progress.soFar == progress.total
            in Tuple.pair
                { model
                | uiVisibility =
                    if done then Expanded else Loading <|
                        progress.message ++ ": "
                            ++ String.fromInt progress.soFar
                            ++ "/" ++ String.fromInt progress.total
                }
                ( if done then Cmd.none else Port.continue progress.soFar )

        NewSingleBlockAction action ->
            Tuple.pair
                { model
                | singleBlockActions = action :: model.singleBlockActions
                }
                Cmd.none

        DoSingleBlockAction action ->
            Tuple.pair
                model
                ( Port.doSingleBlockAction action )


-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Port.progress Progress
        , Port.newSingleBlockAction NewSingleBlockAction
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
            Loading message ->
                column
                    ( uiAttrs model.theme )
                    [ bodyText message ]

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

                    [ column
                        [ spacing 8
                        , alignTop
                        , paddingXY 0 6
                        ]
                        <| ( heading H1 <| menuTitle model.menu ) :: back
                    , el [ alignRight, alignTop ]
                        ( button
                            model.theme
                            { btn | iconName = "caret-up" }
                            ( ToggleUi Collapsed )
                        )
                    ]

                , column
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

        SelectSingleBlock ->
            "Select block"


viewInspector : Model -> InspectorView
viewInspector model =
    case model.menu of
        MainMenu ->
            { back = Nothing
            , body =
                [ button
                    model.theme
                    { btn | iconName = "cube", label = "Select block" }
                    ( UpdateMenu SelectSingleBlock )
                , button
                    model.theme
                    { btn | iconName = "file-download", label = "Save world..." }
                    ( UpdateMenu <| SaveWorld
                        --{ fileName = model.world.config.worldName ++ ".scworld" }
                        { fileName = "World.scworld" }
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

        SelectSingleBlock ->
            { back = Just MainMenu
            , body =
                List.map ( singleBlockBtn model.theme ) model.singleBlockActions
            }


singleBlockBtn : Theme -> Port.SingleBlockAction -> Element Msg
singleBlockBtn theme { id, name, icon, url } =
    button
        theme
        { btn | iconName = icon, label = name }
        ( DoSingleBlockAction { url = url, id = id } )
