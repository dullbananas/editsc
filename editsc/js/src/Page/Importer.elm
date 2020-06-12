module Page.Importer exposing
    ( Model
    , Msg
    , update
    , init
    , view
    , subscriptions

    , willSwitchToEditor
    )

import Port
import Ui exposing (..)
import World exposing (World)
import ConversionError

import Element exposing (..)
import Element.Background as Background
import Element.Region as Region
import Html exposing (Html)



-- Model


type Model
    = NothingImported -- Before the import button is pressed
    | Extracting -- Waiting for zip to be extracted by JavaScript
    | WaitingForChunks String -- Waiting for chunks file to be parsed by JavaScript
    | SwitchToEditor String -- Used to tell Main module to switch to the editor page
    | Error String



-- Init


init : Model
init =
    NothingImported



-- Update


type Msg
    = StartImporting
    | GotProjectFile String
    | ExtractionError String
    | ChunksError String
    | ChunksReady


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        ExtractionError error ->
            ( Error <| "Could not read scworld file: " ++ error, Cmd.none )

        ChunksError error ->
            ( Error <| "Could not read chunks file: " ++ error, Cmd.none )

        StartImporting ->
            ( Extracting, Port.extractZip () )

        GotProjectFile content ->
            {-case World.fromXmlString content of
                Ok world ->
                    ( WaitingForChunks world, Port.parseChunks () )
                Err error ->
                    ( Error <| "Could not read project file: " ++ ConversionError.toString error, Cmd.none )-}
            ( WaitingForChunks content, Port.parseChunks () )

        ChunksReady ->
            case model of
                WaitingForChunks world ->
                    ( SwitchToEditor world, Cmd.none )
                _ ->
                    ( model, Cmd.none )


willSwitchToEditor : Model -> Maybe String
willSwitchToEditor model =
    case model of
        SwitchToEditor world ->
            Just world

        _ ->
            Nothing



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Port.gotProjectFile GotProjectFile
        , Port.extractionError ExtractionError
        , Port.chunksError ChunksError
        , Port.chunksReady ( always ChunksReady )
        ]



-- View


view : Model -> Html Msg
view model =
    layout
        [ Background.color <| neuBackground Light
        , id "ui"
        ]
        ( body model )


body : Model -> Element Msg
body model =
    column
        [ width fill
        , paddingXY 24 16
        , spacing 16
        ]

        [ heading H1 "EditSC"
        , bodyLink "GitHub repository" "https://github.com/dullbananas/editsc"
        , bodyText "Welcome to EditSC. Upload a .scworld file below to start editing."
        , fileInput "scworld-input"
        , el
            [ width <| px 120 ]
            <| button Light { btn | iconName = "file-import", label = "Import" } StartImporting
        , viewStatus model
        ]


viewStatus : Model -> Element Msg
viewStatus model =
    case model of
        Error error ->
            bodyText <| "Error: " ++ error

        Extracting ->
            bodyText "Loading: Extracting zip entries"

        WaitingForChunks _ ->
            bodyText "Loading: Parsing chunks file"

        _ ->
            none
