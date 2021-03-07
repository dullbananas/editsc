module Editsc.Model exposing
    ( Model
    , textDisplay

    , Msg

    , init
    , view
    , update
    , subscriptions
    )

import Browser
import Editsc.Model.Editor as Editor
import Editsc.Viewport as Viewport exposing (Viewport)
import Html exposing (Attribute, Html)
import Html.Attributes as Attr
import Task exposing (Task)



type Model
    = TextDisplay String
    | EditorDisplay Editor.Model





textDisplay : String -> Model
textDisplay =
    TextDisplay


type Msg
    = EditorMsg Editor.Msg
    | ShowText String


init : () -> (Model, Cmd Msg)
init =
    Editor.init >> map EditorMsg EditorDisplay


update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case (msg, model) of
        (EditorMsg eMsg, EditorDisplay eModel) ->
            Editor.update eMsg eModel
                |> map EditorMsg EditorDisplay
        
        (EditorMsg _, _) ->
            (model, Cmd.none)
        
        (ShowText content, _) ->
            (TextDisplay content, Cmd.none)


map : (msgA -> msgB)
    -> (modelA -> modelB)
    -> (modelA, Cmd msgA)
    -> (modelB, Cmd msgB)
map mapMsg mapModel (model, cmd) =
    ( mapModel model
    , Cmd.map mapMsg cmd
    )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none


view : Model -> Browser.Document Msg
view model =
    { title = "EditSC"
    , body =
        case model of
            TextDisplay content ->
                [ Html.pre []
                    [ Html.text content
                    ]
                ]
            
            EditorDisplay editor ->
                Editor.view editor
                    |> List.map (Html.map EditorMsg)
    }
