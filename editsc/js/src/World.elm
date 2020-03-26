module World exposing
    ( World
--    , fromProjectFile
    )

import Vector2 exposing (Vector2)
import Vector3 exposing (Vector3)
import Vector4 exposing (Vector4)
import Result.Extra as ResultE

import World.Blocks as Blocks exposing (BlockDataEntry)
import World.BlockType exposing (BlockType)
import World.Conversion exposing (ConversionError(..))
import World.GameVersion as GameVersion exposing (GameVersion)
import World.WorldConfig as WorldConfig exposing (WorldConfig)
import World.Entity as Entity exposing (Entity)
import GameTypes exposing (GameMode(..), PlayerClass(..))
import ProjectFile exposing (ProjectFile)


type alias World =
    { currentVersion : GameVersion
    , guid : String
    , config : WorldConfig
    , entities : List (Entity {})
    , blockData : List BlockDataEntry
    , originalVersion : GameVersion
    }


{-fromProjectFile : ProjectFile -> Result ConversionError World
fromProjectFile projectFile =
    Ok World
        |> ResultE.andMap (GameVersion.fromString projectFile.version >> Result.fromMaybe InvalidVersionValue)
        |> ResultE.andMap (Ok projectFile.guid)
        |> ResultE.andMap (WorldConfig.fromProjectFile projectFile)
        |> ResultE.andMap (Entity.listFromProjectFile projectFile)
        |> ResultE.andMap (Blocks.dataEntriesFromProjectFile projectFile)
        |> ResultE.andMap (originalVersionFromProjectFile projectFile)
-}
