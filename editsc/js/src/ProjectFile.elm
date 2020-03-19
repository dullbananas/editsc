module ProjectFile exposing
    ( toXmlString
    , fromXmlString
    , ProjectFile
    , ProjectEntity
    )

import XmlItem exposing (XmlItem)
import XmlParser exposing (Node(..), Attribute)
import Parser
import Parser.Advanced
import Result.Extra as ResultE

import XmlUtils exposing (getAttrs)


type alias ProjectFile =
    { subsystems : List XmlItem
    , entities : List ProjectEntity
    , version : String
    , guid : String
    }


type alias ProjectEntity =
    { id : String
    , guid : String
    , name : String
    , content : List XmlItem
    }


toXmlString : ProjectFile -> String
toXmlString projectFile =
    let
        subsystemsNodes : List Node
        subsystemsNodes =
            List.map XmlItem.toNode projectFile.subsystems
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
        XmlParser.Xml [] Nothing rootNode
            |> XmlParser.format


fromXmlString : String -> Result ParseError ProjectFile
fromXmlString xmlStr =
    xmlStr
        |> XmlParser.parse
        |> Result.mapError XmlDeadEnds
        |> Result.map .root
        |> Result.andThen (\rootNode ->
                Result.map4
                    ProjectFile
                    (processRootChild "Subsystems" XmlItem.fromNode rootNode)
                    (processRootChild "Entities" entityFromNode rootNode)
                    (getRootAttr "Version" rootNode)
                    (getRootAttr "Guid" rootNode))


getRootAttr : String -> Node -> Result ParseError String
getRootAttr attrName rootNode =
    case rootNode of
        Element _ attrs _ ->
            case getAttrs [attrName] attrs of
                [value] -> Ok value
                _ -> Err (MissingRootAttribute attrName)
        _ ->
            Err UnknownError


processRootChild : String -> (Node -> Maybe (Result Node a)) -> Node -> Result ParseError (List a)
processRootChild childName childConverter rootNode =
    case getNodeChild childName rootNode of
        Ok (Element _ _ children) ->
            children
                |> List.filterMap childConverter
                |> ResultE.combine
                |> Result.mapError InvalidNode
        Err error ->
            Err error
        _ ->
            Err UnknownError


getNodeChild : String -> Node -> Result ParseError Node
getNodeChild childName parent =
    case parent of
        Element _ _ children ->
            case List.filter (nodeNameIs childName) children of
                [child] -> Ok child
                _ -> Err (NodeNotFound parent childName)
        _ ->
            Err UnknownError


nodeNameIs : String -> Node -> Bool
nodeNameIs name node =
    case node of
        Element elName _ _ -> name == elName
        _ -> False


entityFromNode : Node -> Maybe (Result Node ProjectEntity)
entityFromNode node =
    case node of
        Element _ attrs children ->
            case getAttrs ["Id", "Guid", "Name"] attrs of
                [id, guid, name] ->
                    children
                        |> List.filterMap XmlItem.fromNode
                        |> ResultE.combine
                        |> Result.map (ProjectEntity id guid name)
                        |> Just
                _ ->
                    Just (Err node)
        _ ->
            Nothing


entityToNode : ProjectEntity -> Node
entityToNode { id, guid, name, content } =
    Element
        "Entity"
        [ Attribute "Id" id
        , Attribute "Guid" guid
        , Attribute "Name" name
        ]
        (List.map XmlItem.toNode content)


type ParseError
    = XmlDeadEnds ( List (Parser.Advanced.DeadEnd String Parser.Problem) )
    | NodeNotFound Node String -- Parent and name of missing child node
    | InvalidNode Node
    | MissingRootAttribute String
    | UnknownError
