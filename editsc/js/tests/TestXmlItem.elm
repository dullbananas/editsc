module TestXmlItem exposing ( suite )


import Expect exposing ( Expectation )
import Test exposing ( Test, test, describe, only )


import ProjectFile.XmlItem as X


suite : Test
suite =
    describe "ProjectFile.XmlItem"
        [ describe "ValueType"
            [ describe "paletteColors.fromString"
                [ test "No colors defined" <| \_ ->
                    ";;;;;;;;;;;;;;;"
                        |> X.paletteColors.fromString
                        |> Expect.equal ( Just <| List.repeat 16 Nothing )
                ]
            ]
        ]
