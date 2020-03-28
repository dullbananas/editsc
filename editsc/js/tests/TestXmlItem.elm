module TestXmlItem exposing (suite)

import Expect
import Test exposing (Test, test, describe)

import ProjectFile.XmlItem as X exposing
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
    )
import GameTypes exposing (..)
import ConversionError exposing (..)

import XmlParser exposing
    ( Node(..)
    , Attribute
    )
import Result.Extra as ResultE


suite : Test
suite =
    describe "XmlItem"
        [ test "XmlItem.fromNode" <| \_ ->
            testNode0 True
                |> fromNode
                |> Expect.equal (Just <| Ok testXmlItem0)
        , test "XmlItem.toNode" <| \_ ->
            testXmlItem0
                |> toNode
                |> Expect.equal (testNode0 False)
        , test "valid extractValue int" <| \_ ->
            OneValue (Value "Ten" "int" "10")
                |> extractValue X.int
                |> Expect.equal (Just 10)
        , test "valid extractValue bool" <| \_ ->
            OneValue (Value "Yes" "bool" "True")
                |> extractValue X.bool
                |> Expect.equal (Just True)
        , test "invalid extractValue bool" <| \_ ->
            OneValue (Value "Yes but actually no" "bool" "Frue")
                |> extractValue X.bool
                |> Expect.equal Nothing
        , test "valid queryItem int" <| \_ ->
            [testXmlItem0]
                |> queryItem ["RootValues", "SubValues", "Two"]
                |> Expect.equal (Just <| OneValue <| Value "Two" "int" "2")
        , test "invalid queryItem int" <| \_ ->
            [testXmlItem0]
                |> queryItem ["RootValues", "SubValues", "Zero"]
                |> Expect.equal Nothing
        , test "valid query int" <| \_ ->
            [testXmlItem0]
                |> query X.int ["RootValues", "SubValues", "Two"]
                |> Expect.equal (Ok 2)
        , test "invalid query int" <| \_ ->
            [testXmlItem0]
                |> query X.int ["RootValues", "SubValues", "Zero"]
                |> Expect.equal (Err <| QueryError ["RootValues", "SubValues", "Zero"])
        , test "valid thenQuery chain" <| \_ ->
            Ok TestType0
                |> thenQuery X.int ["RootValues", "OneHundred"] [testXmlItem0]
                |> thenQuery X.bool ["RootValues", "SheLikesMe"] [testXmlItem0]
                |> ResultE.andMap (subValuesFromRoot [testXmlItem0])
                |> Expect.equal ( Ok <| TestType0 100 False (SubValues
                    2
                    False
                    (Point3 5 -9 4)
                    [ Point3 1 2 3
                    , Point3 4 5 6
                    , Point3 7 8 9
                    ]
                    "ryl"
                ) )
        , test "makeXmlNode" <| \_ ->
            [testXmlItem0]
                |> rootFromItem
                |> Result.map rootToXmlItem
                |> Expect.equal (Ok testXmlItem0)
        ]


testNode0 : Bool -> Node
testNode0 inludeTextNodes =
    let
        mainChildren : List Node
        mainChildren =
            [ Text "   \n        \t     "
            , valueNode "OneHundred" "int" "100"
            , Text "\n\n\n"
            , valueNode "SheLikesMe" "bool" "False"
            , valuesNode "SubValues"
                [ valueNode "Two" "int" "2"
                , valueNode "No" "bool" "False"
                , valueNode "BlockPosition" "Point3" "5,-9,4"
                , valueNode "Positions" "string" "1,2,3;4,5,6;7,8,9"
                , valueNode "Str" "string" "ryl"
                ]
            ]
        isNotText : Node -> Bool
        isNotText node =
            case node of
                Element _ _ _ -> True
                Text _ -> False
    in
        mainChildren
            |> List.filter isNotText
            |> valuesNode "RootValues"


testXmlItem0 : XmlItem
testXmlItem0 =
    MultiValues <| Values "RootValues"
        [ OneValue <| Value "OneHundred" "int" "100"
        , OneValue <| Value "SheLikesMe" "bool" "False"
        , MultiValues <| Values "SubValues"
            [ OneValue <| Value "Two" "int" "2"
            , OneValue <| Value "No" "bool" "False"
            , OneValue <| Value "BlockPosition" "Point3" "5,-9,4"
            , OneValue <| Value "Positions" "string" "1,2,3;4,5,6;7,8,9"
            , OneValue <| Value "Str" "string" "ryl"
            ]
        ]


type alias TestType0 =
    { int : Int
    , bool : Bool
    , subvalues : SubValues
    }


type alias SubValues =
    { int : Int
    , bool : Bool
    , blockpos : Point3
    , p3list : List Point3
    , str : String
    }


rootFromItem : List XmlItem -> Result ConversionError TestType0
rootFromItem items =
    Ok TestType0
        |> thenQuery X.int ["RootValues", "OneHundred"] items
        |> thenQuery X.bool ["RootValues", "SheLikesMe"] items
        |> ResultE.andMap (subValuesFromRoot items)


subValuesFromRoot : List XmlItem -> Result ConversionError SubValues
subValuesFromRoot items =
    Ok SubValues
        |> thenQuery X.int ["RootValues", "SubValues", "Two"] items
        |> thenQuery X.bool ["RootValues", "SubValues", "No"] items
        |> thenQuery X.point3 ["RootValues", "SubValues", "BlockPosition"] items
        |> thenQuery X.point3List ["RootValues", "SubValues", "Positions"] items
        |> thenQuery X.string ["RootValues", "SubValues", "Str"] items


rootToXmlItem : TestType0 -> XmlItem
rootToXmlItem root =
    MultiValues <| Values "RootValues"
        [ makeXmlItem "OneHundred" X.int root.int
        , makeXmlItem "SheLikesMe" X.bool root.bool
        , MultiValues <| Values "SubValues"
            [ makeXmlItem "Two" X.int root.subvalues.int
            , makeXmlItem "No" X.bool root.subvalues.bool
            , makeXmlItem "BlockPosition" X.point3 root.subvalues.blockpos
            , makeXmlItem "Positions" X.point3List root.subvalues.p3list
            , makeXmlItem "Str" X.string root.subvalues.str
            ]
        ]


valueNode : String -> String -> String -> Node
valueNode name typeName value =
    Element
        "Value"
        [ Attribute "Name" name
        , Attribute "Type" typeName
        , Attribute "Value" value
        ]
        []


valuesNode : String -> List Node -> Node
valuesNode name children =
    Element "Values" [Attribute "Name" name] children
