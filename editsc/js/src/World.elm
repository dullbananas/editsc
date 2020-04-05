module World exposing
    ( World
    , fromProjectFile
    , fromXmlString
    )

import Result.Extra as ResultE
import XmlParser

import World.Blocks as Blocks exposing (BlockDataEntry)
import World.BlockType exposing (BlockType)
import World.GameVersion as GameVersion exposing (GameVersion)
import World.WorldConfig as WorldConfig exposing (WorldConfig)
import World.Entity as Entity exposing (Entity)
import GameTypes exposing (..)
import ProjectFile exposing (ProjectFile)
import ConversionError exposing (ConversionError(..))


type alias World =
    { currentVersion : GameVersion
    , guid : String
    , config : WorldConfig
    --, originalVersion : GameVersion
    --, entities : List (Entity {})
    --, blockData : List BlockDataEntry
    }


fromProjectFile : ProjectFile -> Result ConversionError World
fromProjectFile projectFile =
    Ok World
        |> ResultE.andMap (GameVersion.fromString projectFile.version |> Result.fromMaybe InvalidVersion)
        |> ResultE.andMap (Ok projectFile.guid)
        |> ResultE.andMap (WorldConfig.fromProjectFile projectFile)


fromXmlString : String -> Result ConversionError World
fromXmlString string =
    string
        |> ProjectFile.fromXmlString
        |> Result.andThen fromProjectFile
