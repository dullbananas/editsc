port module Port exposing
    ( send
    , DecodeError
    , Value
    , decodeErrorAsStr
    , receive
    , p
    )

import Json.Decode as D
import Json.Encode as E


port toJs : E.Value -> Cmd msg
port fromJs : (E.Value -> msg) -> Sub msg


send : String -> List (String, E.Value) -> Cmd msg
send name fields =
    toJs <| E.object <| ("$", E.string name) :: fields


type alias DecodeError =
    D.Error


type alias Value =
    D.Value


decodeErrorAsStr : DecodeError -> String
decodeErrorAsStr =
    Debug.toString


p : String -> (a -> msg) -> D.Decoder a -> D.Decoder msg
p kind wrapMsg decoder =
    D.field "$" D.string
        |> D.andThen (pHelp kind decoder)
        |> D.map wrapMsg


pHelp : String -> D.Decoder a -> String -> D.Decoder a
pHelp correctKind decoder kind =
    if correctKind == kind then
        decoder
    else
        D.fail kind


receive : List (D.Decoder msg) -> (D.Error -> msg) -> D.Value -> msg
receive decoders onError value =
    case D.decodeValue (D.oneOf decoders) value of
        Ok msg ->
            msg
        
        Err err ->
            onError err