module ProjectFile exposing
    ( ProjectFile
    , XMLItem(..)
    , ProjectEntity
    , decodeValue
    , splitter
    , parseFile
    , toXmlString
    , queryXmlItem
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
    )

{-| This module implements the `ProjectFile` type, which is a representation of
the XML structure of the Project.xml file used by Survivalcraft. It also
implements functions used for converting them to and from XML strings.
-}

import XmlParser exposing (Xml, Node(..), Attribute)
import Parser
import Parser.Advanced
import Result.Extra as ResultE
import Maybe.Extra as MaybeE
import Vector3 exposing (Vector3)
import Vector4 exposing (Vector4)

import GameTypes exposing (GameMode(..), PlayerType(..))

type alias XmlDeadEnd =
    Parser.Advanced.DeadEnd String Parser.Problem


type alias ProjectFile =
    { subsystems : List XMLItem
    , entities : List ProjectEntity
    , version : String
    , guid : String
    }


{-| The `XMLItem` type represents either a <Value> or <Values> XML tag in the
Project.xml file.
-}

type XMLItem
    = Values String (List XMLItem)
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


queryBool : List String -> List XMLItem -> Maybe Bool
queryBool path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueBool _ value) -> Just value
        _ -> Nothing


queryInt : List String -> List XMLItem -> Maybe Int
queryInt path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueInt _ value) -> Just value
        _ -> Nothing


queryLong : List String -> List XMLItem -> Maybe Int
queryLong path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueLong _ value) -> Just value
        _ -> Nothing


queryFloat : List String -> List XMLItem -> Maybe Float
queryFloat path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueFloat _ value) -> Just value
        _ -> Nothing


queryDouble : List String -> List XMLItem -> Maybe Float
queryDouble path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueDouble _ value) -> Just value
        _ -> Nothing


queryPoint3 : List String -> List XMLItem -> Maybe (Vector3 Int)
queryPoint3 path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValuePoint3 _ a b c) -> Just (Vector3.from3 a b c)
        _ -> Nothing


queryVector3 : List String -> List XMLItem -> Maybe (Vector3 Float)
queryVector3 path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueVector3 _ a b c) -> Just (Vector3.from3 a b c)
        _ -> Nothing


queryQuaternion : List String -> List XMLItem -> Maybe (Vector4 Float)
queryQuaternion path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueQuaternion _ a b c d) -> Just (Vector4.from4 a b c d)
        _ -> Nothing


queryString : List String -> List XMLItem -> Maybe String
queryString path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueString _ value) -> Just value
        _ -> Nothing


queryGameMode : List String -> List XMLItem -> Maybe GameMode
queryGameMode path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValueGameMode _ value) -> Just value
        _ -> Nothing


queryPlayerClass : List String -> List XMLItem -> Maybe PlayerType
queryPlayerClass path xmlItems =
    case queryXmlItem path xmlItems of
        Just (ValuePlayerClass _ value) -> Just value
        _ -> Nothing


queryXmlItem : List String -> List XMLItem -> Maybe XMLItem
queryXmlItem path xmlItems =
    let
        nameEquals : String -> XMLItem -> Bool
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


getXmlItemName : XMLItem -> String
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


type alias ProjectEntity =
    { id : String
    , guid : String
    , name : String
    , content : List XMLItem
    }


decodeValue : String -> String -> String -> Maybe XMLItem
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


splitter : (List a -> Maybe XMLItem) -> Int -> (String -> Maybe a) -> String -> Maybe XMLItem
splitter wrapper length itemConverter wholeStr =
    wholeStr
        |> String.split ","
        |> List.filterMap itemConverter
        -- Make sure the length is right
        |> (\list -> if List.length list == length then Just list else Nothing)
        |> Maybe.andThen wrapper


{-| This is the main function for parsing an XML file.
-}
parseFile : String -> Result String ProjectFile
parseFile xmlString =
    xmlString
        |> XmlParser.parse
        |> Result.mapError deadEndsToString
        |> Result.map .root
        -- These functions will collect information over time. Each one outpus a
        -- record that contains one more field than the previous one.
        |> Result.andThen (getAttr0 "Guid")
        |> Result.andThen (getAttr1 "Version")
        |> Result.andThen getSubsystems
        |> Result.andThen getEntities
        -- Result will now has errors of type List String instead of String
        |> Result.mapError List.singleton
        -- Now we have { node, attr0, attr1, subsystems, entities }. The next
        -- functions will change the types of some existing fields.
        |> Result.andThen decodeEntities
        |> Result.andThen decodeSubsystems
        -- Now we have all data necessary to create a ProjectFile record. This
        -- will pass the data into the ProjectFile constructor:
        |> Result.map (\a ->
            ProjectFile a.subsystems a.entities a.attr1 a.attr0)
        -- Result's error type will now be String again
        |> Result.mapError combineErrorStrings


