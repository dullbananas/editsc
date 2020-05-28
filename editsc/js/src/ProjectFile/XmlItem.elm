module ProjectFile.XmlItem exposing
    ( XmlItem(..)
    , Value
    , Values
    , fromNode
    , toNode
    , extractValue
    , queryItem
    , query
    , queryValues
    , thenQuery

    , val
    , vals


    , int
    , long
    , float
    , double
    , string
    , bool

    , blockType
    , gameVersion

    , vector2
    , vector3
    , quaternion
    , point3

    , point3List
    , strList
    , paletteColors

    , gameMode
    , startingPositionMode
    , environmentBehavior
    , timeOfDayMode
    , terrainGenerationMode
    )

import ProjectFile.XmlUtils exposing (getAttrs)
import XmlParser exposing (Node(..), Attribute)
import GameTypes exposing (..)
import ConversionError exposing (ConversionError(..), NodeErrType(..))
import World.BlockType as BlockType exposing (BlockType)
import World.GameVersion as GameVersion exposing (GameVersion)

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


val : ValueType a -> String -> a -> XmlItem
val valueType name value =
    OneValue
        { name = name
        , typeName = valueType.name
        , value = valueType.toString value
        }


vals : String -> List XmlItem -> XmlItem
vals name children =
    MultiValues <| Values name children


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


queryValues : List String -> List XmlItem -> Result ConversionError Values
queryValues path xmlItems =
    case queryItem path xmlItems of
        Just (MultiValues values) ->
            Ok values

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


int : ValueType Int
int = ValueType
    "int" String.toInt String.fromInt


long : ValueType Long
long = ValueType
    "long"
    ( Maybe.map Long << String.toInt )
    ( \(Long v) -> String.fromInt v )


float : ValueType Float
float = ValueType
    "float" String.toFloat String.fromFloat


double : ValueType Double
double = ValueType
    "double"
    ( Maybe.map Double << String.toFloat )
    ( \(Double v) -> String.fromFloat v )


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


vector3 : ValueType Vector3
vector3 = ValueType
    "Vector3"
    ( vector3FromString String.toFloat Vector3 )
    ( \{x, y, z} -> List.map String.fromFloat [x, y, z] |> String.join "," )


quaternion : ValueType Quaternion
quaternion = ValueType
    "Quaternion"
    ( vector4FromString String.toFloat Quaternion )
    ( \{w, x, y, z} -> List.map String.fromFloat [w, x, y, z] |> String.join "," )


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


vector4FromString : (String -> Maybe a) -> (a -> a -> a -> a -> b) -> String -> Maybe b
vector4FromString converter constructor str =
    case String.split "," str of
        [ws, xs, ys, zs] ->
            case List.filterMap converter [ws, xs, ys, zs] of
                [w, x, y, z] -> Just (constructor w x y z)
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


enumType : String -> List a -> ( a -> String ) -> ValueType a
enumType name values toString =
    { name = name
    , fromString = \str ->
        let
            isRight value =
                if toString value == str then Just value else Nothing
        in
            case values |> List.filterMap isRight of
                [ value ] -> Just value
                _ -> Nothing
    , toString = toString
    }


gameMode : ValueType GameMode
gameMode = enumType
    "Game.GameMode"
    [ Cruel, Adventure, Challenging, Harmless, Creative ]
    ( \value -> case value of
        Cruel -> "Cruel"
        Adventure -> "Adventure"
        Challenging -> "Challenging"
        Harmless -> "Harmless"
        Creative -> "Creative" )


startingPositionMode : ValueType StartingPositionMode
startingPositionMode = enumType
    "Game.StartingPositionMode"
    [ Easy, Medium, Hard ]
    ( \value -> case value of
        Easy -> "Easy"
        Medium -> "Medium"
        Hard -> "Hard" )


environmentBehavior : ValueType EnvironmentBehavior
environmentBehavior = enumType
    "Game.EnvironmentBehaviorMode"
    [ Living, Static ]
    ( \value -> case value of
        Living -> "Living"
        Static -> "Static" )


timeOfDayMode : ValueType TimeOfDayMode
timeOfDayMode = enumType
    "Game.TimeOfDayMode"
    [ Changing, Day, Night, Sunrise, Sunset ]
    ( \value -> case value of
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


terrainGenerationMode : ValueType TerrainGenerationMode
terrainGenerationMode = enumType
    "Game.TerrainGenerationMode"
    [ Continent, Island, FlatContinent, FlatIsland ]
    ( \value -> case value of
        Continent -> "Continent"
        Island -> "Island"
        FlatContinent -> "FlatContinent"
        FlatIsland -> "FlatIsland" )


paletteColors : ValueType ( List (Maybe PaletteColor) )
paletteColors =
    { name = "string"
    , fromString =
        String.split ";" >> List.map parseColor >> MaybeE.combine
    , toString =
        List.map ( Maybe.map colorToString >> Maybe.withDefault "" )
        >> String.join ";"
    }


parseColor : String -> Maybe ( Maybe PaletteColor )
parseColor str =
    case String.split "," str |> List.map String.toInt of
        [ Nothing ] ->
            Just Nothing

        [ Just red, Just green, Just blue ] ->
            Just <| Just <| PaletteColor red green blue

        _ ->
            Nothing


colorToString : PaletteColor -> String
colorToString { red, green, blue } =
        [ red, green, blue ]
            |> List.map String.fromInt
            |> String.join ","


strList : ValueType ( List String )
strList =
    { name = "string"
    , fromString = Just << String.split ";"
    , toString = String.join ";"
    }


gameVersion : ValueType GameVersion
gameVersion =
    { name = "string"
    , fromString = GameVersion.fromString
    , toString = GameVersion.toString
    }
