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



-- Init


init : World -> Model
init world =
    { world = world
    , currentTab = Collapsed
    }



-- Update


type Msg
    = SwitchTab Tab


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        SwitchTab tab ->
            ( { model | currentTab = tab }, Cmd.none )



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- View


view : Model -> Html Msg
view model =
    layout
        [
        ]
        ( body model )


body : Model -> Element Msg
body model =
    row
        [ width fill
        , height fill
        , paddingXY 16 16
        ]

        [ panel
            (
                [ alignRight
                , alignBottom
                , width <| px 256
                ]
            )
            ( inspectorButtons model.currentTab )
            ( viewInspector model )
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


inspectorButtons : Tab -> List ( SmallButton Msg )
inspectorButtons currentTab =
    [ tabButton "caret-down" Collapsed currentTab
    , tabButton "project-diagram" DebugView currentTab
    ]


tabButton : String -> Tab -> Tab -> SmallButton Msg
tabButton iconName tab currentTab =
    SmallButton iconName ( SwitchTab tab ) ( tab == currentTab )
