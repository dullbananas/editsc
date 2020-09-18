module Main exposing (main)

import Html exposing (Html)
import Browser

import World exposing (World)
import Page.Importer as Importer
import Page.Editor as Editor
import Port



-- Main


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }



-- Model


type Model
    = Importer Importer.Model
    | Editor Editor.Model



-- Update


type Msg
    = ImporterMsg Importer.Msg
    | EditorMsg Editor.Msg


update : Msg -> Model -> (Model, Cmd Msg)
update message model =
    case (message, model) of
        ( ImporterMsg msg, Importer importer ) ->
            let
                ( newModel, cmd ) =
                    Importer.update msg importer
            in
            case Importer.willSwitchToEditor <| newModel of
                Just world ->
                    -- Switch from import page to editor
                    Editor.init world
                        |> Tuple.mapFirst Editor
                        |> Tuple.mapSecond ( Cmd.map EditorMsg )

                Nothing ->
                    ( Importer newModel, cmd )

        ( EditorMsg msg, Editor editor ) ->
            Editor.update msg editor
                |> Tuple.mapFirst Editor
                |> Tuple.mapSecond ( Cmd.map EditorMsg )

        _ ->
            ( model, Cmd.none )



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    case model of
        Importer importer ->
            Importer.subscriptions importer |> Sub.map ImporterMsg

        Editor editor ->
            Editor.subscriptions editor |> Sub.map EditorMsg


-- View


view : Model -> Html Msg
view model =
    case model of
        Importer importer ->
            Importer.view importer |> Html.map ImporterMsg

        Editor editor ->
            Editor.view editor |> Html.map EditorMsg



-- Init


init : () -> (Model, Cmd Msg)
init _ =
    Tuple.pair
        ( Importer Importer.init )
        Cmd.none


