module World.WorldConfig exposing
    ( WorldConfig
    , EnvironmentSettings
    , TerrainSettings
    , FlatTerrainSettings
    , IslandTerrainSettings
    , PaletteColor
    , fromProjectFile
    )

import Result.Extra as ResultE

import ProjectFile exposing (ProjectFile)
import ProjectFile.XmlItem as X exposing (XmlItem)
import GameTypes exposing
    ( GameMode(..)
    , StartingPositionMode(..)
    , EnvironmentBehavior(..)
    , TimeOfDayMode(..)
    )
import World.BlockType exposing (BlockType)
import World.Conversion exposing (ConversionError, andThen, thenQuery, endChain)


type alias WorldConfig =
    { worldName : String
    , gameMode : GameMode
    , adventureRespawnAllowed : Bool
    , adventureSurvivalMechanics : Bool
    , startPositionMode : StartingPositionMode
    , textureFileName : String
    , elapsedTime : Float
    , colorPalette : List PaletteColor
    , environment : EnvironmentSettings
    , terrain : TerrainSettings
    }


fromProjectFile : ProjectFile -> Result ConversionError WorldConfig
fromProjectFile {subsystems} =
    Debug.todo "World config from project file"
    {-Ok (WorldConfig, subsystems)
        |> thenQuery X.queryString ["GameInfo", "WorldName"]
        |> thenQuery X.queryGameMode ["GameInfo", "GameMode"]
        |> thenQuery X.queryBool ["GameInfo", "IsAdventureRespawnAllowed"]
        |> thenQuery X.queryBool ["GameInfo", "AreAdventureSurvivalMechanicsEnabled"]
        |> thenQuery X.queryStartingPositionMode ["GameInfo", "StartingPositionMode"]
        |> thenQuery X.queryString ["GameInfo", "BlockTextureName"]
        |> thenQuery X.queryDouble ["GameInfo", "TotalElapsedGameTime"]
        |> andThen colorPaletteFromSubsystems
        |> andThen environmentSettingsFromSubsystems
        |> andThen terrainSettingsFromSubsystems
        |> endChain
-}

type alias EnvironmentSettings =
    { behavior : EnvironmentBehavior
    , supernaturalCreatures : Bool
    , friendlyFire : Bool
    , tempOffset : Float
    , humidityOffset : Float
    , timeOfDay : TimeOfDayMode
    , weatherEffects : Bool
    }


{-environmentSettingsFromSubsystems : List XmlItem -> Result ConversionError EnvironmentSettings
environmentSettingsFromSubsystems subsystems =
    Ok (EnvironmentSettings, subsystems)
        |> thenQuery X.queryEnvironmentBehavior ["GameInfo", "EnvironmentBehaviorMode"]
        |> thenQuery X.queryBool ["GameInfo", "AreSupernaturalCreaturesEnabled"]
        |> thenQuery X.queryBool ["GameInfo", "IsFriendlyFireEnabled"]
        |> thenQuery X.queryFloat ["GameInfo", "TemperatureOffset"]
        |> thenQuery X.queryFloat ["GameInfo", "HumidityOffset"]
        |> thenQuery X.queryTimeOfDayMode ["GameInfo", "TimeOfDayMode"]
        |> thenQuery X.queryBool ["GameInfo", "AreWeatherEffectsEnabled"]
        |> endChain
-}

type alias TerrainSettings =
    { seed : Int
    , seedString : String
    , biomeScale : Float
    , seaLevel : Int
    , flat : Maybe FlatTerrainSettings
    , island : Maybe IslandTerrainSettings
    }


type alias FlatTerrainSettings =
    { height : Int
    , landBlock : BlockType
    , oceanBlock : BlockType
    , shoreRoughness : Float
    }


type alias IslandTerrainSettings =
    { sizeNorthSouth : Int
    , sizeEastWest : Int
    }


type alias PaletteColor =
    { index : Int
    , name : String
    , red : Int
    , green : Int
    , blue : Int
    }
