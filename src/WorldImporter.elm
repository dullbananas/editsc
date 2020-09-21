module WorldImporter exposing
    ( WorldImporter(..)
    , startExtracting
    )

import Json.Encode as E
import Port


type WorldImporter
    = Waiting
    | Extracting


startExtracting : Cmd msg
startExtracting =
    Port.send "startExtracting" []
