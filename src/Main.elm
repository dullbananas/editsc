module Main exposing (main)

import Browser
import Tuple exposing (pair)
import Html

import Ui exposing (Ui)
import Filesystem



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
    { projectXml : String
    , currentMenu : Menu
    , previousMenus : List Menu
    }


type Msg
    = GoBack


init : () -> ( Model, Cmd Msg )
init _ =
    pair
        { projectXml = ""
        , chunks = []
        , currentMenu = FileBrowser
        , previousMenus = []
        }
        Cmd.none


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- Update --


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GoBack ->
            case model.previousMenus of
                x :: xs ->
                    pair
                        { model
                        | currentMenu = x
                        , previousMenus = xs
                        } Cmd.none

                [] ->
                    pair model Cmd.none



-- View & Menus --


view : Model -> Browser.Document Msg
view model =
    Ui.document <| Ui.Col <|
        [ case List.head model.previousMenus of
            Just previousMenu ->
                Ui.Button ("< "++menuTitle previousMenu) GoBack

            Nothing ->
                Ui.Col []

        , Ui.H1 (menuTitle model.currentMenu)
        , Ui.Col <| menuBody model
        ]


type Menu
    = FileBrowser


menuTitle : Menu -> String
menuTitle menu =
    case menu of
        FileBrowser ->
            "Files"


menuBody : Menu -> List (Ui Msg)
menuBody model =
    case model.menu of
        FileBrowser ->
            [ Ui.BodyText [ Ui.Text "file browser todo" ]
            ]
