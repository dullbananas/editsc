module TestProjectFile exposing (suite)

import Expect exposing (Expectation, equal)
import Fuzz exposing (Fuzzer, int, list, string)
import Test exposing (Test, test, describe)

import Vector3 exposing (Vector3)
import Vector4 exposing (Vector4)

import ProjectFile exposing
    ( XMLItem(..)
    , ProjectEntity
    , ProjectFile
    , parseFile
    , toXmlString
    , decodeValue
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
import GameTypes exposing (GameMode(..), PlayerType(..))


testStr0 : String
testStr0 =
    """
    <Project Guid="AAAAAAAA" Name="GameProject" Version="2.2">
        <Subsystems>
            <Value Name="HelloWorld" Type="string" Value="hello world"/>
            <Values Name="Subsystem0">
                <Value Name="Bool" Type="bool" Value="True"/>
                <Value Name="NumInt" Type="int" Value="7"/>
                <Value Name="NumDouble" Type="double" Value="12345.123456789"/>
                <Value Name="NumLong" Type="long" Value="123456789"/>
                <Value Name="NumFloat" Type="float" Value="12345.12345"/>
                <Value Name="NumsVector3" Type="Vector3" Value="-77.7,9.8,100"/>
                <Value Name="NumsPoint3" Type="Point3" Value="-777,98,100"/>
                <Value Name="NumsQuaternion" Type="Quaternion" Value="-77.7,9.8,100,1.23456789"/>
                <Value Name="String" Type="string" Value="&lt;3 ryl"/>
                <Value Name="GameMode" Type="Game.GameMode" Value="Creative"/>
                <Value Name="GamePlayerClass" Type="Game.PlayerClass" Value="Male"/>
            </Values>
            <Values Name="Subsystem1">
                <Value Name="DullBananasHasAGirlfriend" Type="bool" Value="False"/>
                <Values Name="SubValues">
                    <Value Name="Num0" Type="int" Value="0"/>
                    <Value Name="Num1" Type="int" Value="1"/>
                    <Value Name="Num2" Type="int" Value="2"/>
                </Values>
            </Values>
        </Subsystems>
        <Entities>
            <Entity Id="7" Guid="AAAAAAAA" Name="Microwave">
                <Values Name="Sound">
                    <Value Name="SoundsProduced" Type="string" Value="MMMMMMMM"/>
                </Values>
            </Entity>
            <Entity Id="9" Guid="BBBBBBBB" Name="Hi">
                <Values Name="AAAAAAAA">
                    <Value Name="AAAAAAAA" Type="string" Value="AAAAAAAA"/>
                </Values>
            </Entity>
        </Entities>
    </Project>
    """

testOutput0 : ProjectFile
testOutput0 =
    let
        subsystems =
            [ ValueString "HelloWorld" "hello world"
            , Values "Subsystem0"
                [ ValueBool "Bool" True
                , ValueInt "NumInt" 7
                , ValueDouble "NumDouble" 12345.123456789
                , ValueLong "NumLong" 123456789
                , ValueFloat "NumFloat" 12345.12345
                , ValueVector3 "NumsVector3" -77.7 9.8 100.0
                , ValuePoint3 "NumsPoint3" -777 98 100
                , ValueQuaternion "NumsQuaternion" -77.7 9.8 100.0 1.23456789
                , ValueString "String" "<3 ryl"
                , ValueGameMode "GameMode" Creative
                , ValuePlayerClass "GamePlayerClass" Male
                ]
            , Values "Subsystem1"
                [ ValueBool "DullBananasHasAGirlfriend" False
                , Values "SubValues"
                    [ ValueInt "Num0" 0
                    , ValueInt "Num1" 1
                    , ValueInt "Num2" 2
                    ]
                ]
            ]
        entities =
            [ ProjectEntity "7" "AAAAAAAA" "Microwave"
                [ Values "Sound"
                    [ ValueString "SoundsProduced" "MMMMMMMM"
                    ]
                ]
            , ProjectEntity "9" "BBBBBBBB" "Hi"
                [ Values "AAAAAAAA"
                    [ ValueString "AAAAAAAA" "AAAAAAAA"
                    ]
                ]
            ]
    in
        ProjectFile subsystems entities "2.2" "AAAAAAAA"

-- TODO: test game input devices

suite : Test
suite =
    describe "The Parsing module"
        [ describe "decodeValue"
            [ describe "Utility functions used by decodeValue"
                [ test "splitter: 3 integers" <| \_ ->
                    let
                        wrapper list =
                            case list of
                                [a,b,c] -> Just (ValuePoint3 "name" a b c)
                                _ -> Nothing
                    in
                        ProjectFile.splitter wrapper 3 String.toInt "-1,2,-31"
                            |> Expect.equal ( Just (ValuePoint3 "name" -1 2 -31) )
                ]
            , test "Normal integers" <| \_ ->
                decodeValue "ILLUSION" "int" "100"
                    |> Expect.equal ( Just (ValueInt "ILLUSION" 100) )
            , test "Long integers" <| \_ ->
                decodeValue "SPEECH" "long" "100"
                    |> Expect.equal ( Just (ValueLong "SPEECH" 100) )
            , test "Normal floats" <| \_ ->
                decodeValue "Pi" "float" "3.14"
                    |> Expect.equal ( Just (ValueFloat "Pi" 3.14) )
            , test "Double floats" <| \_ ->
                decodeValue "Pi" "double" "3.14159"
                    |> Expect.equal ( Just (ValueDouble "Pi" 3.14159) )
            , test "Boolean" <| \_ ->
                decodeValue "BooleanValue" "bool" "True"
                    |> Expect.equal ( Just (ValueBool "BooleanValue" True) )
            , test "Point3" <| \_ ->
                decodeValue "Point3Value" "Point3" "100,-3,90"
                    |> Expect.equal ( Just (ValuePoint3 "Point3Value" 100 -3 90) )
            , test "Vector3" <| \_ ->
                decodeValue "Vector3Value" "Vector3" "10.9,8,-0.886"
                    |> Expect.equal ( Just (ValueVector3 "Vector3Value" 10.9 8.0 -0.886) )
            , test "Quaternion" <| \_ ->
                decodeValue "QuaternionValue" "Quaternion" "100.1,-0.9253254,0,1000"
                    |> Expect.equal ( Just (ValueQuaternion "QuaternionValue" 100.1 -0.9253254 0.0 1000.0) )
            , test "String" <| \_ ->
                decodeValue "ImGonnaSayTheNWord" "string" "null"
                    |> Expect.equal ( Just (ValueString "ImGonnaSayTheNWord" "null") )
            , test "Game mode" <| \_ ->
                decodeValue "GameModeValue" "Game.GameMode" "Creative"
                    |> Expect.equal ( Just (ValueGameMode "GameModeValue" Creative) )
            , test "Player class" <| \_ ->
                decodeValue "IHaveFeelingsForA" "Game.PlayerClass" "Female"
                    |> Expect.equal ( Just (ValuePlayerClass "IHaveFeelingsForA" Female) )
            ]
        , describe "parseFile"
            [ test "converting a string to a ProjectFile" <| \_ ->
                testStr0
                    |> parseFile
                    |> Expect.equal (Ok testOutput0)
            ]
        , describe "toXmlString"
            [ test "converting a ProjectFile to a string then back to a ProjectFile" <| \_ ->
                testOutput0
                    |> toXmlString
                    |> parseFile
                    |> Expect.equal (Ok testOutput0)
            ]
        , describe "queryXmlItem"
            [ test "valid path with 1 name" <| \_ ->
                testOutput0.subsystems
                    |> queryXmlItem ["HelloWorld"]
                    |> Expect.equal ( Just (ValueString "HelloWorld" "hello world") )
            , test "valid path with 2 names" <| \_ ->
                testOutput0.subsystems
                    |> queryXmlItem ["Subsystem0", "NumInt"]
                    |> Expect.equal ( Just (ValueInt "NumInt" 7 ) )
            , test "valid path with 3 names" <| \_ ->
                testOutput0.subsystems
                    |> queryXmlItem ["Subsystem1", "SubValues", "Num2"]
                    |> Expect.equal ( Just (ValueInt "Num2" 2 ) )
            , test "invalid path with 3 names" <| \_ ->
                testOutput0.subsystems
                    |> queryXmlItem ["Subsystem1", "SubValues", "Num7"]
                    |> Expect.equal Nothing
            , test "invalid queryBool" <| \_ ->
                testOutput0.subsystems
                    |> queryBool ["MicrowaveBlockBehavior", "MMMMMMMM"]
                    |> Expect.equal Nothing
            , test "valid queryBool" <| \_ ->
                testOutput0.subsystems
                    |> queryBool ["Subsystem0", "Bool"]
                    |> Expect.equal (Just True)
            , test "valid queryInt" <| \_ ->
                testOutput0.subsystems
                    |> queryInt ["Subsystem0", "NumInt"]
                    |> Expect.equal (Just 7)
            , test "valid queryLong" <| \_ ->
                testOutput0.subsystems
                    |> queryLong ["Subsystem0", "NumLong"]
                    |> Expect.equal (Just 123456789)
            , test "valid queryFloat" <| \_ ->
                testOutput0.subsystems
                    |> queryFloat ["Subsystem0", "NumFloat"]
                    |> Expect.equal (Just 12345.12345)
            , test "valid queryDouble" <| \_ ->
                testOutput0.subsystems
                    |> queryDouble ["Subsystem0", "NumDouble"]
                    |> Expect.equal (Just 12345.123456789)
            , test "valid queryPoint3" <| \_ ->
                testOutput0.subsystems
                    |> queryPoint3 ["Subsystem0", "NumsPoint3"]
                    |> Expect.equal ( Just (Vector3.from3 -777 98 100) )
            , test "valid queryVector3" <| \_ ->
                testOutput0.subsystems
                    |> queryVector3 ["Subsystem0", "NumsVector3"]
                    |> Expect.equal ( Just (Vector3.from3 -77.7 9.8 100) )
            , test "valid queryQuaternion" <| \_ ->
                testOutput0.subsystems
                    |> queryQuaternion ["Subsystem0", "NumsQuaternion"]
                    |> Expect.equal ( Just (Vector4.from4 -77.7 9.8 100 1.23456789) )
            , test "valid queryString" <| \_ ->
                testOutput0.subsystems
                    |> queryString ["Subsystem0", "String"]
                    |> Expect.equal ( Just "<3 ryl" )
            , test "valid queryGameMode" <| \_ ->
                testOutput0.subsystems
                    |> queryGameMode ["Subsystem0", "GameMode"]
                    |> Expect.equal ( Just Creative )
            , test "valid queryPlayerClass" <| \_ ->
                testOutput0.subsystems
                    |> queryPlayerClass ["Subsystem0", "GamePlayerClass"]
                    |> Expect.equal ( Just Male )
            ]
        ]
