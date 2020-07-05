module BlocksData exposing
    ( BlockType
    , ParseError
    , RequestResult
    , request
    , parse
    )

import Http
import XmlParser as Xml
import Parser
import Parser.Advanced
import Dict exposing (Dict)
import Maybe.Extra as MaybeE


type alias BlockType =
    { id : Int
    , name : String
    }


type alias RequestResult =
    Result Http.Error String


request : ( RequestResult -> msg ) -> Cmd msg
request expect =
    Http.get
        { url = "../static/BlocksData.xml"
        , expect = Http.expectString expect
        }


type alias ParseError =
    List ( Parser.Advanced.DeadEnd String Parser.Problem )


parse : String -> Result ParseError ( List BlockType )
parse =
    Xml.parse
        >> Result.map ( .root >> parseHelp )


parseHelp : Xml.Node -> List BlockType
parseHelp root =
    case root of
        Xml.Element _ _ nodes ->
            List.filterMap fromNode nodes

        _ ->
            []


fromNode : Xml.Node -> Maybe BlockType
fromNode node =
    case node of
        Xml.Element _ attrs _ ->
            let
                dict : Dict String String
                dict =
                    attrsDict attrs

                get : String -> ( String -> Maybe a ) -> Maybe a
                get key f =
                    Dict.get key dict
                        |> Maybe.andThen f
            in
            Just BlockType
                |> MaybeE.andMap ( get "BlockId" String.toInt )
                |> MaybeE.andMap ( get "Name" Just )

        _ ->
            Nothing


attrsDict : List ( Xml.Attribute ) -> Dict String String
attrsDict =
    List.map ( \{ name, value } -> ( name, value ) )
        >> Dict.fromList
