port module Port exposing (..)

import Json.Encode as E
import Json.Decode as D



-- From Elm


port fromElmPort : E.Value -> Cmd msg


type SelectionMode
    = NotSelecting
    | SelectingSingleBlock


type FromElm
    --Import world
    = ExtractScworldFile
    | LoadChunksFile
    | SwitchedToEditor

    --Save world
    | SaveScworld
        { fileName : String
        , projectFileContent : String
        }

    --Extensions
    | DoSingleBlockAction
        { workerUrl : String
        , id : Int
        }

    --Interaction
    | SetSelectionMode SelectionMode
    | AdjustCamera (List CameraAdjustment)


type alias CameraAdjustment =
    { x : Float
    , y : Float
    , z : Float
    , mode : CameraAdjustmentMode
    }


type CameraAdjustmentMode
    = Translate
    | Rotate
    | RotateWorld


send : FromElm -> Cmd msg
send =
    encode >> fromElmPort


encodeHelp : String -> List ( String, E.Value ) -> E.Value
encodeHelp kind values =
    E.object <| ( "kind", E.string kind ) :: values


encode : FromElm -> E.Value
encode msg =
    case msg of
        ExtractScworldFile ->
            encodeHelp "extractScworldFile" []

        LoadChunksFile ->
            encodeHelp "loadChunksFile" []

        SwitchedToEditor ->
            encodeHelp "switchedToEditor" []

        SaveScworld { fileName, projectFileContent } ->
            encodeHelp "saveScworld"
                [ ( "fileName", E.string fileName )
                , ( "projectFileContent", E.string projectFileContent )
                ]

        DoSingleBlockAction { workerUrl, id } ->
            encodeHelp "doSingleBlockAction"
                [ ( "workerUrl", E.string workerUrl )
                , ( "id", E.int id )
                ]

        SetSelectionMode NotSelecting ->
            encodeHelp "setSelectionMode"
                [ ( "mode", E.string "none" )
                ]

        SetSelectionMode SelectingSingleBlock ->
            encodeHelp "setSelectionMode"
                [ ( "mode", E.string "singleBlock" )
                ]

        AdjustCamera adjustments ->
            encodeHelp "adjustCamera"
                [ ( "adjustments", E.list encodeCameraAdjustment adjustments )
                ]


encodeCameraAdjustment : CameraAdjustment -> E.Value
encodeCameraAdjustment { x, y, z, mode } =
    E.object
        [ ( "x", E.float x )
        , ( "y", E.float y )
        , ( "z", E.float z )
        , ( "mode" , E.string <| case mode of
            Translate -> "translate"
            Rotate -> "rotate"
            RotateWorld -> "rotateWorld"
        )
        ]



-- To Elm


port toElmPort : ( D.Value -> msg ) -> Sub msg


type ToElm
    --Import world
    = GotProjectFile String
    | ChunksFileLoaded
    | ImportError String

    --Extensions
    | NewSingleBlockAction SingleBlockAction

    --Misc
    | Progress Float


type alias SingleBlockAction =
    { id : Int
    , name : String
    , icon : String
    , workerUrl : String
    }


sub : ( DecoderResult -> msg ) -> Sub msg
sub tag =
    toElmPort identity
        |> Sub.map ( D.decodeValue decoder >> tag )


type alias DecoderResult =
    Result D.Error ToElm


decoder : D.Decoder ToElm
decoder =
    D.field "kind" D.string
        |> D.andThen decodeKind


decodeKind : String -> D.Decoder ToElm
decodeKind kind =
    case kind of
        "gotProjectFile" ->
            D.map GotProjectFile
                ( D.field "content" D.string )

        "chunksFileLoaded" ->
            D.succeed ChunksFileLoaded

        "importError" ->
            D.map ImportError
                ( D.field "message" D.string )

        "newSingleBlockAction" ->
            D.map NewSingleBlockAction
                <| D.map4 ( SingleBlockAction )
                    ( D.field "id" D.int )
                    ( D.field "name" D.string )
                    ( D.field "icon" D.string )
                    ( D.field "workerUrl" D.string )

        "progress" ->
            D.map Progress
                ( D.field "portion" D.float )

        _ ->
            D.fail <| "Invalid kind: " ++ kind
