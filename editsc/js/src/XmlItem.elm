module XmlItem exposing
    ( XmlItem(..)
    , queryBool
    , queryInt
    , queryLong
    , queryFloat
    , queryDouble
    , queryPoint3
    , queryVector3
    , queryQuaternion
    , queryString
    , queryGameMode
    , queryPlayerClass
    , toNode
    , fromNode
    -- Exported for use in unit tests:
    , decodeValue
    , queryXmlItem
    )

import XmlParser exposing (Xml, Node(..), Attribute)
import Parser
import Parser.Advanced
import Result.Extra as ResultE
import Maybe.Extra as MaybeE
import Vector3 exposing (Vector3)
import Vector4 exposing (Vector4)

import GameTypes exposing (GameMode(..), PlayerType(..))
import XmlUtils exposing (getAttrs)


{-| The `XmlItem` type represents either a <Value> or <Values> XML tag in the
Project.xml file.
-}

type XmlItem
    = Values String (List XmlItem)
    | ValueBool String Bool
    | ValueInt String Int
    | ValueLong String Int
    | ValueFloat String Float
    | ValueDouble String Float
    | ValuePoint3 String Int Int Int
    | ValueVector3 String Float Float Float
    | ValueQuaternion String Float Float Float Float
    | ValueString String String
    | ValueGameMode String GameMode
    | ValuePlayerClass String PlayerType


queryBool : List String -> List XmlItem -> Maybe Bool
queryBool path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueBool _ value) -> Just value
        _ -> Nothing


queryInt : List String -> List XmlItem -> Maybe Int
queryInt path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueInt _ value) -> Just value
        _ -> Nothing


queryLong : List String -> List XmlItem -> Maybe Int
queryLong path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueLong _ value) -> Just value
        _ -> Nothing


queryFloat : List String -> List XmlItem -> Maybe Float
queryFloat path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueFloat _ value) -> Just value
        _ -> Nothing


queryDouble : List String -> List XmlItem -> Maybe Float
queryDouble path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueDouble _ value) -> Just value
        _ -> Nothing


queryPoint3 : List String -> List XmlItem -> Maybe (Vector3 Int)
queryPoint3 path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValuePoint3 _ a b c) -> Just (Vector3.from3 a b c)
        _ -> Nothing


queryVector3 : List String -> List XmlItem -> Maybe (Vector3 Float)
queryVector3 path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueVector3 _ a b c) -> Just (Vector3.from3 a b c)
        _ -> Nothing


queryQuaternion : List String -> List XmlItem -> Maybe (Vector4 Float)
queryQuaternion path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueQuaternion _ a b c d) -> Just (Vector4.from4 a b c d)
        _ -> Nothing


queryString : List String -> List XmlItem -> Maybe String
queryString path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueString _ value) -> Just value
        _ -> Nothing


queryGameMode : List String -> List XmlItem -> Maybe GameMode
queryGameMode path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueGameMode _ value) -> Just value
        _ -> Nothing


queryPlayerClass : List String -> List XmlItem -> Maybe PlayerType
queryPlayerClass path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValuePlayerClass _ value) -> Just value
        _ -> Nothing


queryXmlItem : List String -> List XmlItem -> Maybe XmlItem
queryXmlItem path xmlItems =
    let
        nameEquals : String -> XmlItem -> Bool
        nameEquals name xmlItem =
            name == (getXmlItemName xmlItem)
    in
        case path of
            [name] ->
                case List.filter (nameEquals name) xmlItems of
                    [item] -> Just item
                    _ -> Nothing
            name :: names ->
                ( case xmlItems |> List.filter (nameEquals name) of
                    [Values _ items] ->items
                    items -> items
                )
                    |> queryXmlItem names
                    |> Just
                    |> MaybeE.join
            _ -> Nothing


fromNode : Node -> Maybe (Result Node XmlItem)
fromNode node =
    case node of
        Element elName attrs children ->
            case elName of
                "Value" ->
                    case getAttrs ["Name", "Type", "Value"] attrs of
                        [name, valueType, value] ->
                            decodeValue name valueType value
                                |> Result.fromMaybe node
                                |> Just
                        _ ->
                            Just (Err node)
                "Values" ->
                    case getAttrs ["Name"] attrs of
                        [name] ->
                            children
                                |> List.filterMap fromNode
                                |> ResultE.combine
                                |> Result.map (Values name)
                                |> Just
                        _ ->
                            Just (Err node)
                _ ->
                    Just (Err node)
        _ ->
            Nothing


