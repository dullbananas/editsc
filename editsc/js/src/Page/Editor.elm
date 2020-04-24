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
import Html exposing (Html)



-- Model


type alias Model =
    { world : World
    , currentTab : Tab
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
    }



-- Update


type Msg
    = SwitchTab Tab
    | ChangeSaveName String
    | SaveWorld String


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



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



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
        []
        ( body model )


body : Model -> Element Msg
body model =
    column
        [ width fill
        , height fill
        , paddingXY 16 16
        ]

        [ case model.currentTab of
            Collapsed ->
                el
                    (
                    [ id "inspector"
                    , alignBottom
                    , width <| maximum 400 fill
                    ] ++ box )

                    ( tabButtonRow <| inspectorButtons model.currentTab )

            _ ->
                column
                (
                [ spacing 16
                , alignBottom
                , width <| maximum 400 fill
                , id "inspector"
                ] ++ box )

                [ tabButtonRow <| inspectorButtons model.currentTab
                , column
                    [ spacing 16
                    , height fill
                    ]
                    ( viewInspector model )
                ]
        ]
        {-[ panel
            (
                [ alignRight
                , alignBottom
                , fill |> maximum 400 |> width
                , fill |> height
                ]
            )
            ( inspectorButtons model.currentTab )
            ( viewInspector model )
        ]-}


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
                { btn | iconName = "file-download", label = "Save" }
                ( SaveWorld fileName )
            ]


inspectorButtons : Tab -> List ( Element Msg )
inspectorButtons currentTab =
    let
        currentIndex : Int
        currentIndex =
            case currentTab of
                Collapsed -> 0
                DebugView -> 1
                Saver _ -> 2
    in
        [ tabButton "caret-down" Collapsed 0 currentIndex
        , tabButton "project-diagram" DebugView 1 currentIndex
        , tabButton "file-download" ( Saver initSaver ) 2 currentIndex
        ]


tabButton : String -> Tab -> Int -> Int -> Element Msg
tabButton iconName initTab index currentIndex =
    button
        { btn
        | iconName = iconName
        , active = ( index == currentIndex )
        }
        ( SwitchTab initTab )
