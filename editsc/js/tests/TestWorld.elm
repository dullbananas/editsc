module TestWorld exposing (suite)

import Expect exposing (Expectation, equal)
import Fuzz exposing (Fuzzer, int, list, string)
import Test exposing (Test, test, describe)

import Result.Extra as ResultE

import ProjectFile.XmlItem as X exposing (XmlItem(..), Value, Values)
import ProjectFile exposing (ProjectFile)
import World exposing (World)
import World.GameVersion as GameVersion
import World.BlockType as BlockType exposing (BlockType)
import GameTypes exposing (..)


suite : Test
suite =
    describe "World"
        [ test "From valid project file" <| \_ ->
            projectFile
                |> World.fromProjectFile
                |> Expect.equal (Ok world)
        ]


projectFile : ProjectFile
projectFile =
    ProjectFile
        [ MultiValues <| Values "GameInfo"
            [ OneValue <| Value "WorldName" "string" "Good World"
            , OneValue <| Value "OriginalSetializationVersion" "string" "2.2"
            , OneValue <| Value "GameMode" "Game.GameMode" "Creative"
            , OneValue <| Value "EnvironmentBehaviorMode" "Game.EnvironmentBehaviorMode" "Living"
            , OneValue <| Value "TimeOfDayMode" "Game.TimeOfDayMode" "Changing"
            , OneValue <| Value "AreWeatherEffectsEnabled" "bool" "True"
            , OneValue <| Value "IsAdventureRespawnAllowed" "bool" "True"
            , OneValue <| Value "AreAdventureSurvivalMechanicsEnabled" "bool" "False"
            , OneValue <| Value "AreSupernaturalCreaturesEnabled" "bool" "False"
            , OneValue <| Value "IsFriendlyFireEnabled" "bool" "False"
            , OneValue <| Value "WorldSeedString" "string" "ryl"
            , OneValue <| Value "TerrainGenerationMode" "Game.TerrainGenerationMode" "Flat"
            , OneValue <| Value "IslandSize" "Vector2" "400,400"
            , OneValue <| Value "TerrainLevel" "int" "64"
            , OneValue <| Value "ShoreRoughness" "float" "0.5"
            , OneValue <| Value "TerrainBlockIndex" "int" "0"
            , OneValue <| Value "TerrainOceanBlockIndex" "int" "0"
            , OneValue <| Value "TemperatureOffset" "float" "0"
            , OneValue <| Value "HumidityOffset" "float" "0"
            , OneValue <| Value "SeaLevelOffset" "int" "0"
            , OneValue <| Value "BiomeSize" "float" "1"
            , OneValue <| Value "StartingPositionMode" "Game.StartingPositionMode" "Easy"
            , OneValue <| Value "BlockTextureName" "string" ""
            , MultiValues <| Values "Palette"
                [ OneValue <| Value "Colors" "string" ";0,255,255;255,0,255;;;;;;;;;;;;;"
                , OneValue <| Value "Names" "string" ";;;;;;;;;;;;;;;"
                ]
            , OneValue <| Value "WorldSeed" "int" "10116"
            , OneValue <| Value "TotalElapsedGameTime" "double" "10"
            ]
        ]
        []
        "2.2"
        "9e9a67f8-79df-4d05-8cfa-61bd8095661e"


world : World
world =
    World
        GameVersion.latest
        "9e9a67f8-79df-4d05-8cfa-61bd8095661e"
        { worldName = "Good World"
        , gameMode = Creative
        , adventureRespawnAllowed = True
        , adventureSurvivalMechanics = False
        , startPositionMode = Easy
        , textureFileName = ""
        , elapsedTime = 10.0
        , environment =
            { behavior = Living
            , supernaturalCreatures = False
            , friendlyFire = False
            , tempOffset = 0.0
            , humidityOffset = 0.0
            , timeOfDay = Changing
            , weatherEffects = True
            }
        , terrain =
            { seed = 10116
            , seedString = "ryl"
            , biomeSize = 1.0
            , seaLevel = 0
            , flat =
                { height = 64
                , landBlock = BlockType.air
                , oceanBlock = BlockType.air
                , shoreRoughness = 0.5
                }
            , islandSize = { northSouth = 400.0, eastWest = 400.0 }
            }
        }
