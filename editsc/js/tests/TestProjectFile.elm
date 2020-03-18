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
    )
import World exposing (GameMode(..), PlayerType(..))


testStr0 : String
testStr0 =
    """
    <Project Guid="AAAAAAAA" Name="GameProject" Version="2.2">
        <Subsystems>
            <Values Name="Subsystem0">
                <Value Name="Bool" Type="bool" Value="True"/>
                <Value Name="NumInt" Type="int" Value="7"/>
                <Value Name="NumDouble" Type="double" Value="12345.123456789"/>
                <Value Name="NumLong" Type="long" Value="123456789"/>
                <Value Name="NumFloat" Type="float" Value="12345.12345"/>
                <Value Name="NumsVector3" Type="Vector3" Value="-77.7,9.8,100"/>
                <Value Name="NumsPoint3" Type="Point3" Value="-777,98,100"/>
                <Value Name="NumsQuaternion" Type="Quaternion" Value="-77.7,9.8,100,1.23456789"/>
                <Value Name="String" Type="string" Value="i &lt;3 ryl"/>
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
            [ Values "Subsystem0"
                [ ValueBool "Bool" True
                , ValueInt "NumInt" 7
                , ValueDouble "NumDouble" 12345.123456789
                , ValueLong "NumLong" 123456789
                , ValueFloat "NumFloat" 12345.12345
                , ValueVector3 "NumsVector3" -77.7 9.8 100.0
                , ValuePoint3 "NumsPoint3" -777 98 100
                , ValueQuaternion "NumsQuaternion" -77.7 9.8 100.0 1.23456789
                , ValueString "String" "i <3 ryl"
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
                [ test "splitter: 3 integers" <|
                    \_ ->
                        let
                            wrapper list =
                                case list of
                                    [a,b,c] -> Just (ValuePoint3 "name" a b c)
                                    _ -> Nothing
                        in
                            ProjectFile.splitter wrapper 3 String.toInt "-1,2,-31"
                                |> Expect.equal ( Just (ValuePoint3 "name" -1 2 -31) )
                ]
            , test "Normal integers" <|
                \_ ->
                    decodeValue "ILLUSION" "int" "100"
                        |> Expect.equal ( Just (ValueInt "ILLUSION" 100) )
            , test "Long integers" <|
                \_ ->
                    decodeValue "SPEECH" "long" "100"
                        |> Expect.equal ( Just (ValueLong "SPEECH" 100) )
            , test "Normal floats" <|
                \_ ->
                    decodeValue "Pi" "float" "3.14"
                        |> Expect.equal ( Just (ValueFloat "Pi" 3.14) )
            , test "Double floats" <|
                \_ ->
                    decodeValue "Pi" "double" "3.14159"
                        |> Expect.equal ( Just (ValueDouble "Pi" 3.14159) )
            , test "Boolean" <|
                \_ ->
                    decodeValue "BooleanValue" "bool" "True"
                        |> Expect.equal ( Just (ValueBool "BooleanValue" True) )
            , test "Point3" <|
                \_ ->
                    decodeValue "Point3Value" "Point3" "100,-3,90"
                        |> Expect.equal ( Just (ValuePoint3 "Point3Value" 100 -3 90) )
            , test "Vector3" <|
                \_ ->
                    decodeValue "Vector3Value" "Vector3" "10.9,8,-0.886"
                        |> Expect.equal ( Just (ValueVector3 "Vector3Value" 10.9 8.0 -0.886) )
            , test "Quaternion" <|
                \_ ->
                    decodeValue "QuaternionValue" "Quaternion" "100.1,-0.9253254,0,1000"
                        |> Expect.equal ( Just (ValueQuaternion "QuaternionValue" 100.1 -0.9253254 0.0 1000.0) )
            , test "String" <|
                \_ ->
                    decodeValue "ImGonnaSayTheNWord" "string" "null"
                        |> Expect.equal ( Just (ValueString "ImGonnaSayTheNWord" "null") )
            , test "Game mode" <|
                \_ ->
                    decodeValue "GameModeValue" "Game.GameMode" "Creative"
                        |> Expect.equal ( Just (ValueGameMode "GameModeValue" Creative) )
            , test "Player class" <|
                \_ ->
                    decodeValue "IHaveFeelingsForA" "Game.PlayerClass" "Female"
                        |> Expect.equal ( Just (ValuePlayerClass "IHaveFeelingsForA" Female) )
            ]
        , describe "parseFile"
            [ test "converting a string to a ProjectFile" <|
                \_ ->
                    testStr0
                        |> parseFile
                        |> Expect.equal (Ok testOutput0)
            ]
        , describe "toXmlString"
            [ test "converting a ProjectFile to a string then back to a ProjectFile" <|
                \_ ->
                    testOutput0
                        |> toXmlString
                        |> parseFile
                        |> Expect.equal (Ok testOutput0)
            ]
        ]
