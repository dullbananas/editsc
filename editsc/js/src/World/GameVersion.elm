module World.GameVersion exposing (GameVersion, fromString, toString, latest)


type GameVersion
    = GameVersion Int Int


latest : GameVersion
latest =
    GameVersion 2 2


fromString : String -> Maybe GameVersion
fromString string =
    case String.split "." string |> List.map String.toInt of
        [Just major, Just minor] ->
            if List.member (major, minor) validVersions then
                Just (GameVersion major minor)
            else
                Nothing
        _ ->
            Nothing


toString : GameVersion -> String
toString version =
    case version of
        GameVersion major minor ->
            [major, minor]
                |> List.map String.fromInt
                |> String.join "."


validVersions : List (Int, Int)
validVersions =
    let
        validMinor1 : List Int
        validMinor1 =
            List.range 0 29
        validMinor2 : List Int
        validMinor2 =
            List.range 0 2
    in
        List.map (Tuple.pair 1) validMinor1 ++ List.map (Tuple.pair 2) validMinor2
