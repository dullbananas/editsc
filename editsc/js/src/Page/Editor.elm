module Page.Editor exposing
    ( Model
    , Msg
    , update
    , init
    , view
    , subscriptions
    )

import Port exposing (BlockArrayCorner(..))
import Ui exposing (..)
import World exposing (World)
import BlocksData

import Element exposing (..)
import Element.Background as Background
import Element.Region as Region
import Element.Font as Font
import Element.Lazy as Lazy
import Element.Border as Border
import Html exposing (Html)
import Html.Attributes
import Touch
import Array exposing (Array)
import Task



-- Model


type alias Model =
    { world : String
    , uiVisibility : Visibility
    , theme : Theme
    , menu : Menu
    , chunksToRender : List Int
    , extensionActions : List Port.ActionButton
    , touch : Touch.Model Msg
    , progress : Float
    , blockTypes : List BlocksData.BlockType
    }


type Menu
    = MainMenu
    | SaveWorld { fileName : String }
    | SelectSingleBlock
    | SelectBlockArray ( Maybe BlockArrayCorner )
    | ExtensionUi
        { title : String
        , url : String
        , components : Array Port.UiComponent
        , previousMenu : Menu
        }


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
        , extensionActions = []
        , touch = Touch.initModel
            [ Touch.onMove { fingers = 1 } MovedOneFinger
            , Touch.onMove { fingers = 2 } MovedTwoFingers
            , Touch.onPinch Pinched
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
    = BatchMsg ( List Msg )

    | ToggleUi Visibility
    | UpdateMenu Menu

    | SaveWorldMsg String

    | GotBlocksData ( BlocksData.RequestResult )

    | DoExtensionAction { workerUrl : String, id : Int, actionType : Port.ActionType }
    | ExtensionButtonClicked String Int
    | UpdateBlockInput String Int Int
    | UpdateComponent Int ( Port.UiComponent )
    | PortMsg Port.DecoderResult

    | TouchMsg Touch.Msg
    | MovedOneFinger Float Float
    | MovedTwoFingers Float Float
    | Pinched Float


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        BatchMsg [] ->
            ( model, Cmd.none )

        BatchMsg (x :: xs) ->
            let
                ( newModel, cmd ) = update x model
            in
                ( newModel, Cmd.batch
                    [ cmd
                    , Task.succeed () |> Task.perform ( always (BatchMsg xs) )
                    ] )

        ToggleUi visibility ->
            ( { model | uiVisibility = visibility }
            , Cmd.none
            )

        UpdateMenu menu ->
            ( { model | menu = menu }
            , Cmd.batch
                [ Port.send <| Port.SetSelectionMode <| case menu of
                    SelectSingleBlock -> Port.SelectingSingleBlock
                    SelectBlockArray corner -> Port.SelectingArray corner
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
                Port.NewAction action ->
                    Tuple.pair
                        { model
                        | extensionActions = action :: model.extensionActions
                        }
                        Cmd.none

                Port.ShowUi url title components ->
                    Tuple.pair
                        { model | menu = ExtensionUi
                            { title = title
                            , url = url
                            , components = components
                            , previousMenu = model.menu
                            }
                        }
                        Cmd.none

                Port.Progress portion ->
                    Tuple.pair
                        { model | progress = portion }
                        Cmd.none

                _ ->
                    ( model, Cmd.none )

        PortMsg ( Err error ) ->
            Debug.log "porterr" error
                |> always ( model, Cmd.none )

        UpdateComponent index newComponent ->
            case model.menu of
                ExtensionUi ui ->
                    Tuple.pair
                        { model
                        | menu = ExtensionUi
                            --{ ui | components = mapArrayEl f index ui.components }
                            { ui | components = Array.set index newComponent ui.components }
                        } Cmd.none

                _ ->
                    ( model, Cmd.none )

        DoExtensionAction action ->
            Tuple.pair
                model
                ( Port.send (Port.DoAction action) )

        ExtensionButtonClicked url callbackId ->
            Tuple.pair
                model
                ( Port.send (Port.TriggerButton url callbackId) )

        UpdateBlockInput url callbackId newValue ->
            Tuple.pair
                model
                ( Debug.log "this gonna be sent" <| Port.send (Port.UpdateBlockInput url callbackId newValue) )

        TouchMsg touchMsg ->
            Touch.update
                touchMsg
                model.touch
                ( \touchModel -> { model | touch = touchModel } )

        MovedOneFinger x y ->
            Tuple.pair
                { model
                | menu = case model.menu of
                    ExtensionUi { previousMenu } -> previousMenu
                    other -> other
                }
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

        Pinched amount ->
            Tuple.pair
                { model
                | menu = case model.menu of
                    ExtensionUi { previousMenu } -> previousMenu
                    other -> other
                }
                ( Port.send <| Port.AdjustCamera
                    [
                        { x = 0
                        , y = 0
                        , z = -amount*0.05
                        , mode = Port.Translate
                        }
                    ]
                )

        MovedTwoFingers x y ->
            Tuple.pair
                { model
                | menu = case model.menu of
                    ExtensionUi { previousMenu } -> previousMenu
                    other -> other
                }
                ( Port.send <| Port.AdjustCamera
                    [
                        { x = 0
                        , y = -x*0.006
                        , z = 0
                        , mode = Port.RotateWorld
                        }
                    ,
                        { x = -y*0.006
                        , y = 0
                        , z = 0
                        , mode = Port.Rotate
                        }
                    ]
                )


mapArrayEl : ( a -> a ) -> Int -> Array a -> Array a
mapArrayEl f index array =
    case Array.get index array of
        Just item ->
            Array.set index (f item) array

        Nothing ->
            array



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
        , clip
        --, scrollbarY
        , behindContent <| el
            [ inFront <| html <|
                Touch.element
                    [ Html.Attributes.style "width" "100vw"
                    , Html.Attributes.style "height" "100vh"
                    ] TouchMsg
            ]
            ( chunkCanvas )
        ]
        ( body model )


chunkCanvas : Element Msg
chunkCanvas =
    html <| Html.node "chunk-canvas" [] []


uiAttrs : Theme -> List (Attribute Msg)
uiAttrs theme =
    [ alignRight
    --, scrollbarY
    , height fill
    --, explain Debug.todo
    , scrollbarY
    ] ++ box theme


type alias InspectorView =
    { back : Maybe Menu
    , body : List (Element Msg)
    }


body : Model -> Element Msg
body model =
    el
        [ paddingXY 20 20
        , alignRight
        , alignTop
        , width <| maximum (512-128-64) fill
        , spacing 4
        --, height <| case model.uiVisibility of
        --    Expanded -> fill
        --    _ -> shrink
        , scrollbarY
        , clip
        --, height fill
        ]

        <| case model.uiVisibility of
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
                    --, height <| maximum (256+128) fill
                    --, scrollbarY
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
        --]


menuTitle : Menu -> String
menuTitle menu =
    case menu of
        MainMenu ->
            "Main Menu"

        SaveWorld _ ->
            "Save World"

        SelectSingleBlock ->
            "Select block"

        SelectBlockArray _ ->
            "Select blocks"

        ExtensionUi { title } ->
            title


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
                    { btn | iconName = "cubes", label = "Select multiple blocks" }
                    ( UpdateMenu <| SelectBlockArray <| Just Blue )
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
                List.filterMap ( actionBtn Port.BlockAction ) model.extensionActions
            }

        SelectBlockArray corner ->
            let
                ( blue, green ) =
                    case corner of
                        Just Blue -> ( True, False )
                        Just Green -> ( False, True )
                        Nothing -> ( False, False )

                cornerBtn label corner_ =
                    Lazy.lazy3 button
                        model.theme
                        { btn
                        | iconName = "cube"
                        , label =
                            if corner == Just corner_ then
                                "Adjusting "++label++" corner"
                            else
                                "Adjust "++label++" corner"
                        , active = corner == Just corner_
                        }
                        ( UpdateMenu <| SelectBlockArray <|
                            if corner == Just corner_ then
                                Nothing
                            else
                                Just <| corner_
                        )
            in
            { back = Just MainMenu
            , body =
                [ cornerBtn "blue" Blue
                , cornerBtn "green" Green
                ] ++ List.filterMap ( actionBtn Port.BlockArrayAction ) model.extensionActions
            }

        ExtensionUi { url, components, previousMenu } ->
            { back = Just previousMenu
            , body = Array.indexedMap ( viewComponent model url ) components |> Array.toList
            }


