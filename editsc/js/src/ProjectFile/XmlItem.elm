module ProjectFile.XmlItem exposing
    ( XmlItem(..)
    , Value
    , Values
    , fromNode
    , toNode
    , extractValue
    , queryItem
    , query
    , thenQuery
    , makeXmlItem

    , int
    , long
    , float
    , double
    , string
    , bool
    , vector2
    , point3
    , point3List
    , gameMode
    , startingPositionMode
    , environmentBehavior
    , timeOfDayMode
    , blockType
    )

import ProjectFile.XmlUtils exposing (getAttrs)
import XmlParser exposing (Node(..), Attribute)
import GameTypes exposing (..)
import ConversionError exposing (ConversionError(..), NodeErrType(..))
import World.BlockType as BlockType exposing (BlockType)

import Result.Extra as ResultE
import Maybe.Extra as MaybeE


type XmlItem
    = OneValue Value
    | MultiValues Values


type alias Value =
    { name : String
    , typeName : String
    , value : String
    }


type alias Values =
    { name : String
    , children : List XmlItem
    }


type alias ValueType a =
    { name : String
    , fromString : String -> Maybe a
    , toString : a -> String
    }


fromNode : Node -> Maybe (Result ConversionError XmlItem)
fromNode node =
    case node of
        Element name attrs children ->
            case name of
                "Value" ->
                    case getAttrs ["Name", "Type", "Value"] attrs of
                        [valueName, typeName, value] ->
                            Just <| Ok <| OneValue <| Value valueName typeName value
                        _ ->
                            Just <| Err <| NodeError MissingAttributes node
                "Values" ->
                    case getAttrs ["Name"] attrs of
                        [valuesName] ->
                            children
                                |> List.filterMap fromNode
                                |> ResultE.combine
                                |> Result.map
                                    (Ok << MultiValues << Values valuesName)
                                |> Result.toMaybe
                        _ ->
                            Just <| Err <| NodeError MissingAttributes node
                _ ->
                    Just <| Err <| NodeError InvalidElementName node
        Text _ ->
            Nothing


toNode : XmlItem -> Node
toNode xmlItem =
    case xmlItem of
        OneValue value ->
            Element
                "Value"
                [ Attribute "Name" value.name
                , Attribute "Type" value.typeName
                , Attribute "Value" value.value
                ]
                []
        MultiValues values ->
            Element
                "Values"
                [ Attribute "Name" values.name ]
                ( List.map toNode values.children )


extractValue : ValueType a -> XmlItem -> Maybe a
extractValue valueType xmlItem =
    case xmlItem of
        OneValue value ->
            if valueType.name == value.typeName then
                valueType.fromString value.value
            else
                Nothing
        MultiValues _ ->
            Nothing


thenQuery : ValueType a -> List String -> List XmlItem -> Result ConversionError (a -> b) -> Result ConversionError b
thenQuery valueType path xmlItems =
    ResultE.andMap (query valueType path xmlItems)


query : ValueType a -> List String -> List XmlItem -> Result ConversionError a
query valueType path xmlItems =
    case queryItem path xmlItems of
        Just (OneValue value) ->
            valueType.fromString value.value |> Result.fromMaybe (QueryError path)
        _ ->
            Err <| QueryError path


queryItem : List String -> List XmlItem -> Maybe XmlItem
queryItem path xmlItems =
    case path of
        [name] ->
            case List.filter (nameEquals name) xmlItems of
                [item] -> Just item
                _ -> Nothing
        name :: names ->
            case queryItem [name] xmlItems of
                Just (MultiValues values) ->
                    queryItem names values.children
                _ ->
                    Nothing
        [] ->
            Nothing


nameEquals : String -> XmlItem -> Bool
nameEquals name xmlItem =
    case xmlItem of
        OneValue value -> value.name == name
        MultiValues values -> values.name == name


makeXmlItem : String -> ValueType a -> a -> XmlItem
makeXmlItem name valueType value =
    OneValue <| Value name valueType.name (valueType.toString value)


int : ValueType Int
int = ValueType
    "int" String.toInt String.fromInt


