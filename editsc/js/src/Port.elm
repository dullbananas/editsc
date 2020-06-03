port module Port exposing (..)



-- Importer


-- All of the steps of the world import process listed in order

port extractZip : () -> Cmd msg

port gotProjectFile : ( String -> msg ) -> Sub msg

port parseChunks : () -> Cmd msg

port chunksReady : ( () -> msg ) -> Sub msg

--port initRender : () -> Cmd msg


-- Errors sent from JavaScript

port extractionError : ( String -> msg ) -> Sub msg

port chunksError : ( String -> msg ) -> Sub msg



-- World saver


port saveWorld : { fileName : String, xml : String } -> Cmd msg



-- 3D world rendering and interaction


type alias Progress =
    { soFar : Int
    , total : Int
    , message : String
    }

port progress : ( Progress -> msg ) -> Sub msg

port continue : Int -> Cmd msg

port startRendering : () -> Cmd msg
