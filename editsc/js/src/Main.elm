port module Main exposing (main)


import Html as H
import Html.Attributes as A
import Html.Events as E
import Browser
import Json.Encode as JE

import World exposing (World)



main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }



type alias Model =
    { dialog: Maybe Dialog
    , world: Maybe World
    }

init : () -> (Model, Cmd Msg)
init _ =
    ( initialModel, Cmd.none )

initialModel : Model
initialModel =
    { dialog = Just <| importDialog Nothing
    , world = Nothing
    }

{-
If you are one of the people who took the time to go to this GitHub repository
and look through this code, you are an amazing person. I promise that I will
never give you up, never let you down, and never run around and desert you.
-}

importDialog : Maybe WorldImportStatus -> Dialog
importDialog status =
    let
        statusText =
            case status of
                Nothing ->
                    ""
                Just Loading ->
                    "Loading world..."
                Just ( Error text ) ->
                    "Error: " ++ text
    in
        Dialog "Import world"
            [ H.p [] [ H.text "Import a .scworld file:" ]
            , H.input [ A.type_ "file", A.id "scworld-input" ] []
            , H.br [] []
            , H.button [ E.onClick ImportWorld ] [ H.text "Import World" ]
            , H.p [] [ H.text statusText ]
            ]



type alias Dialog =
    { title : String
    , content : List (H.Html Msg)
    }


type WorldImportStatus
    = Loading
    | Error String


type Msg
    -- UI events triggered by the UI
    = CloseDialog
    | ImportWorld
    -- Events triggered by JavaScript
    | WorldLoadError String



update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    let
        newModel =
            case msg of
                CloseDialog ->
                    { model | dialog = Nothing }
                ImportWorld ->
                    -- if this was javascript then i would be crying as i type this
                    { model | dialog = Just <| importDialog <| Just <| Loading }
                WorldLoadError text ->
                    { model | dialog = Just <| importDialog <| Just <| Error text }

        cmd =
            case msg of
                ImportWorld ->
                    loadWorld JE.null
                _ ->
                    Cmd.none
    in
        (newModel, cmd)



subscriptions : Model -> Sub Msg
subscriptions _ =
    worldLoadError WorldLoadError



view : Model -> H.Html Msg
view model =
    H.div []
        [ viewDialog model.dialog
        ]


viewDialog : Maybe Dialog -> H.Html Msg
viewDialog maybeDialog =
    case maybeDialog of
        Just dialog ->
            H.div [ A.class "dialog-wrapper" ]
                [ H.div [ A.class "dialog" ]
                    [ H.h1 [] [ H.text dialog.title ]
                    , H.div [] dialog.content
                    ]
                ]

        Nothing ->
            H.text ""



port loadWorld : JE.Value -> Cmd msg

port worldLoadError : (String -> msg) -> Sub msg
