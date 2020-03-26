module TestWorld exposing (suite)

import Expect exposing (Expectation, equal)
import Fuzz exposing (Fuzzer, int, list, string)
import Test exposing (Test, test, describe)

import Result.Extra as ResultE
import Vector3 exposing (Vector3)

import ProjectFile.XmlItem as X exposing (XmlItem(..))
import World exposing (World)
import World.Conversion exposing
    ( ConversionError
    , andThen
    , thenQuery
    , endChain
    )


xmlItemList0 : List XmlItem
xmlItemList0 =
    [ ValueString "AwesomeString" "i <3 ryl"
    , ValueInt "AwesomeInt" 40
    , Values "Stuff"
        [ ValueString "SubString" "hi"
        , ValueFloat "SubFloat" 123.456
        ]
    , ValueString "ListString" "one;two;three;"
    --, ValueString "ListPoint3" "1,2,3;-4,-5,-6;"
    ]


type alias TestType0 =
    { subString : String
    , subFloat : Float
    , awesomeString : String
    , listString : List String
    --, listPoint3 : List (Vec)
    }


testOut0 : TestType0
testOut0 =
    { subString = "hi"
    , subFloat = 123.456
    , awesomeString = "i <3 ryl"
    , listString = ["one", "two", "three"]
    --, listPoint3 =
    --    [ Vector3.from3 1 2 3
    --    , Vector3.from3 -4 -5 -6
    --    ]
    }


suite : Test
suite =
    describe "World.Conversion"
        [ test "Valid query chain" <| \_ ->
            Ok (TestType0, xmlItemList0)
                |> thenQuery X.queryString ["Stuff", "SubString"]
                |> thenQuery X.queryFloat ["Stuff", "SubFloat"]
                |> thenQuery X.queryString ["AwesomeString"]
                |> thenQuery X.queryList Just ";" ["ListString"]
                |> endChain
                |> Expect.equal ( Ok testOut0 )
        ]
