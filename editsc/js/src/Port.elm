port module Port exposing (..)



-- Importer


-- All of the steps of the world import process listed in order

port extractZip : () -> Cmd msg

port gotProjectFile : ( String -> msg ) -> Sub msg

port parseChunks : () -> Cmd msg

port chunksReady : ( () -> msg ) -> Sub msg


-- Errors sent from JavaScript

port extractionError : ( String -> msg ) -> Sub msg

port chunksError : ( String -> msg ) -> Sub msg



-- World saver


port saveWorld : { fileName : String, xml : String } -> Cmd msg



-- Info given by JavaScript to be displayed in the UI


port jsInfo : ( String -> msg ) -> Sub msg