long : ValueType Int
long = ValueType
    "long" String.toInt String.fromInt


float : ValueType Float
float = ValueType
    "float" String.toFloat String.fromFloat


double : ValueType Float
double = ValueType
    "double" String.toFloat String.fromFloat


string : ValueType String
string = ValueType
    "string" (identity >> Just) identity


bool : ValueType Bool
bool = ValueType
    "bool"
    ( \s -> case s of
        "True" -> Just True
        "False" -> Just False
        _ -> Nothing )
    ( \b -> if b then "True" else "False" )


vector2 : ValueType Vector2
vector2 = ValueType
    "Vector2"
    ( vector2FromString String.toFloat Vector2 )
    ( \{x, y} -> List.map String.fromFloat [x, y] |> String.join "," )


point3 : ValueType Point3
point3 = ValueType
    "Point3"
    ( vector3FromString String.toInt Point3 )
    ( \{x, y, z} -> List.map String.fromInt [x, y, z] |> String.join "," )


vector2FromString : (String -> Maybe a) -> (a -> a -> b) -> String -> Maybe b
vector2FromString converter constructor str =
    case String.split "," str of
        [xs, ys] ->
            case List.filterMap converter [xs, ys] of
                [x, y] -> Just (constructor x y)
                _ -> Nothing
        _ ->
            Nothing


vector3FromString : (String -> Maybe a) -> (a -> a -> a -> b) -> String -> Maybe b
vector3FromString converter constructor str =
    case String.split "," str of
        [xs, ys, zs] ->
            case List.filterMap converter [xs, ys, zs] of
                [x, y, z] -> Just (constructor x y z)
                _ -> Nothing
        _ ->
            Nothing


point3List : ValueType (List Point3)
point3List = ValueType
    "string"
    ( listFromString point3.fromString )
    ( List.map point3.toString >> String.join ";" )


listFromString : (String -> Maybe a) -> String -> Maybe (List a)
listFromString converter str =
    str
        |> String.split ";"
        |> List.map converter
        |> MaybeE.combine


gameMode : ValueType GameMode
gameMode = ValueType
    "Game.GameMode"
    ( \s -> case s of
        "Cruel" -> Just Cruel
        "Adventure" -> Just Adventure
        "Challenging" -> Just Challenging
        "Harmless" -> Just Harmless
        "Creative" -> Just Creative
        _ -> Nothing )
    ( \g -> case g of
        Cruel -> "Cruel"
        Adventure -> "Adventure"
        Challenging -> "Challenging"
        Harmless -> "Harmless"
        Creative -> "Creative" )


startingPositionMode : ValueType StartingPositionMode
startingPositionMode = ValueType
    "Game.StartingPositionMode"
    ( \s -> case s of
        "Easy" -> Just Easy
        "Medium" -> Just Medium
        "Hard" -> Just Hard
        _ -> Nothing )
    ( \s -> case s of
        Easy -> "Easy"
        Medium -> "Medium"
        Hard -> "Hard" )


environmentBehavior : ValueType EnvironmentBehavior
environmentBehavior = ValueType
    "Game.EnvironmentBehaviorMode"
    ( \s -> case s of
        "Living" -> Just Living
        "Static" -> Just Static
        _ -> Nothing )
    ( \a -> case a of
        Living -> "Living"
        Static -> "Static" )


timeOfDayMode : ValueType TimeOfDayMode
timeOfDayMode = ValueType
    "Game.TimeOfDayMode"
    ( \s -> case s of
        "Changing" -> Just Changing
        "Day" -> Just Day
        "Night" -> Just Night
        "Sunrise" -> Just Sunrise
        "Sunset" -> Just Sunset
        _ -> Nothing )
    ( \t -> case t of
        Changing -> "Changing"
        Day -> "Day"
        Night -> "Night"
        Sunrise -> "Sunrise"
        Sunset -> "Sunset" )


blockType : ValueType BlockType
blockType = ValueType
    "int"
    ( String.toInt >> Maybe.andThen BlockType.fromInt )
    ( BlockType.toInt >> String.fromInt )
