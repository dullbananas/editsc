module ConversionError exposing
    ( ConversionError(..)
    , NodeErrType(..)
    , toString
    )

import XmlParser exposing (Node(..), Xml)
import Parser
import Parser.Advanced


type alias XmlDeadEnd =
    Parser.Advanced.DeadEnd String Parser.Problem


type ConversionError
    = NodeError NodeErrType Node
    | QueryError (List String)
    | ParseError (List XmlDeadEnd)
    | NodeNotFound Node String -- Parent node and name of missing child
    | InvalidNode Node
    | MissingRootAttribute String
    | UnknownError
    | InvalidVersion


type NodeErrType
    = InvalidElementName
    | MissingAttributes


toString : ConversionError -> String
toString error =
    case error of
        NodeError errType node ->
            case node of
                Element name attrs _ ->
                    case errType of
                        InvalidElementName ->
                            "Unexpected '" ++ name ++ "' element found"
                        MissingAttributes ->
                            let
                                attrNames : String
                                attrNames =
                                    attrs |> List.map .name |> String.join ", "
                            in
                                "A '" ++ name ++ "' element is missing some attributes; it only has: " ++ attrNames
                Text _ ->
                    toString UnknownError

        QueryError path ->
            "Invalid or missing value: " ++ String.join " -> " path

        ParseError deadEnds ->
            "Invalid XML format"

        NodeNotFound _ name ->
            "Element '" ++ name ++ "' was not found"

        InvalidNode ( Element name _ _ ) ->
            "Invalid element found: " ++ name

        MissingRootAttribute name ->
            "The Project element is missing an attribute: " ++ name

        InvalidVersion ->
            "The project version is in an invalid format"

        _ ->
            "Unknown error; this usually happens when there's a text node that is supposed to be an element"
