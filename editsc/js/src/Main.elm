port module Main exposing (main)


import Html as H
import Html.Attributes as A
import Html.Events as E
import Browser
import Json.Encode as JE



main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }



type alias Model =
    { dialog: Maybe Dialog
    }

init : () -> (Model, Cmd Msg)
init _ =
    ( initialModel, Cmd.none )

initialModel : Model
initialModel =
    { dialog = Just <| Standard <| importDialogContent Nothing
    }

importDialogContent : Maybe WorldImportStatus -> List (H.Html Msg)
importDialogContent status =
    let
        top =
            [ H.p [] [ H.text "Import a .scworld file:" ]
            , H.input [ A.type_ "file", A.id "scworld-input" ] []
            , H.br [] []
            , H.button [ E.onClick ImportWorld ] [ H.text "Import World" ]
            ]
    in
        case status of
            Nothing ->
                top
            Just Loading ->
                top ++ [ H.p [] [ H.text "Loading world..." ] ]
            Just ( Error text ) ->
                top ++ [ H.p [] [ H.text <| "Error: " ++ text ] ]



type Dialog
    = Standard ( List (H.Html Msg) )


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
                    { model | dialog = Just <| Standard <| importDialogContent <| Just Loading }
                WorldLoadError text ->
                    { model | dialog = Just <| Standard <| importDialogContent <| Just <| Error text }

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
viewDialog dialog =
    case dialog of
        Just ( Standard content ) ->
            dialogWrapper content

        Nothing ->
            H.text ""


dialogWrapper : List ( H.Html Msg ) -> H.Html Msg
dialogWrapper elements =
    H.div [ A.class "dialog-wrapper" ]
    [ H.div [ A.class "dialog" ] elements
    ]



port loadWorld : JE.Value -> Cmd msg

port worldLoadError : (String -> msg) -> Sub msg
