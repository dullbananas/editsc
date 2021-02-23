module Editsc.Model exposing
    ( Model
    , textDisplay

    , Msg

    , view
    , update
    , subscriptions
    )

import Browser
import Html


type Model
    = TextDisplay String


textDisplay : String -> Model
textDisplay =
    TextDisplay


type Msg
    = Msg (Model -> (Model, Cmd Msg))


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
    }


update : Msg -> Model -> (Model, Cmd Msg)
update (Msg updater) =
    updater


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none
