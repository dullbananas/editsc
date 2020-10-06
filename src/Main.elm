module Main exposing (main)

import Browser
import Tuple exposing (pair)
import Html

import Ui exposing (Ui)
import Port
import WorldImporter exposing (WorldImporter)



-- Main --


main : Program () Model Msg
main =
    Browser.document
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



-- Model & Msg --


type alias Model =
    { menu : Menu
    , previousMenus : List Menu
    }


type Msg
    = GoBack
    
    | ScworldFileSubmitted
    | GotWorldFiles { project : Port.Value, chunks : Port.Value }

    | PortDecodeError Port.DecodeError


init : () -> ( Model, Cmd Msg )
init _ =
    pair
        { menu = FileImport WorldImporter.Waiting
        , previousMenus = []
        }
        Cmd.none


subscriptions : Model -> Sub Msg
subscriptions model =
    ( case model.menu of
        FileImport state ->
            WorldImporter.sub state
                { gotFiles = GotWorldFiles
                }

        {-_ ->
            always Sub.none-}
    ) PortDecodeError



-- Update --


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GoBack ->
            case model.previousMenus of
                x :: xs ->
                    pair
                        { model
                        | menu = x
                        , previousMenus = xs
                        } Cmd.none

                [] ->
                    pair model Cmd.none
        
        ScworldFileSubmitted ->
            pair
                { model
                | menu = FileImport WorldImporter.Extracting
                }
                WorldImporter.startExtracting
        
        GotWorldFiles ({ project, chunks } as files) ->
            Debug.todo "got world files"
            {-WorldImporter.handleFiles files
                ( \state ->
                    { model | menu = FileImport state }
                )-}
            {-if WorldImporter.filePresent chunks
            && WorldImporter.filePresent project
                then
                else
                    pair
                        { model
                        | menu = FileImport WorldImport-}
        
        PortDecodeError error ->
            let _ = Debug.log "Port decode error" error in
            pair
                model
                Cmd.none



-- View & Menus --


view : Model -> Browser.Document Msg
view model =
    Ui.document <| Ui.Col <|
        [ case List.head model.previousMenus of
            Just previousMenu ->
                --Ui.Button ("< "++menuTitle previousMenu) GoBack
                Ui.Col []

            Nothing ->
                Ui.Col []

        --, Ui.H1 (menuTitle model.menu)
        , Ui.BodyText [ Ui.Text <| "Title:"++menuTitle model.menu ]
        , Ui.Col <| menuBody model
        ]


type Menu
    = FileImport WorldImporter


menuTitle : Menu -> String
menuTitle menu =
    case menu of
        FileImport state ->
            "Import world"


menuBody : Model -> List (Ui Msg)
menuBody model =
    case model.menu of
        FileImport state ->
            [ Ui.FileInput "scworldFile"
            , Ui.Button ScworldFileSubmitted "Import world"
            , Ui.BodyText [ Ui.Text <| Debug.toString state ]
            ]
