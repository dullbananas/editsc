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
import BlocksData

import Element exposing (..)
import Element.Background as Background
import Element.Region as Region
import Element.Font as Font
import Element.Lazy as Lazy
import Html exposing (Html)
import Html.Attributes
import Touch



-- Model


type alias Model =
    { world : String
    , uiVisibility : Visibility
    , theme : Theme
    , menu : Menu
    , chunksToRender : List Int
    , singleBlockActions : List Port.SingleBlockAction
    , touch : Touch.Model Msg
    , progress : Float
    , blockTypes : List BlocksData.BlockType
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
        , uiVisibility = Expanded
        , theme = Light
        , menu = MainMenu
        , chunksToRender = []
        , singleBlockActions = []
        , touch = Touch.initModel
            [ Touch.onMove { fingers = 1 } MovedOneFinger
            , Touch.onMove { fingers = 2 } MovedTwoFingers
            ]
        , progress = 0.0
        , blockTypes = []
        }
        ( Cmd.batch
            [ Port.send Port.SwitchedToEditor
            , BlocksData.request GotBlocksData
            ]
        )



-- Update


type Msg
    = ToggleUi Visibility
    | UpdateMenu Menu

    | SaveWorldMsg String

    | GotBlocksData ( BlocksData.RequestResult )

    | DoSingleBlockAction { workerUrl : String, id : Int }
    {- | Progress Port.Progress
    | NewSingleBlockAction Port.SingleBlockAction-}
    | PortMsg Port.DecoderResult

    | TouchMsg Touch.Msg
    | MovedOneFinger Float Float
    | MovedTwoFingers Float Float


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleUi visibility ->
            ( { model | uiVisibility = visibility }
            , Cmd.none
            )

        UpdateMenu menu ->
            ( { model | menu = menu }
            , Cmd.batch
                [ Port.send <| Port.SetSelectionMode <| case menu of
                    SelectSingleBlock -> Port.SelectingSingleBlock
                    _ -> Port.NotSelecting
                ]
            )

        SaveWorldMsg fileName ->
            ( model
            , Port.send <|
                Port.SaveScworld
                    { fileName = fileName
                    --, xml = World.toXmlString model.world
                    , projectFileContent = model.world
                    }
            )

        GotBlocksData result ->
            case result of
                Ok xml ->
                    ( { model | blockTypes = BlocksData.parse xml |> Debug.log "parsed" |> Result.withDefault [] }
                    , Cmd.none
                    )

                Err err ->
                    Debug.log "blocksdata error" err
                        |> always ( model, Cmd.none )

        PortMsg ( Ok portMsg ) ->
            case portMsg of
                Port.NewSingleBlockAction action ->
                    Tuple.pair
                        { model
                        | singleBlockActions = action :: model.singleBlockActions
                        }
                        Cmd.none

                Port.ShowUi components ->
                    Debug.log "components" components
                        |> always ( model, Cmd.none )

                Port.Progress portion ->
                    Tuple.pair
                        { model | progress = portion }
                        Cmd.none

                _ ->
                    ( model, Cmd.none )

        PortMsg ( Err error ) ->
            Debug.log "porterr" error
                |> always ( model, Cmd.none )

        DoSingleBlockAction action ->
            Tuple.pair
                model
                ( Port.send (Port.DoSingleBlockAction action) )

        TouchMsg touchMsg ->
            Touch.update
                touchMsg
                model.touch
                ( \touchModel -> { model | touch = touchModel } )

        MovedOneFinger x y ->
            Tuple.pair
                model
                ( Port.send <| Port.AdjustCamera
                    [
                        { x = x*0.05
                        , y = 0
                        , z = 0
                        , mode = Port.Translate
                        }
                    ,
                        { x = 0
                        , y = 0
                        , z = y*0.05
                        , mode = Port.Translate
                        }
                    ]
                )


        MovedTwoFingers x y ->
            Tuple.pair
                model
                ( Port.send <| Port.AdjustCamera
                    [
                        { x = 0
                        , y = -x*0.005
                        , z = 0
                        , mode = Port.RotateWorld
                        }
                    ,
                        { x = -y*0.005
                        , y = 0
                        , z = 0
                        , mode = Port.Rotate
                        }
                    ]
                )



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        {-[ Port.progress Progress
        , Port.newSingleBlockAction NewSingleBlockAction
        ]-}
        [ Port.sub PortMsg
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
        , behindContent <| html <|
            Touch.element
                [ Html.Attributes.style "width" "100vw"
                , Html.Attributes.style "height" "100vh"
                ] TouchMsg
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
        [ paddingXY 16 16
        , alignRight
        , alignTop
        , width <| maximum (512-128-64) fill
        , spacing 4
        , height <| case model.uiVisibility of
            Expanded -> fill
            _ -> shrink
        ]

        [ case model.uiVisibility of
            Loading message ->
                column
                    ( uiAttrs model.theme )
                    [ bodyText message ]

            Collapsed ->
                column
                    ( {-explain Debug.todo ::-} uiAttrs model.theme )

                    [ Lazy.lazy3 button
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
                                List.singleton <| Lazy.lazy2 backButton
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
                        ( Lazy.lazy3 button
                            model.theme
                            { btn | iconName = "caret-up" }
                            ( ToggleUi Collapsed )
                        )
                    ]

                , column
                    [ spacing 16
                    , width fill
                    ] <|

                    ( if model.progress < 1.0
                        then [ bodyText <| String.fromInt (floor<|model.progress*100) ++ "%" ]
                        else []
                    ) ++ inspectorView.body
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
                , Lazy.lazy3 button
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
singleBlockBtn theme { id, name, icon, workerUrl } =
    button
        theme
        { btn | iconName = icon, label = name }
        ( DoSingleBlockAction { workerUrl = workerUrl, id = id } )