viewComponent : Model -> String -> Int -> Port.UiComponent -> Element Msg
viewComponent model url index component =
    case component of
        Port.Button { name, icon, callbackId } ->
            Lazy.lazy3 button
                model.theme
                { btn | iconName = icon, label = name }
                ( ExtensionButtonClicked url callbackId )

        Port.BlockInput ({ name, callbackId, value, expanded } as opts) ->
            column
                [ spacing 8
                , Border.width 1
                , Border.color <| rgba255 0 0 0 0.2
                , Border.rounded 8
                , width fill
                , paddingXY 8 8
                ]
                [ heading H2 name
                {-, Lazy.lazy3 button
                    model.theme
                    { btn
                    | iconName = "pen"
                    , label = "Type: " ++ BlocksData.typeName model.blockTypes value
                    }
                    ( UpdateComponent )-}
                , dropdownList
                    { label = "Type"
                    , options = List.map .id model.blockTypes
                    , currentOption = value
                    , optionToString = BlocksData.typeName model.blockTypes
                    , updateVisibility = \newExpanded -> UpdateComponent index
                        <| Port.BlockInput { opts | expanded = newExpanded }
                    , updateValue = \newValue -> BatchMsg
                        [ UpdateComponent index
                            <| Port.BlockInput { opts | value = newValue }
                        , UpdateBlockInput url callbackId newValue
                        ]
                    , expanded = expanded
                    }
                ]


actionBtn : Port.ActionType -> Port.ActionButton -> Maybe ( Element Msg )
actionBtn correctType { id, name, icon, workerUrl, actionType } =
    if correctType == actionType then
        Just <| button
            Light
            { btn | iconName = icon, label = name }
            ( DoExtensionAction { workerUrl = workerUrl, id = id, actionType = correctType } )
    else
        Nothing
