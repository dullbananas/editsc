module Editsc exposing (main)

import Browser
import Editsc.Model as Model exposing (Model, Msg)


main : Program () Model Msg
main =
    Browser.document
        { init = Model.init
        , view = Model.view
        , update = Model.update
        , subscriptions = Model.subscriptions
        }
