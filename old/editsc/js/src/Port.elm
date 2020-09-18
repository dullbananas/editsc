port module Port exposing (..)

import Chunk exposing (Chunk)

import Json.Encode as E
import Json.Decode as D
import Array exposing (Array)



-- From Elm


port fromElmPort : E.Value -> Cmd msg


type SelectionMode
    = NotSelecting
    | SelectingSingleBlock
    | SelectingArray ( Maybe BlockArrayCorner )


type BlockArrayCorner
    = Blue
    | Green


type FromElm
    --Import world
    = ExtractScworldFile
    | LoadChunksFile
    | SwitchedToEditor
    | GetInitialChunks

    --Save world
    | SaveScworld
        { fileName : String
        , projectFileContent : String
        }

    --Extensions
    | DoAction
        { workerUrl : String
        , id : Int
        , actionType : ActionType
        }
    | TriggerButton String Int
    | UpdateBlockInput String Int Int

    --Interaction
    | SetSelectionMode SelectionMode
    | AdjustCamera (List CameraAdjustment)


type ActionType
    = BlockAction
    | BlockArrayAction


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

        GetInitialChunks ->
            encodeHelp "getInitialChunks" []

        SaveScworld { fileName, projectFileContent } ->
            encodeHelp "saveScworld"
                [ ( "fileName", E.string fileName )
                , ( "projectFileContent", E.string projectFileContent )
                ]

        DoAction { workerUrl, id, actionType } ->
            encodeHelp "doAction"
                [ ( "workerUrl", E.string workerUrl )
                , ( "id", E.int id )
                , ( "actionType", E.string <| case actionType of
                    BlockAction -> "block"
                    BlockArrayAction -> "blockArray"
                    )
                ]

        TriggerButton url id ->
            encodeHelp "triggerButton"
                [ ( "extensionUrl", E.string url )
                , ( "callbackId", E.int id )
                ]

        UpdateBlockInput url id newValue ->
            encodeHelp "updateBlockInput"
                [ ( "extensionUrl", E.string url )
                , ( "callbackId", E.int id )
                , ( "newValue", E.int newValue )
                ]

        SetSelectionMode NotSelecting ->
            encodeHelp "setSelectionMode"
                [ ( "mode", E.string "none" )
                ]

        SetSelectionMode SelectingSingleBlock ->
            encodeHelp "setSelectionMode"
                [ ( "mode", E.string "singleBlock" )
                ]

        SetSelectionMode (SelectingArray corner) ->
            encodeHelp "setSelectionMode"
                [ ( "mode", E.string <| case corner of
                    Nothing ->
                        "array"

                    Just Blue ->
                        "arrayBlue"

                    Just Green ->
                        "arrayGreen"
                )]

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
    | GotInitialChunks (List Chunk)

    --Extensions
    | NewAction ActionButton
    | ShowUi String String ( Array UiComponent )

    --Misc
    | Progress Float


type alias ActionButton =
    { id : Int
    , name : String
    , icon : String
    , workerUrl : String
    , actionType : ActionType
    }


type UiComponent
    = BlockInput { name : String, callbackId : Int, value : Int, expanded : Bool }
    | Button { name : String, icon : String, callbackId : Int }


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

        "gotInitialChunks" ->
            D.map GotInitialChunks
                ( D.field "chunks" decodeChunk )

        "newAction" ->
            D.map NewAction
                <| D.map5 ( ActionButton )
                    ( D.field "id" D.int )
                    ( D.field "name" D.string )
                    ( D.field "icon" D.string )
                    ( D.field "workerUrl" D.string )
                    ( D.field "actionType" decodeActionType )

        "showUi" ->
            D.map3 ShowUi
                ( D.field "url" D.string )
                ( D.field "title" D.string )
                ( D.field "components" <| D.array uiComponentDecoder )

        "progress" ->
            D.map Progress
                ( D.field "portion" D.float )

        _ ->
            D.fail <| "Invalid kind: " ++ kind


uiComponentDecoder : D.Decoder UiComponent
uiComponentDecoder =
    D.field "kind" D.string
        |> D.andThen decodeUiComponentKind


decodeUiComponentKind : String -> D.Decoder UiComponent
decodeUiComponentKind kind =
    case kind of
        "blockInput" ->
            D.map BlockInput
                <| D.map4 ( \name id val exp -> { name = name, callbackId = id, value = val, expanded = exp } )
                    ( D.field "name" D.string )
                    ( D.field "callbackId" D.int )
                    ( D.succeed 1 )
                    ( D.succeed False )

        "button" ->
            D.map Button
                <| D.map3 ( \name icon id -> { name = name, icon = icon, callbackId = id } )
                    ( D.field "name" D.string )
                    ( D.field "icon" D.string )
                    ( D.field "callbackId" D.int )

        _ ->
            D.fail <| "Invalid component kind: " ++ kind


decodeActionType : D.Decoder ActionType
decodeActionType =
    D.string |> D.andThen
        ( \str -> case str of
            "block" -> D.succeed BlockAction
            "blockArray" -> D.succeed BlockArrayAction
            _ -> D.fail "Invalid action type"
        )


decodeChunk : D.Decoder { x : Int, z : Int }
decodeChunk =
    D.map2 Chunk
        ( D.field "x" D.int )
        ( D.field "z" D.int )