{-| This is the main function for converting a `ProjectFile` record into an XML
string.
-}
toXmlString : ProjectFile -> String
toXmlString projectFile =
    let
        subsystemsNodes : List Node
        subsystemsNodes =
            List.map xmlItemToNode projectFile.subsystems
        entityNodes : List Node
        entityNodes =
            List.map entityToNode projectFile.entities
        rootNodeAttrs : List Attribute
        rootNodeAttrs =
            [ Attribute "Guid" projectFile.guid
            , Attribute "Name" "GameProject"
            , Attribute "Version" projectFile.version
            ]
        rootNode : Node
        rootNode =
            Element "Project" rootNodeAttrs
                [ Element "Subsystems" [] subsystemsNodes
                , Element "Entities" [] entityNodes
                ]
    in
        Xml [] Nothing rootNode
            |> XmlParser.format


entityToNode : ProjectEntity -> Node
entityToNode { id, guid, name, content } =
    Element
        "Entity"
        [ Attribute "Id" id
        , Attribute "Guid" guid
        , Attribute "Name" name
        ]
        (List.map xmlItemToNode content)


xmlItemToNode : XMLItem -> Node
xmlItemToNode xmlItem =
    case xmlItem of
        Values name children ->
            Element
                "Values"
                [Attribute "Name" name]
                (List.map xmlItemToNode children)
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


decodeSubsystems :
    Attrs2 { subsystems : List Node, entities : List ProjectEntity }
    -> Result (List String) (Attrs2 { subsystems : List XMLItem, entities : List ProjectEntity })
decodeSubsystems { node, attr0, attr1, subsystems, entities } =
    subsystems
        |> List.filterMap decodeXmlItem
        |> processDecodingResults
        |> Result.map (\newSubsystems ->
            { node = node, attr0 = attr0, attr1 = attr1
            , subsystems = newSubsystems, entities = entities })


decodeEntities :
    Attrs2 { subsystems : List Node, entities : List Node }
    -> Result (List String) (Attrs2 { subsystems : List Node, entities : List ProjectEntity })
decodeEntities { node, attr0, attr1, subsystems, entities } =
    entities
        |> List.filterMap decodeEntity
        |> processDecodingResults
        |> Result.map (\newEntities ->
            { node = node, attr0 = attr0, attr1 = attr1, subsystems = subsystems
            , entities = newEntities })


decodeEntity : Node -> Maybe (Result (List String) ProjectEntity)
decodeEntity node =
    case node of
        Element _ _ children ->
            Ok node
                |> Result.andThen (getAttr0 "Id")
                |> Result.andThen (getAttr1 "Guid")
                |> Result.andThen (getAttr2 "Name")
                |> Result.mapError List.singleton
                |> Result.andThen (constructProjectEntity children)
                |> Just
        _ ->
            Nothing


constructProjectEntity : List Node -> Attrs3 {} -> Result (List String) ProjectEntity
constructProjectEntity children { node, attr0, attr1, attr2 } =
    List.filterMap decodeXmlItem children
        |> processDecodingResults
        |> Result.map (\items -> ProjectEntity attr0 attr1 attr2 items)


decodeXmlItem : Node -> Maybe ( Result (List String) XMLItem )
decodeXmlItem node =
    case node of
        Element elName attrs children ->
            case elName of
                "Value" ->
                    Ok node
                        |> Result.andThen (getAttr0 "Name")
                        |> Result.andThen (getAttr1 "Type")
                        |> Result.andThen (getAttr2 "Value")
                        |> Result.mapError List.singleton
                        |> Result.andThen (\r ->
                            decodeValue r.attr0 r.attr1 r.attr2
                                |> Result.fromMaybe
                                    [ "Could not read Value named " ++ r.attr0
                                    ++ " of type " ++ r.attr1 ++ " with value "
                                    ++ r.attr2 ])
                        |> Just
                "Values" ->
                    case getAttr0 "Name" node of
                        Ok attrRecord ->
                            children
                                |> List.filterMap decodeXmlItem
                                |> processDecodingResults
                                |> Result.map (\xmlItems ->
                                    Values attrRecord.attr0 xmlItems)
                                |> Just
                        Err message ->
                            Just (Err [message])
                _ ->
                    Just (Err ["Unexpected " ++ elName ++ " element found"])
        _ ->
            Nothing


