module XmlUtils exposing
    ( getAttrs
    )

import XmlParser exposing (Attribute)


getAttrs : List String -> List Attribute -> List String
getAttrs names attrList =
    names
        |> List.map (getAttr attrList)
        |> List.filterMap identity


getAttr : List Attribute -> String -> Maybe String
getAttr attrList attrName =
    case List.filter (\attr -> attr.name == attrName) attrList of
        [attr] ->
            Just attr.value
        _ ->
            Nothing
