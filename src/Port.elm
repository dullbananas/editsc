port module Port exposing
    ( send
    )

import Json.Decode as D
import Json.Encode as E


port toJs : E.Value -> Cmd msg
port fromJs : (E.Value -> msg) -> Sub msg


send : String -> List (String, E.Value) -> Cmd msg
send name fields =
    toJs <| E.object <| ("$", E.string name) :: fields
