port module WorldImporter exposing
    ( WorldImporter(..)
    , startExtracting
    , sub
    )

import Json.Encode as E
import Json.Decode as D
import Port exposing (p)


type WorldImporter
    = Waiting
    | Extracting


startExtracting : Cmd msg
startExtracting =
    Port.send "startExtracting" []


port importerPort : (D.Value -> msg) -> Sub msg


filePresent : D.Value -> Bool
filePresent value =
    case D.decodeValue (D.field "name" D.value) value of
        Ok _ -> True
        Err _ -> False


{-handleFiles
    : { project : D.Value, chunks : D.Value }
    ->(WorldImporter -> model)
    ->( model, Cmd msg )
handleFiles = Debug.todo "remobve this"-}



type alias SubHandlers msg =
    { gotFiles :
        { project : D.Value
        , chunks : D.Value
        } -> msg
    }


sub : WorldImporter -> SubHandlers msg -> (D.Error -> msg) -> Sub msg
sub state h onError =
    importerPort <| Port.receive
        ( case state of
            Extracting ->
                [ p "gotFiles" h.gotFiles <|
                    D.map2 (\pr ch -> {project = pr, chunks = ch})
                        ( D.field "project" D.value )
                        ( D.field "chunks" D.value )
                ]
            
            _ ->
                []
        ) onError
