module World exposing
    ( World
    , fromProjectFile
    , fromXmlString
    , toXmlString
    , toProjectFile
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
import ProjectFile.XmlItem as X exposing (val, vals, query)
import ConversionError exposing (ConversionError(..))


type alias World =
    { currentVersion : GameVersion
    , guid : String
    , config : WorldConfig
    , originalVersion : GameVersion
    --, entities : List (Entity {})
    --, blockData : List BlockDataEntry
    }


fromProjectFile : ProjectFile -> Result ConversionError World
fromProjectFile projectFile =
    Ok World
        |> ResultE.andMap (GameVersion.fromString projectFile.version |> Result.fromMaybe InvalidVersion)
        |> ResultE.andMap (Ok projectFile.guid)
        |> ResultE.andMap (WorldConfig.fromProjectFile projectFile)
        |> ResultE.andMap (query X.gameVersion ["GameInfo","OriginalSerializationVersion"] projectFile.subsystems)


fromXmlString : String -> Result ConversionError World
fromXmlString string =
    string
        |> ProjectFile.fromXmlString
        |> Result.andThen fromProjectFile


toProjectFile : World -> ProjectFile
toProjectFile world =
    { subsystems =
        [ vals "GameInfo"
            [ val X.string "WorldName" world.config.worldName
            , val X.gameMode "GameMode" world.config.gameMode
            , val X.bool "IsAdventureRespawnAllowed" world.config.adventureRespawnAllowed
            , val X.bool "AreAdventureSurvivalMechanicsEnabled" world.config.adventureSurvivalMechanics
            , val X.startingPositionMode "StartingPositionMode" world.config.startPositionMode
            , val X.string "BlockTextureName" world.config.textureFileName
            , val X.double "TotalElapsedGameTime" world.config.elapsedTime

            , val X.environmentBehavior "EnvironmentBehaviorMode" world.config.environment.behavior
            , val X.bool "AreSupernaturalCreaturesEnabled" world.config.environment.supernaturalCreatures
            , val X.bool "IsFriendlyFireEnabled" world.config.environment.friendlyFire
            , val X.float "TemperatureOffset" world.config.environment.tempOffset
            , val X.float "HumidityOffset" world.config.environment.humidityOffset
            , val X.timeOfDayMode "TimeOfDayMode" world.config.environment.timeOfDay
            , val X.bool "AreWeatherEffectsEnabled" world.config.environment.weatherEffects

            , val X.int "WorldSeed" world.config.terrain.seed
            , val X.string "WorldSeedString" world.config.terrain.seedString
            , val X.float "BiomeSize" world.config.terrain.biomeSize
            , val X.int "SeaLevelOffset" world.config.terrain.seaLevel
            , val X.terrainGenerationMode "TerrainGenerationMode" world.config.terrain.generationMode

            , val X.int "TerrainLevel" world.config.terrain.flat.height
            , val X.blockType "TerrainBlockIndex" world.config.terrain.flat.landBlock
            , val X.blockType "TerrainOceanBlockIndex" world.config.terrain.flat.oceanBlock
            , val X.float "ShoreRoughness" world.config.terrain.flat.shoreRoughness

            , val X.vector2 "IslandSize"
                { x = world.config.terrain.islandSize.northSouth
                , y = world.config.terrain.islandSize.eastWest
                }

            , vals "Palette"
                [ val X.paletteColors "Colors" <| List.map .color world.config.colorPalette
                , val X.strList "Names" <| List.map .name world.config.colorPalette
                ]

            , val X.gameVersion "OriginalSerializationVersion" world.originalVersion
            ]
        ]

    , entities = []
    , version = GameVersion.toString world.currentVersion
    , guid = world.guid
    }


toXmlString : World -> String
toXmlString =
    toProjectFile >> ProjectFile.toXmlString
