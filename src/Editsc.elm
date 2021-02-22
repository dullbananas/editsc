module Editsc exposing (main)

import Browser


main : Program () () Never
main =
    Browser.document
        { init = always ((), Cmd.none)
        , view = always { title = "EditSC", body = [] }
        , update = never
        , subscriptions = always Sub.none
        }