processDecodingResults : List (Result (List String) a) -> Result (List String) (List a)
processDecodingResults resultList =
    if List.any ResultE.isErr resultList then
        resultList
            |> List.filterMap ResultE.error
            |> List.concat
            |> Err
    else
        resultList
            |> List.filterMap Result.toMaybe
            |> Ok


getSubsystems : Attrs2 {} -> Result String (Attrs2 { subsystems : List Node })
getSubsystems =
    getRootChild "Subsystems" (\a nodes ->
        { node = a.node, attr0 = a.attr0, attr1 = a.attr1
        , subsystems = nodes })


getEntities : Attrs2 { subsystems : List Node } -> Result String (Attrs2 { subsystems : List Node, entities : List Node })
getEntities =
    getRootChild "Entities" (\a nodes ->
        { node = a.node, attr0 = a.attr0, attr1 = a.attr1
        , subsystems = a.subsystems, entities = nodes })


-- Used to get Subsystems or Entities nodes
getRootChild : String -> ({ a | node : Node } -> List Node -> b) -> { a | node : Node } -> Result String b
getRootChild childName wrapper attrs =
    case getChild childName attrs.node of
        Ok child ->
            case child of
                Element _ _ children ->
                    Ok (wrapper attrs children)
                _ ->
                    Err "An error occured"
        Err message ->
            Err message


getChild : String -> Node -> Result String Node
getChild elName node =
    let
        nodeNameIs : String -> Node -> Bool
        nodeNameIs name nodeWithName =
            case nodeWithName of
                Element thisElName _ _ ->
                    thisElName == name
                _ ->
                    False
    in
        case node of
            Element _ _ children ->
                case List.filter (nodeNameIs elName) children of
                    [child] ->
                        Ok child
                    _ ->
                        Err (elName ++ " element not found")
            _ ->
                Err "An error occured"


getAttr0 : String -> Node -> Result String (Attrs1 {})
getAttr0 attrName node =
    case getElementAttr attrName node of
        Ok attr0 -> Ok { node = node, attr0 = attr0 }
        Err message -> Err message


getAttr1 : String -> Attrs1 {} -> Result String (Attrs2 {})
getAttr1 attrName { node, attr0 } =
    case getElementAttr attrName node of
        Ok attr1 ->
            Ok { node = node, attr0 = attr0, attr1 = attr1 }
        Err message ->
            Err message


getAttr2 : String -> Attrs2 {} -> Result String (Attrs3 {})
getAttr2 attrName { node, attr0, attr1 } =
    case getElementAttr attrName node of
        Ok attr2 ->
            Ok { node = node, attr0 = attr0, attr1 = attr1, attr2 = attr2 }
        Err message ->
            Err message


type alias Attrs1 a =
    { a
    | node : Node
    , attr0 : String
    }


type alias Attrs2 a =
    Attrs1
    { a
    | attr1 : String
    }


type alias Attrs3 a =
    Attrs2
    { a
    | attr2 : String
    }


getElementAttr : String -> XmlParser.Node -> Result String String
getElementAttr attrName node =
    case node of
        Element elName attrs _ ->
            case List.filter (\a -> a.name == attrName) attrs of
                [attr] ->
                    Ok attr.value
                _ ->
                    Err (elName ++ " element is missing the " ++ attrName ++ " attribute")
        _ ->
            Err "An error occured"


deadEndsToString : List XmlDeadEnd -> String
deadEndsToString deadEnds =
    let
        lines : List String
        lines =
            List.map (.row >> String.fromInt) deadEnds
    in
        "XML file has invalid syntax at lines " ++ (String.join ", " lines)


combineErrorStrings : List String -> String
combineErrorStrings stringList =
    case stringList of
        [string] ->
            string
        string0 :: otherStrings ->
            let
                otherErrorAmount : String
                otherErrorAmount =
                    List.length otherStrings
                        |> String.fromInt
            in
                "'" ++ string0 ++ "' and " ++ otherErrorAmount ++ " other error(s)"
        [] ->
            ""