getXmlItemName : XmlItem -> String
getXmlItemName xmlItem =
    case xmlItem of
        Values name _ -> name
        ValueBool name _ -> name
        ValueInt name _ -> name
        ValueLong name _ -> name
        ValueFloat name _ -> name
        ValueDouble name _ -> name
        ValuePoint3 name _ _ _ -> name
        ValueVector3 name _ _ _ -> name
        ValueQuaternion name _ _ _ _ -> name
        ValueString name _ -> name
        ValueGameMode name _ -> name
        ValuePlayerClass name _ -> name


decodeValue : String -> String -> String -> Maybe XmlItem
decodeValue name valueType value =
    case valueType of
        "bool" ->
            case value of
                "True" -> Just (ValueBool name True)
                "False" -> Just (ValueBool name False)
                _ -> Nothing
        "int" ->
            Maybe.map (\v -> ValueInt name v) (String.toInt value)
        "long" ->
            Maybe.map (\v -> ValueLong name v) (String.toInt value)
        "float" ->
            Maybe.map (\v -> ValueFloat name v) (String.toFloat value)
        "double" ->
            Maybe.map (\v -> ValueDouble name v) (String.toFloat value)
        "Point3" ->
            let wrapper list =
                  case list of
                        [a, b, c] -> Just (ValuePoint3 name a b c)
                        _ -> Nothing
            in splitter wrapper 3 String.toInt value
        "Vector3" ->
            let wrapper list =
                    case list of
                        [a, b, c] -> Just (ValueVector3 name a b c)
                        _ -> Nothing
            in splitter wrapper 3 String.toFloat value
        "Quaternion" ->
            let wrapper list =
                    case list of
                        [a, b, c, d] -> Just (ValueQuaternion name a b c d)
                        _ -> Nothing
                in splitter wrapper 4 String.toFloat value
        "string" ->
            Just (ValueString name value)
        "Game.GameMode" ->
            case value of
                "Cruel" -> Just (ValueGameMode name Cruel)
                "Adventure" -> Just (ValueGameMode name Adventure)
                "Challenging" -> Just (ValueGameMode name Challenging)
                "Harmless" -> Just (ValueGameMode name Harmless)
                "Creative" -> Just (ValueGameMode name Creative)
                _ -> Nothing
        "Game.PlayerClass" ->
            case value of
                "Male" -> Just (ValuePlayerClass name Male)
                "Female" -> Just (ValuePlayerClass name Female)
                _ -> Nothing
        _ ->
            Nothing


splitter : (List a -> Maybe XmlItem) -> Int -> (String -> Maybe a) -> String -> Maybe XmlItem
splitter wrapper length itemConverter wholeStr =
    wholeStr
        |> String.split ","
        |> List.filterMap itemConverter
        -- Make sure the length is right
        |> (\list -> if List.length list == length then Just list else Nothing)
        |> Maybe.andThen wrapper


toNode : XmlItem -> Node
toNode xmlItem =
    case xmlItem of
        Values name children ->
            Element
                "Values"
                [Attribute "Name" name]
                (List.map toNode children)
        ValueBool name value ->
            makeValueNode name "bool" (if value then "True" else "False")
        ValueInt name value ->
            makeValueNode name "int" (String.fromInt value)
        ValueLong name value ->
            makeValueNode name "long" (String.fromInt value)
        ValueFloat name value ->
            makeValueNode name "float" (String.fromFloat value)
        ValueDouble name value ->
            makeValueNode name "double" (String.fromFloat value)
        ValuePoint3 name v0 v1 v2 ->
            encodeMultiValues String.fromInt name "Point3" [v0, v1, v2]
        ValueVector3 name v0 v1 v2 ->
            encodeMultiValues String.fromFloat name "Vector3" [v0, v1, v2]
        ValueQuaternion name v0 v1 v2 v3 ->
            encodeMultiValues String.fromFloat name "Quaternion" [v0, v1, v2, v3]
        ValueString name value ->
            makeValueNode name "string" value
        ValueGameMode name value ->
            let
                gameModeStr : String
                gameModeStr =
                    case value of
                        Cruel -> "Cruel"
                        Adventure -> "Adventure"
                        Challenging -> "Challenging"
                        Harmless -> "Harmless"
                        Creative -> "Creative"
            in
                makeValueNode name "Game.GameMode" gameModeStr
        ValuePlayerClass name value ->
            let
                playerClassStr : String
                playerClassStr =
                    case value of
                        Male -> "Male"
                        Female -> "Female"
            in
                makeValueNode name "Game.PlayerClass" playerClassStr


makeValueNode : String -> String -> String -> Node
makeValueNode name valueType value =
    Element
        "Value"
        [ Attribute "Name" name
        , Attribute "Type" valueType
        , Attribute "Value" value
        ]
        []


encodeMultiValues : (a -> String) -> String -> String -> List a -> Node
encodeMultiValues converter name typeName values =
    values
        |> List.map converter
        |> String.join ","
        |> makeValueNode name typeName
