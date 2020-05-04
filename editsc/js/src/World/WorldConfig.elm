module World.WorldConfig exposing
    ( WorldConfig
    , EnvironmentSettings
    , TerrainSettings
    , FlatTerrainSettings
    , IslandSize
    , fromProjectFile
    )

import Result.Extra as ResultE

import ProjectFile exposing (ProjectFile)
import ProjectFile.XmlItem as X exposing (XmlItem, thenQuery, query)
import GameTypes exposing (..)
import World.BlockType exposing (BlockType)
import ConversionError exposing (ConversionError)


type alias WorldConfig =
    { worldName : String
    , gameMode : GameMode
    , adventureRespawnAllowed : Bool
    , adventureSurvivalMechanics : Bool
    , startPositionMode : StartingPositionMode
    , textureFileName : String
    , environment : EnvironmentSettings
    , terrain : TerrainSettings
    , colorPalette : List PaletteEntry
    }


fromProjectFile : ProjectFile -> Result ConversionError WorldConfig
fromProjectFile { subsystems } =
    Ok WorldConfig
        |> thenQuery X.string ["GameInfo", "WorldName"] subsystems
        |> thenQuery X.gameMode ["GameInfo", "GameMode"] subsystems
        |> thenQuery X.bool ["GameInfo", "IsAdventureRespawnAllowed"] subsystems
        |> thenQuery X.bool ["GameInfo", "AreAdventureSurvivalMechanicsEnabled"] subsystems
        |> thenQuery X.startingPositionMode ["GameInfo", "StartingPositionMode"] subsystems
        |> thenQuery X.string ["GameInfo", "BlockTextureName"] subsystems
        |> ResultE.andMap (environmentSettingsFromSubsystems subsystems)
        |> ResultE.andMap (terrainSettingsFromSubsystems subsystems)
        |> ResultE.andMap (colorPaletteFromSubsystems subsystems)


type alias EnvironmentSettings =
    { behavior : EnvironmentBehavior
    , supernaturalCreatures : Bool
    , friendlyFire : Bool
    , tempOffset : Float
    , humidityOffset : Float
    , timeOfDay : TimeOfDayMode
    , weatherEffects : Bool
    }


environmentSettingsFromSubsystems : List XmlItem -> Result ConversionError EnvironmentSettings
environmentSettingsFromSubsystems subsystems =
    Ok EnvironmentSettings
        |> thenQuery X.environmentBehavior ["GameInfo", "EnvironmentBehaviorMode"] subsystems
        |> thenQuery X.bool ["GameInfo", "AreSupernaturalCreaturesEnabled"] subsystems
        |> thenQuery X.bool ["GameInfo", "IsFriendlyFireEnabled"] subsystems
        |> thenQuery X.float ["GameInfo", "TemperatureOffset"] subsystems
        |> thenQuery X.float ["GameInfo", "HumidityOffset"] subsystems
        |> thenQuery X.timeOfDayMode ["GameInfo", "TimeOfDayMode"] subsystems
        |> thenQuery X.bool ["GameInfo", "AreWeatherEffectsEnabled"] subsystems


type alias TerrainSettings =
    { seed : Int
    , seedString : String
    , biomeSize : Float
    , seaLevel : Int
    , generationMode : TerrainGenerationMode
    , flat : FlatTerrainSettings
    , islandSize : IslandSize
    }


terrainSettingsFromSubsystems : List XmlItem -> Result ConversionError TerrainSettings
terrainSettingsFromSubsystems subsystems =
    Ok TerrainSettings
        |> thenQuery X.int ["GameInfo", "WorldSeed"] subsystems
        |> thenQuery X.string ["GameInfo", "WorldSeedString"] subsystems
        |> thenQuery X.float ["GameInfo", "BiomeSize"] subsystems
        |> thenQuery X.int ["GameInfo", "SeaLevelOffset"] subsystems
        |> thenQuery X.terrainGenerationMode ["GameInfo", "TerrainGenerationMode"] subsystems
        |> ResultE.andMap (flatTerrainSettingsFromSubsystems subsystems)
        |> ResultE.andMap (islandSizeFromSubsystems subsystems)


type alias FlatTerrainSettings =
    { height : Int
    , landBlock : BlockType
    , oceanBlock : BlockType
    , shoreRoughness : Float
    }


flatTerrainSettingsFromSubsystems : List XmlItem -> Result ConversionError FlatTerrainSettings
flatTerrainSettingsFromSubsystems subsystems =
    Ok FlatTerrainSettings
        |> thenQuery X.int ["GameInfo", "TerrainLevel"] subsystems
        |> thenQuery X.blockType ["GameInfo", "TerrainBlockIndex"] subsystems
        |> thenQuery X.blockType ["GameInfo", "TerrainOceanBlockIndex"] subsystems
        |> thenQuery X.float ["GameInfo", "ShoreRoughness"] subsystems


type alias IslandSize =
    { northSouth : Float
    , eastWest : Float
    }


islandSizeFromSubsystems : List XmlItem -> Result ConversionError IslandSize
islandSizeFromSubsystems subsystems =
    case ( query X.vector2 ["GameInfo", "IslandSize"] subsystems ) of
        Ok vector ->
            Ok <| IslandSize vector.x vector.y
        Err error ->
            Err error


colorPaletteFromSubsystems : List XmlItem -> Result ConversionError ( List PaletteEntry )
colorPaletteFromSubsystems subsystems =
    let
        q t name =
            query t [ "GameInfo", "Palette", name ] subsystems
    in
        case ( q X.paletteColors "Colors", q X.strList "Names" ) of
            ( Ok colors, Ok names ) ->
                Ok <| List.map2 PaletteEntry colors names

            ( Err err, _ ) ->
                Err err

            ( _, Err err ) ->
                Err err
