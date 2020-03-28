module World.Conversion exposing
    ( ConversionError
    , thenQuery
    , andThen
    , endChain
    )

import Result.Extra as ResultE

import ProjectFile.XmlItem exposing (XmlItem, Query)


type ConversionError
    = ValueError (List String)
    | InvalidVersionValue


thenQuery : Query a -> List String -> Result ConversionError ((a -> b), List XmlItem) -> Result ConversionError (b, List XmlItem)
thenQuery queryValue path =
    andThen (query queryValue path)


query : Query a -> List String -> List XmlItem -> Result ConversionError a
query queryValue path xmlItems =
    case queryValue path xmlItems of
        Just value -> Ok value
        Nothing -> Err (ValueError path)


andThen : (List XmlItem -> Result e a) -> Result e ((a -> b), List XmlItem) -> Result e (b, List XmlItem)
andThen arg previous =
    case ( arg, previous ) of
        ( _, Err x ) ->
            Err x

        ( o, Ok (fn, data) ) ->
            case Result.map fn (o data) of
                Ok value -> Ok (value, data)
                Err error -> Err error


endChain : Result e (a, b) -> Result e a
endChain =
    Result.map (\(a, b) -> a)
