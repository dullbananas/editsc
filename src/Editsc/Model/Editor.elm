module Editsc.Model.Editor exposing
    ( Model
    , Msg
    , init
    , update
    , view
    )

import Editsc.Viewport as Viewport exposing (Viewport)
import Html exposing (Html)
import Task exposing (Task)


type Model
    = Model
        { viewport : Viewport
        }


type Msg
    = GotViewport Viewport


init : () -> (Model, Cmd Msg)
init flags =
    ( Model
        { viewport = Viewport.default
        }
    , Task.perform GotViewport Viewport.get
    )


update : Msg -> Model -> (Model, Cmd Msg)
update msg (Model model) =
    case msg of
        GotViewport viewport ->
            ( Model
                { model
                | viewport = viewport
                }
            , Cmd.none
            )


view : Model -> List (Html Msg)
view model =
    [
    ]
